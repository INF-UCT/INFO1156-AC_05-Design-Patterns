import { LikeEntity } from "@/posts/entities/like.entity"

export class LikeEntityBuilder {
    private id!: number
    private postId!: number
    private reactionType = "like"
    private weight = 1
    private source = "service"
    private createdAt!: Date
    private strengthLabel = "normal"
    private shouldAffectRelevanceScore = true
    private metadata: Record<string, unknown> = {}

    withId(id: number)                              { this.id = id;                               return this }
    withPostId(postId: number)                      { this.postId = postId;                       return this }
    withReactionType(type: string)                  { this.reactionType = type;                   return this }
    withWeight(weight: number)                      { this.weight = weight; this.strengthLabel = weight > 2 ? "strong" : "normal"; return this }
    withSource(source: string)                      { this.source = source;                       return this }
    withCreatedAt(createdAt: Date)                  { this.createdAt = createdAt;                 return this }
    withShouldAffectScore(affect: boolean)          { this.shouldAffectRelevanceScore = affect;   return this }
    withMetadata(metadata: Record<string, unknown>) { this.metadata = metadata;                   return this }

    build(): LikeEntity {
        return new LikeEntity(
            this.id,
            this.postId,
            this.reactionType,
            this.weight,
            this.source,
            this.createdAt,
            this.strengthLabel,
            this.shouldAffectRelevanceScore,
            this.metadata,
        )
    }
}