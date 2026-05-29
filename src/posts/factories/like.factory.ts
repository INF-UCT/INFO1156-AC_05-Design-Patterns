import type { Like } from "@prisma/client"
import { LikeEntity } from "@/posts/entities/like.entity"

export class LikeFactory {
    static fromDb(like: Like): LikeEntity {
        return new LikeEntity(
            like.id,
            like.postId,
            like.reactionType,
            like.weight,
            like.source,
            like.createdAt,
            like.weight > 2 ? "strong" : "normal",
            true,
            { from: "manual", r: like.reactionType },
        )
    }
}
