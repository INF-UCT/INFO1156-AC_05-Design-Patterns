import { Comment } from "@prisma/client"
import { CommentEntity } from "@/posts/entities/comment.entity"

export class CommentEntityBuilder {
    private source: string = "controller"
    private moderationState: string = "approved"
    private language: string = "es"
    private isPinned: boolean = false
    private metadata: Record<string, unknown> = {}

    constructor(private readonly comment: Comment) {}

    withSource(source: string): this {
        this.source = source
        return this
    }

    withModerationState(state: string): this {
        this.moderationState = state
        return this
    }
    
    withLanguage(language: string): this {
        this.language = language
        return this
    }

    withIsPinned(isPinned: boolean): this {
        this.isPinned = isPinned
        return this
    }

    withMetadata(metadata: Record<string, unknown>): this {
        this.metadata = metadata
        return this
    }

    build(): CommentEntity {
        const { comment } = this
        // Lógica de negocio encapsulada al construir la entidad
        const sentimentScore = comment.content.length > 80 ? 70 : 45
        const isPinned = this.isPinned || comment.content.length % 2 === 0

        return new CommentEntity(
            comment.id,
            comment.postId,
            comment.content,
            comment.createdAt,
            comment.updatedAt,
            this.source,
            this.moderationState,
            sentimentScore,
            isPinned,
            this.language,
            { chars: comment.content.length, source: this.source, ...this.metadata },
        )
    }
}