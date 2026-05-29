import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common"
import { AddLikeDto, CreateCommentDto, CreatePostDto, FeedQueryDto } from "@/posts/posts.dtos"
import { PrismaService } from "@/prisma/prisma.service"
import { PostEntity } from "@/posts/entities/post.entity"
import { CommentEntity } from "@/posts/entities/comment.entity"
import { LikeEntity } from "@/posts/entities/like.entity"
import { ModerationAdapter } from "./moderation.adapter"
import { FeedRankingContext } from "./feed-ranking.strategy"
import { postEventDispatcher } from "./post-events.observer"

/**
 * Service Layer Pattern:
 * Centralizes business logic in the service, rather than the controller.
 * This ensures the controller only handles HTTP concerns, while the service
 * orchestrates the domain models, external adapters, and persistence.
 */
@Injectable()
export class PostsService {
    constructor(private readonly prisma: PrismaService) {}

    async create(data: CreatePostDto) {
        if (data.title.length < 3 || data.title.length > 120) {
            throw new BadRequestException("Title length must be between 3 and 120")
        }

        if (!data.imageUrl.startsWith("http")) {
            throw new BadRequestException("Image URL must start with http")
        }

        const created = await this.prisma.post.create({ data })

        postEventDispatcher.notify({
            eventName: "post.created",
            postId: created.id,
            title: created.title,
        })

        return created
    }

    async findAll() {
        return this.prisma.post.findMany({
            orderBy: { createdAt: "desc" },
        })
    }

    async findById(id: number) {
        return this.prisma.post.findUnique({ where: { id } })
    }

    async getFeed(query: FeedQueryDto) {
        const mode = query.mode || "latest"

        const posts = await this.prisma.post.findMany({
            include: {
                comments: true,
                likes: true,
            },
        })

        const mappedPosts = posts.map((post) => {
            const likesCount = post.likes.reduce((sum, like) => sum + like.weight, 0)
            const commentsCount = post.comments.length
            const hoursSinceCreated = (Date.now() - new Date(post.createdAt).getTime()) / 36_000_00
            const relevanceScore = likesCount * 2 + commentsCount * 3 - Math.floor(hoursSinceCreated)

            const tags = post.title.split(" ").filter((word) => word.length > 4)
            const metadata = {
                likesWeights: post.likes.map((like) => like.weight),
                commentLengths: post.comments.map((comment) => comment.content.length),
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
                "feed-service",
                tags,
                metadata,
                mode,
            )
        })

        // Strategy Pattern Application
        const rankingContext = new FeedRankingContext(mode)
        const sorted = rankingContext.execute(mappedPosts)

        return {
            mode,
            count: sorted.length,
            rows: sorted,
        }
    }

    async getCommentsByPostId(id: number) {
        const post = await this.findById(id)
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

    async createComment(postId: number, data: CreateCommentDto) {
        const post = await this.findById(postId)
        if (!post) {
            throw new NotFoundException("Post not found")
        }

        if (data.content.length < 2) {
            throw new BadRequestException("Comment too short")
        }

        // Adapter Pattern Application
        if (ModerationAdapter.isBlocked(data.content)) {
            throw new BadRequestException("Comment blocked by moderation")
        }

        const rawModeration = ModerationAdapter.getRawModeration(data.content)

        const created = await this.prisma.comment.create({
            data: {
                postId,
                content: data.content,
                source: "service",
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
            { moderation: rawModeration, source: "legacy" },
        )

        // Observer Pattern Application
        postEventDispatcher.notify({
            eventName: "comment.created",
            postId,
            commentId: created.id,
        })

        return {
            message: "comment_created",
            entity,
        }
    }

    async addLike(postId: number, data: AddLikeDto) {
        const post = await this.findById(postId)
        if (!post) {
            throw new NotFoundException("Post not found")
        }

        const reactionType = data.reactionType || "like"
        const weight = data.weight || 1

        if (weight < 1) {
            throw new BadRequestException("Weight must be at least 1")
        }

        const like = await this.prisma.like.create({
            data: {
                postId,
                reactionType,
                weight,
                source: "service",
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

        // Observer Pattern Application
        postEventDispatcher.notify({
            eventName: "like.created",
            postId,
            likeId: like.id,
            reactionType,
        })

        return {
            success: true,
            like: entity,
        }
    }
}
