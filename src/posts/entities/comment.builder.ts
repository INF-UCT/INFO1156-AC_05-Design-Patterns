import { CommentEntity } from "./comment.entity"

export class CommentBuilder {
    private id!: number
    private postId!: number
    private content!: string
    private createdAt!: Date
    private updatedAt!: Date
    private source: string = "unknown"
    private moderationState: string = "pending"
    private sentimentScore: number = 50
    private isPinned: boolean = false
    private language: string = "es"
    private metadata: Record<string, unknown> = {}

    setId(id: number): this {
        this.id = id
        return this
    }

    setPostId(postId: number): this {
        this.postId = postId
        return this
    }

    setContent(content: string): this {
        this.content = content
        return this
    }

    setTimestamps(createdAt: Date, updatedAt: Date): this {
        this.createdAt = createdAt
        this.updatedAt = updatedAt
        return this
    }

    setSource(source: string): this {
        this.source = source
        return this
    }

    setModerationInfo(moderationState: string, sentimentScore: number): this {
        this.moderationState = moderationState
        this.sentimentScore = sentimentScore
        return this
    }

    setIsPinned(isPinned: boolean): this {
        this.isPinned = isPinned
        return this
    }

    setLanguage(language: string): this {
        this.language = language
        return this
    }

    setMetadata(metadata: Record<string, unknown>): this {
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
