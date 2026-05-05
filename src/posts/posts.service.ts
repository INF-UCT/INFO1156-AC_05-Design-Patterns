import { BadRequestException, Inject, Injectable } from "@nestjs/common"
import { AddLikeDto, CreateCommentDto, CreatePostDto } from "@/posts/posts.dtos"
import { PrismaService } from "@/prisma/prisma.service"
import { EventBus } from "@/posts/domain/event-bus"
import { ModerationProvider } from "@/posts/moderation/moderation.provider"
import { MODERATION_PROVIDER } from "@/posts/moderation/moderation.token"
import { EntityFactory } from "@/posts/entities/entity.factory"
import { CommentEntity } from "@/posts/entities/comment.entity"
import { LikeEntity } from "@/posts/entities/like.entity"

@Injectable()
export class PostsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly eventBus: EventBus,
        @Inject(MODERATION_PROVIDER)
        private readonly moderationProvider: ModerationProvider,
        private readonly entityFactory: EntityFactory,
    ) {}

    async createPost(data: CreatePostDto) {
        const created = await this.prisma.post.create({ data })

        this.eventBus.publish({
            name: "post.created",
            payload: { postId: created.id, title: created.title },
            timestamp: new Date(),
        })

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

    async createComment(
        postId: number,
        data: CreateCommentDto,
    ): Promise<CommentEntity> {
        const moderationResult = this.moderationProvider.review(data.content)

        if (moderationResult.isBlocked) {
            throw new BadRequestException("Comment blocked by moderation")
        }

        const created = await this.prisma.comment.create({
            data: {
                postId,
                content: data.content,
                source: "service",
            },
        })

        const entity = this.entityFactory.createCommentEntity(
            created,
            "service",
        )

        this.eventBus.publish({
            name: "comment.created",
            payload: { postId, commentId: created.id },
            timestamp: new Date(),
        })

        return entity
    }

    async addLike(postId: number, data: AddLikeDto): Promise<LikeEntity> {
        const reactionType = data.reactionType || "like"
        const weight = data.weight || 1

        const created = await this.prisma.like.create({
            data: {
                postId,
                reactionType,
                weight,
                source: "service",
            },
        })

        const entity = this.entityFactory.createLikeEntity(created)

        this.eventBus.publish({
            name: "like.created",
            payload: { postId, likeId: created.id },
            timestamp: new Date(),
        })

        return entity
    }

    async getComments(postId: number): Promise<CommentEntity[]> {
        const comments = await this.prisma.comment.findMany({
            where: { postId },
            orderBy: { createdAt: "desc" },
        })

        return comments.map((comment) =>
            this.entityFactory.createCommentEntity(comment, "controller"),
        )
    }
}
