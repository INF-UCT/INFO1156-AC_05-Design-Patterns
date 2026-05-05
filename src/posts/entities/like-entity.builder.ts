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

    withId(id: number): LikeEntityBuilder {
        this.id = id
        return this
    }

    withPostId(postId: number): LikeEntityBuilder {
        this.postId = postId
        return this
    }

    withReactionType(type: string): LikeEntityBuilder {
        this.reactionType = type
        return this
    }

    withWeight(weight: number): LikeEntityBuilder {
        this.weight = weight
        return this
    }

    withSource(source: string): LikeEntityBuilder {
        this.source = source
        return this
    }

    withCreatedAt(createdAt: Date): LikeEntityBuilder {
        this.createdAt = createdAt
        return this
    }

    withStrengthLabel(label: string): LikeEntityBuilder {
        this.strengthLabel = label
        return this
    }

    withAffectsRelevance(affected: boolean): LikeEntityBuilder {
        this.shouldAffectRelevanceScore = affected
        return this
    }

    withMetadata(metadata: Record<string, unknown>): LikeEntityBuilder {
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
