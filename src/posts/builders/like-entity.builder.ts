import { Like } from "@prisma/client"
import { LikeEntity } from "@/posts/entities/like.entity"

export class LikeEntityBuilder {
    private metadata: Record<string, unknown> = {}

    constructor(private readonly like: Like) {}

    withMetadata(metadata: Record<string, unknown>): this {
        this.metadata = metadata
        return this
    }

    build(): LikeEntity {
        const { like } = this
        const strengthLabel = like.weight > 2 ? "strong" : "normal"

        return new LikeEntity(
            like.id,
            like.postId,
            like.reactionType,
            like.weight,
            like.source,
            like.createdAt,
            strengthLabel,
            true,
            { from: "manual", r: like.reactionType, ...this.metadata },
        )
    }
}
