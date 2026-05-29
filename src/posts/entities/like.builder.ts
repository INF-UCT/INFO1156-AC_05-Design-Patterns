import { LikeEntity } from "./like.entity"

export class LikeBuilder {
    private id!: number
    private postId!: number
    private reactionType: string = "like"
    private weight: number = 1
    private source: string = "unknown"
    private createdAt!: Date
    private strengthLabel: string = "normal"
    private shouldAffectRelevanceScore: boolean = true
    private metadata: Record<string, unknown> = {}

    setId(id: number): this {
        this.id = id
        return this
    }

    setPostId(postId: number): this {
        this.postId = postId
        return this
    }

    setReactionInfo(reactionType: string, weight: number): this {
        this.reactionType = reactionType
        this.weight = weight
        return this
    }

    setSource(source: string): this {
        this.source = source
        return this
    }

    setCreatedAt(createdAt: Date): this {
        this.createdAt = createdAt
        return this
    }

    setStrengthAndRelevance(
        strengthLabel: string,
        shouldAffectRelevanceScore: boolean,
    ): this {
        this.strengthLabel = strengthLabel
        this.shouldAffectRelevanceScore = shouldAffectRelevanceScore
        return this
    }

    setMetadata(metadata: Record<string, unknown>): this {
        this.metadata = metadata
        return this
    }

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
