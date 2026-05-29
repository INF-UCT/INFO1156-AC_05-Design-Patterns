import { CommentEntity } from "./entities/comment.entity"

/**
 * Builder fluido para CommentEntity.
 * Permite construir entidades de comentarios sin preocuparse por el orden de parámetros.
 * Los campos derivados (sentimentScore, isPinned) se calculan automáticamente en build().
 */
export class CommentEntityBuilder {
    private id?: number
    private postId?: number
    private content?: string
    private createdAt?: Date
    private updatedAt?: Date
    private source?: string
    private moderationState?: string
    private language?: string
    private metadata?: Record<string, unknown>
    private sentimentScoreOverride?: number
    private isPinnedOverride?: boolean

    withId(id: number): this {
        this.id = id
        return this
    }

    withPostId(postId: number): this {
        this.postId = postId
        return this
    }

    withContent(content: string): this {
        this.content = content
        return this
    }

    withCreatedAt(createdAt: Date): this {
        this.createdAt = createdAt
        return this
    }

    withUpdatedAt(updatedAt: Date): this {
        this.updatedAt = updatedAt
        return this
    }

    withSource(source: string): this {
        this.source = source
        return this
    }

    withModerationState(moderationState: string): this {
        this.moderationState = moderationState
        return this
    }

    withLanguage(language: string): this {
        this.language = language
        return this
    }

    withMetadata(metadata: Record<string, unknown>): this {
        this.metadata = metadata
        return this
    }

    /**
     * Override para sentimentScore. Si no se proporciona, se calcula como 70 si contenido > 80, sino 45.
     */
    withSentimentScore(score: number): this {
        this.sentimentScoreOverride = score
        return this
    }

    /**
     * Override para isPinned. Si no se proporciona, se calcula como length % 2 === 0.
     */
    withIsPinned(isPinned: boolean): this {
        this.isPinnedOverride = isPinned
        return this
    }

    build(): CommentEntity {
        if (
            this.id === undefined ||
            this.postId === undefined ||
            this.content === undefined ||
            this.createdAt === undefined ||
            this.updatedAt === undefined
        ) {
            throw new Error(
                "CommentEntityBuilder: Missing required fields. Ensure id, postId, content, createdAt, and updatedAt are set.",
            )
        }

        // Campos derivados calculados automáticamente
        const sentimentScore =
            this.sentimentScoreOverride ?? (this.content.length > 80 ? 70 : 45)
        const isPinned =
            this.isPinnedOverride ?? (this.content.length % 2 === 0)

        return new CommentEntity(
            this.id,
            this.postId,
            this.content,
            this.createdAt,
            this.updatedAt,
            this.source || "unknown",
            this.moderationState || "approved",
            sentimentScore,
            isPinned,
            this.language || "es",
            this.metadata || {},
        )
    }
}