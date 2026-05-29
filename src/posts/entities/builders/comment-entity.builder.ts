import { CommentEntity } from "@/posts/entities/comment.entity"

/**
 * Patrón Builder: construye un CommentEntity con una API fluida, evitando el
 * constructor posicional de 11 argumentos. La llamada posicional queda aislada
 * en build().
 */
export class CommentEntityBuilder {
    private id!: number
    private postId!: number
    private content!: string
    private createdAt!: Date
    private updatedAt!: Date
    private source = ""
    private moderationState = "approved"
    private sentimentScore = 0
    private isPinned = false
    private language = "es"
    private metadata: Record<string, unknown> = {}

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

    withSentimentScore(sentimentScore: number): this {
        this.sentimentScore = sentimentScore
        return this
    }

    withIsPinned(isPinned: boolean): this {
        this.isPinned = isPinned
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

    build(): CommentEntity {
        return new CommentEntity(
            this.id,
            this.postId,
            this.content,
            this.createdAt,
            this.updatedAt,
            this.source,
            this.moderationState,
            this.sentimentScore,
            this.isPinned,
            this.language,
            this.metadata,
        )
    }
}
