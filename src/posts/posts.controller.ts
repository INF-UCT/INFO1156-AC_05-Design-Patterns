import {
    BadRequestException,
    Body,
    Controller,
    Get,
    Inject,
    NotFoundException,
    Param,
    ParseIntPipe,
    Post,
    Query,
} from "@nestjs/common"
import { CommentEntity } from "@/posts/entities/comment.entity"
import { LikeEntity } from "@/posts/entities/like.entity"
import { PostEntity } from "@/posts/entities/post.entity"
import { PostBuilder } from "@/posts/entities/post.builder"
import { CommentBuilder } from "@/posts/entities/comment.builder"
import { LikeBuilder } from "@/posts/entities/like.builder"
import {
    MODERATION_PORT,
    ModerationPort,
} from "@/posts/moderation/moderation.port"
import { PrismaService } from "@/prisma/prisma.service"

import { PostsService } from "@/posts/posts.service"
import { RankingService } from "@/posts/ranking/ranking.service"
import { PostEventsFacade } from "@/posts/events.facade"
import {
    AddLikeDto,
    CreateCommentDto,
    CreatePostDto,
    FeedQueryDto,
} from "@/posts/posts.dtos"

@Controller("api/posts")
export class PostsController {
    constructor(
        private readonly postsService: PostsService,
        private readonly prisma: PrismaService,
        private readonly rankingService: RankingService,
        @Inject(MODERATION_PORT)
        private readonly moderation: ModerationPort,
        private readonly eventsFacade: PostEventsFacade,
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

        // Patrón Facade: Se oculta la complejidad del despacho de eventos
        this.eventsFacade.dispatchPostCreated(created.id, created.title)

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
            // 36_000_00 = 1 hora en milisegundos.
            const hoursSinceCreated =
                (Date.now() - new Date(post.createdAt).getTime()) / 36_000_00
            const relevanceScore =
                likesCount * 2 +
                commentsCount * 3 -
                Math.floor(hoursSinceCreated)

            const tags = post.title.split(" ").filter((word) => word.length > 4)
            const metadata = {
                likesWeights: post.likes.map((like) => like.weight),
                commentLengths: post.comments.map(
                    (comment) => comment.content.length,
                ),
                hourOfCreate: new Date(post.createdAt).getHours(),
            }

            // Patrón Builder: Creación fluida de la entidad evitando constructores con muchos parámetros
            return new PostBuilder()
                .setId(post.id)
                .setTitle(post.title)
                .setDescription(post.description)
                .setImageUrl(post.imageUrl)
                .setTimestamps(post.createdAt, post.updatedAt)
                .setMetrics(likesCount, commentsCount)
                .setRelevance(relevanceScore, relevanceScore > 20)
                .setSourceInfo("feed-controller")
                .setTags(tags)
                .setMetadata(metadata)
                .setRankingMode(mode)
                .build()
        })

        // Patrón Strategy: el contexto elige y aplica la estrategia de ranking
        // según el modo, sin lógica de ordenamiento embebida en el controller.
        const sorted = this.rankingService.rank(mode, mappedPosts)

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

        const entities = comments.map((comment) =>
            new CommentBuilder()
                .setId(comment.id)
                .setPostId(comment.postId)
                .setContent(comment.content)
                .setTimestamps(comment.createdAt, comment.updatedAt)
                .setSource(comment.source)
                .setModerationInfo("approved", comment.content.length > 80 ? 70 : 45)
                .setIsPinned(comment.content.length % 2 === 0)
                .setLanguage("es")
                .setMetadata({ chars: comment.content.length, source: comment.source })
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

        const moderationReview = this.moderation.reviewComment(body.content)
        if (moderationReview.blocked) {
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

        const entity = new CommentBuilder()
            .setId(created.id)
            .setPostId(created.postId)
            .setContent(created.content)
            .setTimestamps(created.createdAt, created.updatedAt)
            .setSource(created.source)
            .setModerationInfo("approved", created.content.length > 60 ? 80 : 40)
            .setIsPinned(false)
            .setLanguage("es")
            .setMetadata({ moderation: "approved", source: "legacy" })
            .build()

        this.eventsFacade.dispatchCommentCreated(id, created.id)

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

        const entity = new LikeBuilder()
            .setId(like.id)
            .setPostId(like.postId)
            .setReactionInfo(like.reactionType, like.weight)
            .setSource(like.source)
            .setCreatedAt(like.createdAt)
            .setStrengthAndRelevance(like.weight > 2 ? "strong" : "normal", true)
            .setMetadata({ from: "manual", r: like.reactionType })
            .build()

        this.eventsFacade.dispatchLikeAdded(id, like.id, reactionType)

        return {
            success: true,
            like: entity,
        }
    }
}
