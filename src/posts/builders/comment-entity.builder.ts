import { CommentEntity } from "@/posts/entities/comment.entity"

export class CommentEntityBuilder {
    private id!: number
    private postId!: number
    private content!: string
    private createdAt!: Date
    private updatedAt!: Date
    private source = "service"
    private moderationState = "approved"
    private sentimentScore = 45
    private isPinned = false
    private language = "es"
    private metadata: Record<string, unknown> = {}

    withId(id: number)                              { this.id = id;                       return this }
    withPostId(postId: number)                      { this.postId = postId;               return this }
    withContent(content: string)                    { this.content = content;             return this }
    withDates(createdAt: Date, updatedAt: Date)     { this.createdAt = createdAt; this.updatedAt = updatedAt; return this }
    withSource(source: string)                      { this.source = source;               return this }
    withModerationState(state: string)              { this.moderationState = state;       return this }
    withSentimentScore(score: number)               { this.sentimentScore = score;        return this }
    withIsPinned(pinned: boolean)                   { this.isPinned = pinned;             return this }
    withLanguage(language: string)                  { this.language = language;           return this }
    withMetadata(metadata: Record<string, unknown>) { this.metadata = metadata;           return this }

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