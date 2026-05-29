import { PostEntity } from "./post.entity"

export class PostBuilder {
    private id!: number
    private title!: string
    private description!: string
    private imageUrl!: string
    private createdAt!: Date
    private updatedAt!: Date
    private likesCount: number = 0
    private commentsCount: number = 0
    private relevanceScore: number = 0
    private isFeatured: boolean = false
    private source: string = ""
    private tags: string[] = []
    private metadata: Record<string, unknown> = {}
    private rankingMode: string = "latest"

    setId(id: number): this {
        this.id = id
        return this
    }

    setTitle(title: string): this {
        this.title = title
        return this
    }

    setDescription(description: string): this {
        this.description = description
        return this
    }

    setImageUrl(imageUrl: string): this {
        this.imageUrl = imageUrl
        return this
    }

    setTimestamps(createdAt: Date, updatedAt: Date): this {
        this.createdAt = createdAt
        this.updatedAt = updatedAt
        return this
    }

    setMetrics(likesCount: number, commentsCount: number): this {
        this.likesCount = likesCount
        this.commentsCount = commentsCount
        return this
    }

    setRelevance(relevanceScore: number, isFeatured: boolean): this {
        this.relevanceScore = relevanceScore
        this.isFeatured = isFeatured
        return this
    }

    setSourceInfo(source: string): this {
        this.source = source
        return this
    }

    setTags(tags: string[]): this {
        this.tags = tags
        return this
    }

    setMetadata(metadata: Record<string, unknown>): this {
        this.metadata = metadata
        return this
    }

    setRankingMode(rankingMode: string): this {
        this.rankingMode = rankingMode
        return this
    }

    build(): PostEntity {
        return new PostEntity(
            this.id,
            this.title,
            this.description,
            this.imageUrl,
            this.createdAt,
            this.updatedAt,
            this.likesCount,
            this.commentsCount,
            this.relevanceScore,
            this.isFeatured,
            this.source,
            this.tags,
            this.metadata,
            this.rankingMode,
        )
    }
}
