import {
    BadRequestException,
    Inject,
    Injectable,
    NotFoundException,
} from "@nestjs/common"
import { AddLikeDto, CreateCommentDto, CreatePostDto } from "@/posts/posts.dtos"
import { PrismaService } from "@/prisma/prisma.service"
import {
    MODERATION_PORT,
    ModerationPort,
} from "@/posts/moderation/moderation.port"
import { RankingService } from "@/posts/ranking/ranking.service"
import { PostEventsFacade } from "@/posts/events.facade"
import { PostResponseFactory } from "@/posts/factories/post-response.factory"
import { CommentResponseFactory } from "@/posts/factories/comment-response.factory"
import { LikeResponseFactory } from "@/posts/factories/like-response.factory"

@Injectable()
export class PostsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly rankingService: RankingService,
        @Inject(MODERATION_PORT)
        private readonly moderation: ModerationPort,
        private readonly eventsFacade: PostEventsFacade,
    ) {}

    async create(data: CreatePostDto) {
        if (data.title.length < 3 || data.title.length > 120) {
            throw new BadRequestException(
                "Title length must be between 3 and 120",
            )
        }

        if (!data.imageUrl.startsWith("http")) {
            throw new BadRequestException("Image URL must start with http")
        }

        const created = await this.prisma.post.create({ data })
        this.eventsFacade.dispatchPostCreated(created.id, created.title)

        return created
    }

    findAll() {
        return this.prisma.post.findMany({
            orderBy: { createdAt: "desc" },
        })
    }

    findById(id: number) {
        return this.prisma.post.findUnique({ where: { id } })
    }

    async getFeed(mode: string) {
        const posts = await this.prisma.post.findMany({
            include: {
                comments: true,
                likes: true,
            },
        })

        const mappedPosts = posts.map((post) =>
            PostResponseFactory.fromFeedRecord(post, mode),
        )
        const sorted = this.rankingService.rank(mode, mappedPosts)

        return {
            mode,
            count: sorted.length,
            rows: sorted,
        }
    }

    async getComments(postId: number) {
        await this.ensurePostExists(postId)

        const comments = await this.prisma.comment.findMany({
            where: { postId },
            orderBy: { createdAt: "desc" },
        })

        return comments.map((comment) =>
            CommentResponseFactory.fromListRecord(comment),
        )
    }

    async createComment(postId: number, data: CreateCommentDto) {
        await this.ensurePostExists(postId)

        if (data.content.length < 2) {
            throw new BadRequestException("Comment too short")
        }

        const moderationReview = this.moderation.reviewComment(data.content)
        if (moderationReview.blocked) {
            throw new BadRequestException("Comment blocked by moderation")
        }

        const created = await this.prisma.comment.create({
            data: {
                postId,
                content: data.content,
                source: "controller",
            },
        })

        this.eventsFacade.dispatchCommentCreated(postId, created.id)

        return CommentResponseFactory.fromCreatedRecord(created)
    }

    async addLike(postId: number, data: AddLikeDto) {
        await this.ensurePostExists(postId)

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
                source: "controller",
            },
        })

        this.eventsFacade.dispatchLikeAdded(postId, like.id, reactionType)

        return LikeResponseFactory.fromCreatedRecord(like)
    }

    private async ensurePostExists(postId: number) {
        const post = await this.findById(postId)
        if (!post) {
            throw new NotFoundException("Post not found")
        }

        return post
    }
}
