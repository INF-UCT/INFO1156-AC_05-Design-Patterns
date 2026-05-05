import { PostEntity } from "@/posts/entities/post.entity"

export class PostEntityBuilder {
    private id!: number
    private title!: string
    private description!: string
    private imageUrl!: string
    private createdAt!: Date
    private updatedAt!: Date
    private likesCount = 0
    private commentsCount = 0
    private relevanceScore = 0
    private isFeatured = false
    private source = "service"
    private tags: string[] = []
    private metadata: Record<string, unknown> = {}
    private rankingMode = "latest"

    withId(id: number): PostEntityBuilder {
        this.id = id
        return this
    }

    withTitle(title: string): PostEntityBuilder {
        this.title = title
        return this
    }

    withDescription(description: string): PostEntityBuilder {
        this.description = description
        return this
    }

    withImageUrl(imageUrl: string): PostEntityBuilder {
        this.imageUrl = imageUrl
        return this
    }

    withCreatedAt(createdAt: Date): PostEntityBuilder {
        this.createdAt = createdAt
        return this
    }

    withUpdatedAt(updatedAt: Date): PostEntityBuilder {
        this.updatedAt = updatedAt
        return this
    }

    withLikesCount(count: number): PostEntityBuilder {
        this.likesCount = count
        return this
    }

    withCommentsCount(count: number): PostEntityBuilder {
        this.commentsCount = count
        return this
    }

    withRelevanceScore(score: number): PostEntityBuilder {
        this.relevanceScore = score
        return this
    }

    withIsFeatured(featured: boolean): PostEntityBuilder {
        this.isFeatured = featured
        return this
    }

    withSource(source: string): PostEntityBuilder {
        this.source = source
        return this
    }

    withTags(tags: string[]): PostEntityBuilder {
        this.tags = tags
        return this
    }

    withMetadata(metadata: Record<string, unknown>): PostEntityBuilder {
        this.metadata = metadata
        return this
    }

    withRankingMode(mode: string): PostEntityBuilder {
        this.rankingMode = mode
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
