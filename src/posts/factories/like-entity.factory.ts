import { Injectable } from "@nestjs/common"
import { LikeBuilder } from "@/posts/entities/like.builder"
import { LikeEntity } from "@/posts/entities/like.entity"

interface LikeRecord {
    id: number
    postId: number
    reactionType: string
    weight: number
    source: string
    createdAt: Date
}

@Injectable()
export class LikeEntityFactory {
    fromCreatedRecord(like: LikeRecord): LikeEntity {
        return new LikeBuilder()
            .setId(like.id)
            .setPostId(like.postId)
            .setReactionInfo(like.reactionType, like.weight)
            .setSource(like.source)
            .setCreatedAt(like.createdAt)
            .setStrengthAndRelevance(like.weight > 2 ? "strong" : "normal", true)
            .setMetadata({ from: "manual", r: like.reactionType })
            .build()
    }
}
