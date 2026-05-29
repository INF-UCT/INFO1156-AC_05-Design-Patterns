import { PostEntity } from "./entities/post.entity"

/**
 * Builder fluido para PostEntity.
 * Permite construir entidades de posts sin preocuparse por el orden de parámetros.
 * Los campos derivados (isFeatured, tags) se calculan automáticamente en build().
 */
export class PostEntityBuilder {
    private id?: number
    private title?: string
    private description?: string
    private imageUrl?: string
    private createdAt?: Date
    private updatedAt?: Date
    private likesCount?: number
    private commentsCount?: number
    private relevanceScore?: number
    private source?: string
    private metadata?: Record<string, unknown>
    private rankingMode?: string

    withId(id: number): this {
        this.id = id
        return this
    }

    withTitle(title: string): this {
        this.title = title
        return this
    }

    withDescription(description: string): this {
        this.description = description
        return this
    }

    withImageUrl(imageUrl: string): this {
        this.imageUrl = imageUrl
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

    withLikesCount(likesCount: number): this {
        this.likesCount = likesCount
        return this
    }

    withCommentsCount(commentsCount: number): this {
        this.commentsCount = commentsCount
        return this
    }

    withRelevanceScore(relevanceScore: number): this {
        this.relevanceScore = relevanceScore
        return this
    }

    withSource(source: string): this {
        this.source = source
        return this
    }

    withMetadata(metadata: Record<string, unknown>): this {
        this.metadata = metadata
        return this
    }

    withRankingMode(rankingMode: string): this {
        this.rankingMode = rankingMode
        return this
    }

    build(): PostEntity {
        if (
            this.id === undefined ||
            this.title === undefined ||
            this.description === undefined ||
            this.imageUrl === undefined ||
            this.createdAt === undefined ||
            this.updatedAt === undefined ||
            this.likesCount === undefined ||
            this.commentsCount === undefined ||
            this.relevanceScore === undefined
        ) {
            throw new Error(
                "PostEntityBuilder: Missing required fields. Ensure all fields except optional ones are set.",
            )
        }

        // Campos derivados calculados automáticamente
        const isFeatured = this.relevanceScore > 20
        const tags = this.title.split(" ").filter((word) => word.length > 4)

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
            isFeatured,
            this.source || "unknown",
            tags,
            this.metadata || {},
            this.rankingMode || "latest",
        )
    }
}