import {
    BadRequestException,
    Body,
    Controller,
    Get,
    NotFoundException,
    Param,
    ParseIntPipe,
    Post,
    Query,
} from "@nestjs/common"
import { PostEventPublisher } from "@/posts/events/post-event.publisher"
import { PostEntityFactory } from "@/posts/factories/post-entity.factory"
import { ModerationAdapter } from "@/posts/moderation.adapter"

import { PostsService } from "@/posts/posts.service"
import {
    AddLikeDto,
    CreateCommentDto,
    CreatePostDto,
    FeedQueryDto,
} from "@/posts/posts.dtos"
import { PostSortContext } from "@/posts/sorting.strategy"

@Controller("api/posts")
export class PostsController {
    constructor(
        private readonly postsService: PostsService,
        private readonly postEntityFactory: PostEntityFactory,
        private readonly postEventPublisher: PostEventPublisher,
    ) {}

    @Post()
    async create(@Body() body: CreatePostDto) {
        if (body.title.length < 3 || body.title.length > 120) {
            throw new BadRequestException(
                "Title length must be between 3 and 120",
            )
        }

        if (!body.imageUrl.startsWith("http")) {
            throw new BadRequestException("Image URL must start with http")
        }

        const created = await this.postsService.create(body)

        this.postEventPublisher.publish("post.created", {
            postId: created.id,
            title: created.title,
        })

        return {
            ok: true,
            payload: created,
        }
    }

    @Get()
    async findAll() {
        const posts = await this.postsService.findAll()

        return {
            total: posts.length,
            items: posts,
        }
    }

    @Get("feed")
    async getFeed(@Query() query: FeedQueryDto) {
        const mode = query.mode || "latest"

        const posts = await this.postsService.findFeedPosts()

        const mappedPosts = posts.map((post) =>
            this.postEntityFactory.createFeedPost(post, mode),
        )

        const sortContext = new PostSortContext(mode)
        const sorted = sortContext.sort([...mappedPosts])

        return {
            mode,
            count: sorted.length,
            rows: sorted,
        }
    }

    @Get(":id/comments")
    async getComments(@Param("id", ParseIntPipe) id: number) {
        const post = await this.postsService.findById(id)

        if (!post) {
            throw new NotFoundException("Post not found")
        }

        const comments = await this.postsService.findCommentsByPostId(id)

        const entities = comments.map((comment) =>
            this.postEntityFactory.createStoredComment(comment),
        )

        return {
            total_comments: entities.length,
            comments: entities,
        }
    }

    @Post(":id/comments")
    async createComment(
        @Param("id", ParseIntPipe) id: number,
        @Body() body: CreateCommentDto,
    ) {
        const post = await this.postsService.findById(id)

        if (!post) {
            throw new NotFoundException("Post not found")
        }

        if (body.content.length < 2) {
            throw new BadRequestException("Comment too short")
        }

        const { isBlocked, rawResult: moderation } = ModerationAdapter.review(
            body.content,
        )

        if (isBlocked) {
            throw new BadRequestException("Comment blocked by moderation")
        }

        const created = await this.postsService.createComment(id, body)

        const entity = this.postEntityFactory.createModeratedComment(
            created,
            moderation,
        )

        this.postEventPublisher.publish("comment.created", {
            postId: id,
            commentId: created.id,
        })

        return {
            message: "comment_created",
            entity,
        }
    }

    @Post(":id/likes")
    async addLike(
        @Param("id", ParseIntPipe) id: number,
        @Body() body: AddLikeDto,
    ) {
        const post = await this.postsService.findById(id)

        if (!post) {
            throw new NotFoundException("Post not found")
        }

        const reactionType = body.reactionType || "like"
        const weight = body.weight || 1

        if (weight < 1) {
            throw new BadRequestException("Weight must be at least 1")
        }

        const like = await this.postsService.addLike(id, {
            reactionType,
            weight,
        })

        const entity = this.postEntityFactory.createLike(like)

        this.postEventPublisher.publish("like.created", {
            postId: id,
            likeId: like.id,
            reactionType,
        })

        return {
            success: true,
            like: entity,
        }
    }
}