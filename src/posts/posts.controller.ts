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
import { PostEntityBuilder } from "@/posts/builders/post.entity.builder"
import { CommentEntityBuilder } from "@/posts/builders/comment.entity.builder"
import { LikeEntityBuilder } from "@/posts/builders/like.entity.builder"
import { PrismaService } from "@/prisma/prisma.service"
import { IModerationService } from "@/posts/interfaces/moderation.interface"

import { PostsService } from "@/posts/posts.service"
import {
    AddLikeDto,
    CreateCommentDto,
    CreatePostDto,
    FeedQueryDto,
} from "@/posts/posts.dtos"
import { FeedOrderingContext } from "@/posts/strategies/feed-ordering.context"

const logDomainEvent = (
    eventName: string,
    payload: Record<string, unknown>,
) => {
    console.log(`[event:${eventName}]`, payload)
}

const fakeSendNotification = (
    type: string,
    payload: Record<string, unknown>,
) => {
    console.log(`[notify:${type}]`, payload)
}

const fakeRecomputeSomething = (postId: number) => {
    console.log(`[recompute] postId=${postId}`)
}

@Controller("api/posts")
export class PostsController {
    private readonly feedOrderingContext = new FeedOrderingContext()

    constructor(
        private readonly postsService: PostsService,
        private readonly prisma: PrismaService,
        private readonly moderationService: IModerationService,
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

        logDomainEvent("post.created", {
            postId: created.id,
            title: created.title,
        })
        fakeSendNotification("post", { postId: created.id })
        fakeRecomputeSomething(created.id)

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

        const posts = await this.prisma.post.findMany({
            include: {
                comments: true,
                likes: true,
            },
        })

        const mappedPosts = posts.map((post) => {
            return new PostEntityBuilder()
                .setId(post.id)
                .setTitle(post.title)
                .setDescription(post.description)
                .setImageUrl(post.imageUrl)
                .setDates(post.createdAt, post.updatedAt)
                .calculateCounts(post.likes, post.comments)
                .calculateRelevance(post.createdAt)
                .calculateTags(post.title)
                .calculateMetadata(post.likes, post.comments)
                .setRankingMode(mode)
                .build()
        })

        let sorted = [...mappedPosts]

        const strategy = this.feedOrderingContext.getStrategy(mode)
        sorted = strategy.sort(sorted)

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

        const comments = await this.prisma.comment.findMany({
            where: { postId: id },
            orderBy: { createdAt: "desc" },
        })

        const entities = comments.map((comment) => {
            return new CommentEntityBuilder()
                .setId(comment.id)
                .setPostId(comment.postId)
                .setContent(comment.content)
                .setDates(comment.createdAt, comment.updatedAt)
                .setSource(comment.source)
                .setModerationState("approved")
                .calculateSentimentScore(comment.content.length, 80)
                .calculateIsPinned(comment.content.length)
                .setMetadata({ chars: comment.content.length, source: comment.source })
                .build()
        })

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

        const moderationResult = this.moderationService.review(body.content)

        if (moderationResult.isBlocked) {
            throw new BadRequestException("Comment blocked by moderation")
        }

        const moderation = moderationResult.rawResult

        // Se persiste la información en la base de datos
        const created = await this.prisma.comment.create({
            data: {
                postId: id,
                content: body.content,
                source: "controller",
            },
        })

        const entity = new CommentEntityBuilder()
            .setId(created.id)
            .setPostId(created.postId)
            .setContent(created.content)
            .setDates(created.createdAt, created.updatedAt)
            .setSource(created.source)
            .setModerationState("approved")
            .calculateSentimentScore(created.content.length, 60)
            .setIsPinned(false)
            .setMetadata({ moderation, source: "legacy" })
            .build()

        logDomainEvent("comment.created", { postId: id, commentId: created.id })
        fakeSendNotification("comment", { postId: id })
        fakeRecomputeSomething(id)

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

        const like = await this.prisma.like.create({
            data: {
                postId: id,
                reactionType,
                weight,
                source: "controller",
            },
        })

        const entity = new LikeEntityBuilder()
            .setId(like.id)
            .setPostId(like.postId)
            .setReactionType(reactionType)
            .setWeight(weight)
            .setSource("controller")
            .setCreatedAt(like.createdAt)
            .calculateStrengthLabel()
            .setMetadata({ from: "manual", r: reactionType })
            .build()

        logDomainEvent("like.created", { postId: id, likeId: like.id })
        fakeSendNotification("like", { postId: id, reactionType })
        fakeRecomputeSomething(id)

        return {
            success: true,
            like: entity,
        }
    }
}
