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
} from "@/posts/dto/index"

// ── Patrones de diseño aplicados ───────────────────────────────────────────
// Creacional

import { PostEntityBuilder } from "@/posts/builders/post-entity.builder"
import { CommentEntityBuilder } from "@/posts/builders/comment-entity.builder"
import { LikeEntityBuilder } from "@/posts/builders/like-entity.builder"

// Estructural
import { ModerationAdapter } from "@/posts/adapters/moderation.adapter"
// Comportamental – Strategy
import { FeedSortStrategyFactory } from "@/posts/strategies/feed-sort-factory.strategy"
// Comportamental – Observer
import { DomainEventLogger } from "@/posts/observers/domain-logger.observer"
import { NotificationObserver } from "@/posts/observers/notification.observer"
import { RelevanceRecomputeObserver } from "@/posts/observers/relevance-recompute.observer"
import { PostEventEmitter } from "@/posts/observers/post-emitter.observer"

// ── Bootstrap de patrones ──────────────────────────────────────────────────
const postEvents = new PostEventEmitter()
postEvents.subscribe(new DomainEventLogger())
postEvents.subscribe(new NotificationObserver())
postEvents.subscribe(new RelevanceRecomputeObserver())

const moderation = new ModerationAdapter()

@Controller("api/posts")
export class PostsController {
    constructor(
        private readonly postsService: PostsService,
        private readonly prisma: PrismaService,
    ) {}

    @Post()
    async create(@Body() body: CreatePostDto) {
        const created = await this.postsService.create(body)

        postEvents.emit({
            type: "post.created",
            postId: created.id,
            title: created.title,
        })

        return { ok: true, payload: created }
    }

    @Get()
    async findAll() {
        const posts = await this.postsService.findAll()
        return { total: posts.length, items: posts }
    }

    @Get("feed")
    async getFeed(@Query() query: FeedQueryDto) {
        const mode = query.mode || "latest"

        const posts = await this.prisma.post.findMany({
            include: { comments: true, likes: true },
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

            const tags = post.title.split(" ").filter((w) => w.length > 4)
            const metadata = {
                likesWeights: post.likes.map((l) => l.weight),
                commentLengths: post.comments.map((c) => c.content.length),
                hourOfCreate: new Date(post.createdAt).getHours(),
            }

            // Builder: construcción legible con métodos nombrados
            return new PostEntityBuilder()
                .withId(post.id)
                .withTitle(post.title)
                .withDescription(post.description)
                .withImageUrl(post.imageUrl)
                .withDates(post.createdAt, post.updatedAt)
                .withLikesCount(likesCount)
                .withCommentsCount(commentsCount)
                .withRelevanceScore(relevanceScore)
                .withIsFeatured(relevanceScore > 20)
                .withSource("feed-controller")
                .withTags(tags)
                .withMetadata(metadata)
                .withRankingMode(mode)
                .build()
        })

        // Strategy: delega el ordenamiento sin switch/case
        const strategy = FeedSortStrategyFactory.getStrategy(mode)
        const sorted = strategy.sort(mappedPosts)

        return { mode, count: sorted.length, rows: sorted }
    }

    @Get(":id/comments")
    async getComments(@Param("id", ParseIntPipe) id: number) {
        const post = await this.postsService.findById(id)
        if (!post) throw new NotFoundException("Post not found")

        const comments = await this.prisma.comment.findMany({
            where: { postId: id },
            orderBy: { createdAt: "desc" },
        })

        const entities = comments.map((comment) =>
            // Builder: construcción clara por pasos
            new CommentEntityBuilder()
                .withId(comment.id)
                .withPostId(comment.postId)
                .withContent(comment.content)
                .withDates(comment.createdAt, comment.updatedAt)
                .withSource(comment.source)
                .withModerationState("approved")
                .withSentimentScore(comment.content.length > 80 ? 70 : 45)
                .withIsPinned(comment.content.length % 2 === 0)
                .withLanguage("es")
                .withMetadata({ chars: comment.content.length, source: comment.source })
                .build()
        )

        return { total_comments: entities.length, comments: entities }
    }

    @Post(":id/comments")
    async createComment(
        @Param("id", ParseIntPipe) id: number,
        @Body() body: CreateCommentDto,
    ) {
        const post = await this.postsService.findById(id)
        if (!post) throw new NotFoundException("Post not found")

        // Adapter: interfaz uniforme sin if/else para tipos mixtos
        const result = moderation.review(body.content)
        if (!result.allowed) {
            throw new BadRequestException("Comment blocked by moderation")
        }

        const created = await this.prisma.comment.create({
            data: { postId: id, content: body.content, source: "controller" },
        })

        const entity = new CommentEntityBuilder()
            .withId(created.id)
            .withPostId(created.postId)
            .withContent(created.content)
            .withDates(created.createdAt, created.updatedAt)
            .withSource(created.source)
            .withModerationState("approved")
            .withSentimentScore(created.content.length > 60 ? 80 : 40)
            .withMetadata({ moderationReason: result.reason, source: "adapter" })
            .build()

        // Observer: un emit reemplaza 3 llamadas manuales
        postEvents.emit({
            type: "comment.created",
            postId: id,
            commentId: created.id,
        })

        return { message: "comment_created", entity }
    }

    @Post(":id/likes")
    async addLike(
        @Param("id", ParseIntPipe) id: number,
        @Body() body: AddLikeDto,
    ) {
        const post = await this.postsService.findById(id)
        if (!post) throw new NotFoundException("Post not found")

        const reactionType = body.reactionType || "like"
        const weight = body.weight || 1

        if (weight < 1) {
            throw new BadRequestException("Weight must be at least 1")
        }

        const like = await this.prisma.like.create({
            data: { postId: id, reactionType, weight, source: "controller" },
        })

        const entity = new LikeEntityBuilder()
            .withId(like.id)
            .withPostId(like.postId)
            .withReactionType(like.reactionType)
            .withWeight(like.weight)
            .withSource(like.source)
            .withCreatedAt(like.createdAt)
            .withShouldAffectScore(true)
            .withMetadata({ from: "manual", r: like.reactionType })
            .build()

        // Observer: un emit reemplaza 3 llamadas manuales
        postEvents.emit({
            type: "like.created",
            postId: id,
            likeId: like.id,
            reactionType,
        })

        return { success: true, like: entity }
    }
}