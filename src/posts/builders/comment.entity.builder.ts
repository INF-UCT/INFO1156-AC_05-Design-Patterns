import { CommentEntity } from "@/posts/entities/comment.entity"

export class CommentEntityBuilder {
    private id: number
    private postId: number
    private content: string
    private createdAt: Date
    private updatedAt: Date
    private source: string
    private moderationState = "approved"
    private sentimentScore: number
    private isPinned: boolean
    private language = "es"
    private metadata: Record<string, unknown> = {}

    setId(id: number): this
    { this.id = id; return this }
    setPostId(postId: number): this
    { this.postId = postId; return this }
    setContent(content: string): this
    { this.content = content; return this }
    setDates(createdAt: Date, updatedAt: Date): this
    { this.createdAt = createdAt; this.updatedAt = updatedAt; return this }
    setSource(source: string): this
    { this.source = source; return this }
    setModerationState(state: string): this
    { this.moderationState = state; return this }
    calculateSentimentScore(contentLength: number, threshold: number): this {
        this.sentimentScore = contentLength > threshold ? 70 : 45
        return this
    }
    calculateIsPinned(contentLength: number): this
    {
        this.isPinned = contentLength % 2 === 0
        return this
    }
    setIsPinned(isPinned: boolean): this {
        this.isPinned = isPinned;
        return this;
    }
    setMetadata(metadata: Record<string, unknown>): this
    { this.metadata = metadata; return this }

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
            this.metadata
        )
    }
}
