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
import { PrismaService } from "@/prisma/prisma.service"
import { PostsService } from "@/posts/posts.service"
import {
    AddLikeDto,
    CreateCommentDto,
    CreatePostDto,
    FeedQueryDto,
} from "@/posts/posts.dtos"

// Adapter
import { LegacyModerationAdapter } from "@/posts/adapters/moderation.adapter"

// Strategy
import { FeedStrategyContext } from "@/posts/strategies/feed-strategy.context"

// Builders
import { PostEntityBuilder } from "@/posts/builders/post-entity.builder"
import { CommentEntityBuilder } from "@/posts/builders/comment-entity.builder"
import { LikeEntityBuilder } from "@/posts/builders/like-entity.builder"

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
        // Adapter: normaliza la interfaz incompatible del cliente legacy
        private readonly moderationAdapter: LegacyModerationAdapter,
        // Strategy: encapsula los distintos algoritmos de ordenamiento del feed
        private readonly feedStrategyContext: FeedStrategyContext,
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

        // Builder: construye cada PostEntity de forma consistente y centralizada
        const mappedPosts = posts.map((post) =>
            new PostEntityBuilder(post).withMode(mode).build(),
        )

        // Strategy: delega el ordenamiento a la estrategia correspondiente al modo
        const strategy = this.feedStrategyContext.resolve(mode)
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

        const comments = await this.prisma.comment.findMany({
            where: { postId: id },
            orderBy: { createdAt: "desc" },
        })

        // Builder: centraliza la construcción de CommentEntity
        const entities = comments.map((comment) =>
            new CommentEntityBuilder(comment)
                .withSource(comment.source)
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

        // Adapter: oculta los tipos de retorno mixtos del cliente legacy
        const moderation = this.moderationAdapter.review(body.content)

        if (moderation.blocked) {
            throw new BadRequestException("Comment blocked by moderation")
        }

        const created = await this.prisma.comment.create({
            data: {
                postId: id,
                content: body.content,
                source: "controller",
            },
        })

        // Builder: construye CommentEntity con metadatos de moderación
        const entity = new CommentEntityBuilder(created)
            .withSource(created.source)
            .withModerationState("approved")
            .withMetadata({ moderation: moderation.reason, source: "legacy" })
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

        // Builder: construye LikeEntity de forma consistente
        const entity = new LikeEntityBuilder(like).build()

        logDomainEvent("like.created", { postId: id, likeId: like.id })
        fakeSendNotification("like", { postId: id, reactionType })
        fakeRecomputeSomething(id)

        return {
            success: true,
            like: entity,
        }
    }
}
