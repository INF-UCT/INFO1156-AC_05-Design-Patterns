import { CommentEntity } from "@/posts/entities/comment.entity"

export class CommentEntityBuilder {
    private id!: number
    private postId!: number
    private content!: string
    private createdAt!: Date
    private updatedAt!: Date
    private source = "service"
    private moderationState = "approved"
    private sentimentScore = 50
    private isPinned = false
    private language = "es"
    private metadata: Record<string, unknown> = {}

    withId(id: number): CommentEntityBuilder {
        this.id = id
        return this
    }

    withPostId(postId: number): CommentEntityBuilder {
        this.postId = postId
        return this
    }

    withContent(content: string): CommentEntityBuilder {
        this.content = content
        return this
    }

    withCreatedAt(createdAt: Date): CommentEntityBuilder {
        this.createdAt = createdAt
        return this
    }

    withUpdatedAt(updatedAt: Date): CommentEntityBuilder {
        this.updatedAt = updatedAt
        return this
    }

    withSource(source: string): CommentEntityBuilder {
        this.source = source
        return this
    }

    withModerationState(state: string): CommentEntityBuilder {
        this.moderationState = state
        return this
    }

    withSentimentScore(score: number): CommentEntityBuilder {
        this.sentimentScore = score
        return this
    }

    withIsPinned(pinned: boolean): CommentEntityBuilder {
        this.isPinned = pinned
        return this
    }

    withLanguage(language: string): CommentEntityBuilder {
        this.language = language
        return this
    }

    withMetadata(metadata: Record<string, unknown>): CommentEntityBuilder {
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
