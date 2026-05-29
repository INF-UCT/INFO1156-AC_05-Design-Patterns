import { PostEntity } from "@/posts/entities/post.entity"

/**
 * Patrón Builder: construye un PostEntity paso a paso con una API fluida y
 * legible, evitando el constructor posicional de 14 argumentos (donde es trivial
 * cruzar dos valores del mismo tipo sin que el compilador lo note). La única
 * llamada al constructor posicional queda aislada aquí, en build().
 */
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
    private source = ""
    private tags: string[] = []
    private metadata: Record<string, unknown> = {}
    private rankingMode = "latest"

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

    withIsFeatured(isFeatured: boolean): this {
        this.isFeatured = isFeatured
        return this
    }

    withSource(source: string): this {
        this.source = source
        return this
    }

    withTags(tags: string[]): this {
        this.tags = tags
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
