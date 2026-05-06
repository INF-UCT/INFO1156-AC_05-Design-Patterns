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

    withId(id: number)                              { this.id = id;                     return this }
    withTitle(title: string)                        { this.title = title;               return this }
    withDescription(description: string)            { this.description = description;   return this }
    withImageUrl(imageUrl: string)                  { this.imageUrl = imageUrl;         return this }
    withDates(createdAt: Date, updatedAt: Date)     { this.createdAt = createdAt; this.updatedAt = updatedAt; return this }
    withLikesCount(count: number)                   { this.likesCount = count;          return this }
    withCommentsCount(count: number)                { this.commentsCount = count;       return this }
    withRelevanceScore(score: number)               { this.relevanceScore = score;      return this }
    withIsFeatured(featured: boolean)               { this.isFeatured = featured;       return this }
    withSource(source: string)                      { this.source = source;             return this }
    withTags(tags: string[])                        { this.tags = tags;                 return this }
    withMetadata(metadata: Record<string, unknown>) { this.metadata = metadata;         return this }
    withRankingMode(mode: string)                   { this.rankingMode = mode;          return this }

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