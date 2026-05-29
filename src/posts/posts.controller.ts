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
import { DomainEventPublisher } from "@/posts/events/domain-event.publisher"
import {
    CONTENT_MODERATOR,
    ContentModerator,
} from "@/posts/moderation/content-moderator.interface"
import { PrismaService } from "@/prisma/prisma.service"

import { PostsService } from "@/posts/posts.service"
import { RankingService } from "@/posts/ranking/ranking.service"
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
        @Inject(CONTENT_MODERATOR)
        private readonly moderator: ContentModerator,
        private readonly events: DomainEventPublisher,
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

        this.events.publish({
            name: "post.created",
            payload: { postId: created.id, title: created.title },
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

            return new PostEntity(
                post.id,
                post.title,
                post.description,
                post.imageUrl,
                post.createdAt,
                post.updatedAt,
                likesCount,
                commentsCount,
                relevanceScore,
                relevanceScore > 20,
                "feed-controller",
                tags,
                metadata,
                mode,
            )
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

        // Patrón Adapter: el moderador expone una interfaz uniforme; el detalle
        // de los tipos mixtos del cliente legacy queda oculto tras el adaptador.
        if (this.moderator.isBlocked(body.content)) {
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
            "approved",
            created.content.length > 60 ? 80 : 40,
            false,
            "es",
            { moderation: "approved", source: "legacy" },
        )

        this.events.publish({
            name: "comment.created",
            payload: { postId: id, commentId: created.id },
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

        this.events.publish({
            name: "like.created",
            payload: { postId: id, likeId: like.id, reactionType },
        })

        return {
            success: true,
            like: entity,
        }
    }
}
