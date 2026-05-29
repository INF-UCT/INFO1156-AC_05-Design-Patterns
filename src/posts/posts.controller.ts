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
import { CommentEntity, CommentEntityBuilder } from "@/posts/entities/comment.entity"
import { LikeEntity, LikeEntityBuilder } from "@/posts/entities/like.entity"
import { PostEntity, PostEntityBuilder } from "@/posts/entities/post.entity"
import { LegacyModerationAdapter } from "@/posts/moderation/legacy-moderation.adapter"
import { PrismaService } from "@/prisma/prisma.service"

import { PostsService } from "@/posts/posts.service"
import {
    AddLikeDto,
    CreateCommentDto,
    CreatePostDto,
    FeedQueryDto,
} from "@/posts/posts.dtos"
import { EventBus } from "@/core/events/EventBus"

// Tu importación del Factory
import { FeedSortFactory } from "./strategies/feed-sort.factory"

@Controller("api/posts")
export class PostsController {
    constructor(
        private readonly postsService: PostsService,
        private readonly prisma: PrismaService,
        private readonly moderationService: LegacyModerationAdapter,
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

        EventBus.getInstance().emit("post.created", {
            eventName: "post.created",
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

        const posts = await this.prisma.post.findMany({
            include: {
                comments: true,
                likes: true,
            },
        })

        const mappedPosts = posts.map((post) => {
            const likesCount = post.likes.reduce(
                (sum, like) => sum + like.weight,
                0,
            )
            const commentsCount = post.comments.length
            const hoursSinceCreated =
                (Date.now() - new Date(post.createdAt).getTime()) / 36_000_00
            const relevanceScore =
                likesCount * 2 +
                commentsCount * 3 -
                Math.floor(hoursSinceCreated)

            const metadata = {
                likesWeights: post.likes.map((like) => like.weight),
                commentLengths: post.comments.map(
                    (comment) => comment.content.length,
                ),
                hourOfCreate: new Date(post.createdAt).getHours(),
            }        

            return new PostEntityBuilder()
                .withId(post.id)
                .withTitle(post.title)
                .withDescription(post.description)
                .withImageUrl(post.imageUrl)
                .withCreatedAt(post.createdAt)
                .withUpdatedAt(post.updatedAt)
                .withLikesCount(likesCount)
                .withCommentsCount(commentsCount)
                .withRelevanceScore(relevanceScore)
                .withSource("feed-controller")
                .withMetadata(metadata)
                .withRankingMode(mode)
                .build()
        })

        const strategy = FeedSortFactory.getStrategy(mode)
        const sorted = strategy.sort(mappedPosts)

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

        // CORREGIDO: Se removió el duplicado 'prisma.prisma'
        const comments = await this.prisma.comment.findMany({
            where: { postId: id },
            orderBy: { createdAt: "desc" },
        })

        const entities = comments.map(
            (comment) =>
                new CommentEntityBuilder()
                    .withId(comment.id)
                    .withPostId(comment.postId)
                    .withContent(comment.content)
                    .withCreatedAt(comment.createdAt)
                    .withUpdatedAt(comment.updatedAt)
                    .withSource(comment.source)
                    .withModerationState("approved")
                    .withLanguage("es")
                    .withMetadata({
                        chars: comment.content.length,
                        source: comment.source,
                    })
                    .build(),
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

        if (this.moderationService.isBlocked(body.content)) {
            throw new BadRequestException("Comment blocked by moderation")
        }

        const created = await this.prisma.comment.create({
            data: {
                postId: id,
                content: body.content,
                source: "controller",
            },
        })

        // CORREGIDO: Migrado a Builder para evitar conflictos de firmas con los tipos del equipo
        const entity = new CommentEntityBuilder()
            .withId(created.id)
            .withPostId(created.postId)
            .withContent(created.content)
            .withCreatedAt(created.createdAt)
            .withUpdatedAt(created.updatedAt)
            .withSource(created.source)
            .withModerationState("approved")
            .withLanguage("es")
            .withMetadata({ source: "legacy" })
            .build()

        EventBus.getInstance().emit("comment.created", {
            eventName: "comment.created",
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

        const like = await this.prisma.like.create({
            data: {
                postId: id,
                reactionType,
                weight,
                source: "controller",
            },
        })

        const entity = new LikeEntityBuilder()
            .withId(like.id)
            .withPostId(like.postId)
            .withReactionType(like.reactionType)
            .withWeight(like.weight)
            .withSource(like.source)
            .withCreatedAt(like.createdAt)
            .withShouldAffectRelevanceScore(true)
            .withMetadata({ from: "manual", r: like.reactionType })
            .build()

        EventBus.getInstance().emit("like.created", {
            eventName: "like.created",
            postId: id,
            likeId: like.id,
            reactionType: reactionType,
        })

        return {
            success: true,
            like: entity,
        }
    }
}