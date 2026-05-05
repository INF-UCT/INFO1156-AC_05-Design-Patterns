import { PostEntity } from "@/posts/entities/post.entity"

export class PostEntityBuilder {
    private id: number
    private title: string
    private description: string
    private imageUrl: string
    private createdAt: Date
    private updatedAt: Date
    private likesCount = 0
    private commentsCount = 0
    private relevanceScore = 0
    private isFeatured = false
    private source = "feed-controller"
    private tags: string[] = []
    private metadata: Record<string, unknown> = {}
    private rankingMode: string

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
    setDates(createdAt: Date, updatedAt: Date): this {
        this.createdAt = createdAt
        this.updatedAt = updatedAt
        return this
    }
    calculateCounts(likes: any[], comments: any[]): this {
        this.likesCount = likes.reduce((sum, like) => sum + like.weight, 0)
        this.commentsCount = comments.length
        return this
    }
    calculateRelevance(createdAt: Date): this {
        const hoursSinceCreated = (Date.now() - new Date(createdAt).getTime()) / 3_600_000
        this.relevanceScore = this.likesCount * 2 + this.commentsCount * 3 - Math.floor(hoursSinceCreated)
        this.isFeatured = this.relevanceScore > 20
        return this
    }
    calculateTags(title: string): this {
        this.tags = title.split(" ").filter((word) => word.length > 4)
        return this
    }
    calculateMetadata(likes: any[], comments: any[]): this {
        this.metadata = {
            likesWeights: likes.map((like) => like.weight),
            commentLengths: comments.map((comment) => comment.content.length),
            hourOfCreate: new Date(this.createdAt).getHours(),
        }
        return this
    }
    setRankingMode(mode: string): this {
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
