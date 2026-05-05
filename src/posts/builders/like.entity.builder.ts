import { LikeEntity } from "@/posts/entities/like.entity"

export class LikeEntityBuilder {
    private id!: number
    private postId!: number
    private reactionType!: string
    private weight!: number
    private source!: string
    private createdAt!: Date
    private strengthLabel!: string
    private shouldAffectRelevanceScore = true
    private metadata!: Record<string, unknown> = {}

    setId(id: number): this
    { this.id = id; return this }
    setPostId(postId: number): this
    { this.postId = postId; return this }
    setReactionType(reactionType: string): this
    { this.reactionType = reactionType; return this }
    setWeight(weight: number): this
    {this.weight = weight; return this }
    setSource(source: string): this
    { this.source = source; return this }
    setCreatedAt(createdAt: Date): this
    { this.createdAt = createdAt; return this }
    calculateStrengthLabel(): this {
        this.strengthLabel = this.weight > 2 ? "strong" : "normal"
        return this
    }
    setMetadata(metadata: Record<string, unknown>): this
    { this.metadata = metadata; return this }
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
            this.metadata
        )
    }
}
