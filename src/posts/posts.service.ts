import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from "@nestjs/common"
import {
    AddLikeDto,
    CreateCommentDto,
    CreatePostDto,
    FeedQueryDto,
} from "@/posts/posts.dtos"
import { PrismaService } from "@/prisma/prisma.service"
import { ModerationAdapter } from "@/posts/adapters/moderation.adapter"
import { RANKING_CONSTANTS, VALIDATION_CONSTANTS } from "@/posts/constants"
import { CommentFactory } from "@/posts/factories/comment.factory"
import { LikeFactory } from "@/posts/factories/like.factory"
import { PostFactory } from "@/posts/factories/post.factory"
import { postEventDispatcher } from "@/posts/post-events.observer"
import { RankingService } from "@/posts/ranking/ranking.service"

/**
 * Service Layer Pattern:
 * Centralizes business logic in the service, rather than the controller.
 * This ensures the controller only handles HTTP concerns, while the service
 * orchestrates the domain models, external adapters, and persistence.
 */
@Injectable()
export class PostsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly moderationAdapter: ModerationAdapter,
        private readonly rankingService: RankingService,
    ) {}

    async create(data: CreatePostDto) {
        if (
            data.title.length < RANKING_CONSTANTS.TITLE_MIN_LENGTH ||
            data.title.length > RANKING_CONSTANTS.TITLE_MAX_LENGTH
        ) {
            throw new BadRequestException(
                `Title length must be between ${RANKING_CONSTANTS.TITLE_MIN_LENGTH} and ${RANKING_CONSTANTS.TITLE_MAX_LENGTH}`,
            )
        }

        const isValidUrl = VALIDATION_CONSTANTS.IMAGE_URL_PROTOCOLS.some(
            (protocol) => data.imageUrl.startsWith(protocol),
        )

        if (!isValidUrl) {
            throw new BadRequestException(
                "Image URL must start with http:// or https://",
            )
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

        const mappedPosts = posts.map((post) => PostFactory.fromDb(post, mode))
        const sorted = this.rankingService.rank(mappedPosts, mode)

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

        const entities = comments.map((comment) =>
            CommentFactory.fromDb(comment),
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

        const moderationResult = await this.moderationAdapter.moderate(
            data.content,
        )

        if (moderationResult.action === "block") {
            throw new BadRequestException("Comment blocked by moderation")
        }

        const created = await this.prisma.comment.create({
            data: {
                postId,
                content: data.content,
                source: "service",
            },
        })

        const entity = CommentFactory.fromCreated(created, moderationResult)

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

        const entity = LikeFactory.fromDb(like)

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
