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
import { CommentEntity } from "@/posts/entities/comment.entity"
import { LikeEntity } from "@/posts/entities/like.entity"
import { PostEntity } from "@/posts/entities/post.entity"
import { legacyModerationApi } from "@/posts/legacy-moderation.client"
import { PrismaService } from "@/prisma/prisma.service"

import { PostsService } from "@/posts/posts.service"
import { RankingService } from "@/posts/ranking/ranking.service"
import { ModerationAdapter } from "@/posts/adapters/moderation.adapter"
import { PostFactory } from "@/posts/factories/post.factory"
import { RANKING_CONSTANTS, VALIDATION_CONSTANTS } from "@/posts/constants"
import {
    AddLikeDto,
    CreateCommentDto,
    CreatePostDto,
    FeedQueryDto,
} from "@/posts/posts.dtos"

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
    constructor(
        private readonly postsService: PostsService,
        private readonly prisma: PrismaService,
        private readonly rankingService: RankingService,
        private readonly moderationAdapter: ModerationAdapter,
    ) {}

    @Post()
    async create(@Body() body: CreatePostDto) {
        if (
            body.title.length < RANKING_CONSTANTS.TITLE_MIN_LENGTH ||
            body.title.length > RANKING_CONSTANTS.TITLE_MAX_LENGTH
        ) {
            throw new BadRequestException(
                `Title length must be between ${RANKING_CONSTANTS.TITLE_MIN_LENGTH} and ${RANKING_CONSTANTS.TITLE_MAX_LENGTH}`,
            )
        }

        const isValidUrl = VALIDATION_CONSTANTS.IMAGE_URL_PROTOCOLS.some(
            (protocol) => body.imageUrl.startsWith(protocol),
        )

        if (!isValidUrl) {
            throw new BadRequestException(
                "Image URL must start with http:// or https://",
            )
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

        const postsData = await this.prisma.post.findMany({
            include: {
                comments: true,
                likes: true,
            },
        })

        // Usar PostFactory para enriquecer los posts
        const enrichedPosts = postsData.map((post) =>
            PostFactory.fromDb(post, mode),
        )

        // Usar RankingService para aplicar la estrategia de ranking
        const ranked = this.rankingService.rank(enrichedPosts, mode)

        return {
            mode,
            count: ranked.length,
            rows: ranked,
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

        const entities = comments.map(
            (comment) =>
                new CommentEntity(
                    comment.id,
                    comment.postId,
                    comment.content,
                    comment.createdAt,
                    comment.updatedAt,
                    comment.source,
                    "approved",
                    comment.content.length > 80 ? 70 : 45,
                    comment.content.length % 2 === 0,
                    "es",
                    { chars: comment.content.length, source: comment.source },
                ),
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

        // Usar ModerationAdapter para normalizar respuesta del cliente legacy
        const moderationResult = await this.moderationAdapter.moderate(
            body.content,
        )

        if (moderationResult.action === "block") {
            throw new BadRequestException("Comment blocked by moderation")
        }

        // Se persiste la información en la base de datos
        const created = await this.prisma.comment.create({
            data: {
                postId: id,
                content: body.content,
                source: "controller",
            },
        })

        const entity = new CommentEntity(
            created.id,
            created.postId,
            created.content,
            created.createdAt,
            created.updatedAt,
            created.source,
            moderationResult.action === "review" ? "review" : "approved",
            created.content.length > 60 ? 80 : 40,
            false,
            "es",
            { moderation: moderationResult, source: "adapter" },
        )

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

        const entity = new LikeEntity(
            like.id,
            like.postId,
            like.reactionType,
            like.weight,
            like.source,
            like.createdAt,
            like.weight > 2 ? "strong" : "normal",
            true,
            { from: "manual", r: like.reactionType },
        )

        logDomainEvent("like.created", { postId: id, likeId: like.id })
        fakeSendNotification("like", { postId: id, reactionType })
        fakeRecomputeSomething(id)

        return {
            success: true,
            like: entity,
        }
    }
}
