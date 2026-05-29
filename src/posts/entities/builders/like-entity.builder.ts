import { LikeEntity } from "@/posts/entities/like.entity"

/**
 * Patrón Builder: construye un LikeEntity con una API fluida, evitando el
 * constructor posicional de 9 argumentos. La llamada posicional queda aislada
 * en build().
 */
export class LikeEntityBuilder {
    private id!: number
    private postId!: number
    private reactionType!: string
    private weight = 1
    private source = ""
    private createdAt!: Date
    private strengthLabel = "normal"
    private shouldAffectRelevanceScore = true
    private metadata: Record<string, unknown> = {}

    withId(id: number): this {
        this.id = id
        return this
    }

    withPostId(postId: number): this {
        this.postId = postId
        return this
    }

    withReactionType(reactionType: string): this {
        this.reactionType = reactionType
        return this
    }

    withWeight(weight: number): this {
        this.weight = weight
        return this
    }

    withSource(source: string): this {
        this.source = source
        return this
    }

    withCreatedAt(createdAt: Date): this {
        this.createdAt = createdAt
        return this
    }

    withStrengthLabel(strengthLabel: string): this {
        this.strengthLabel = strengthLabel
        return this
    }

    withShouldAffectRelevanceScore(shouldAffectRelevanceScore: boolean): this {
        this.shouldAffectRelevanceScore = shouldAffectRelevanceScore
        return this
    }

    withMetadata(metadata: Record<string, unknown>): this {
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
