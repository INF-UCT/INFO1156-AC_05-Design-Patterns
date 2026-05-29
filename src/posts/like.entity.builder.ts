import { LikeEntity } from "./entities/like.entity"

/**
 * Builder fluido para LikeEntity.
 * Permite construir entidades de likes sin preocuparse por el orden de parámetros.
 * El campo derivado (strengthLabel) se calcula automáticamente en build().
 */
export class LikeEntityBuilder {
    private id?: number
    private postId?: number
    private reactionType?: string
    private weight?: number
    private source?: string
    private createdAt?: Date
    private shouldAffectRelevanceScore?: boolean
    private metadata?: Record<string, unknown>

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

    withShouldAffectRelevanceScore(
        shouldAffectRelevanceScore: boolean,
    ): this {
        this.shouldAffectRelevanceScore = shouldAffectRelevanceScore
        return this
    }

    withMetadata(metadata: Record<string, unknown>): this {
        this.metadata = metadata
        return this
    }

    build(): LikeEntity {
        if (
            this.id === undefined ||
            this.postId === undefined ||
            this.reactionType === undefined ||
            this.weight === undefined ||
            this.createdAt === undefined
        ) {
            throw new Error(
                "LikeEntityBuilder: Missing required fields. Ensure id, postId, reactionType, weight, and createdAt are set.",
            )
        }

        // Campo derivado calculado automáticamente
        const strengthLabel = this.weight > 2 ? "strong" : "normal"

        return new LikeEntity(
            this.id,
            this.postId,
            this.reactionType,
            this.weight,
            this.source || "unknown",
            this.createdAt,
            strengthLabel,
            this.shouldAffectRelevanceScore ?? true,
            this.metadata || {},
        )
    }
}