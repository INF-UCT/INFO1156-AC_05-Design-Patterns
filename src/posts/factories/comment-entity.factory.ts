import { Injectable } from "@nestjs/common"
import { CommentBuilder } from "@/posts/entities/comment.builder"
import { CommentEntity } from "@/posts/entities/comment.entity"

interface CommentRecord {
    id: number
    postId: number
    content: string
    createdAt: Date
    updatedAt: Date
    source: string
}

@Injectable()
export class CommentEntityFactory {
    fromListRecord(comment: CommentRecord): CommentEntity {
        return new CommentBuilder()
            .setId(comment.id)
            .setPostId(comment.postId)
            .setContent(comment.content)
            .setTimestamps(comment.createdAt, comment.updatedAt)
            .setSource(comment.source)
            .setModerationInfo("approved", comment.content.length > 80 ? 70 : 45)
            .setIsPinned(comment.content.length % 2 === 0)
            .setLanguage("es")
            .setMetadata({
                chars: comment.content.length,
                source: comment.source,
            })
            .build()
    }

    fromCreatedRecord(comment: CommentRecord): CommentEntity {
        return new CommentBuilder()
            .setId(comment.id)
            .setPostId(comment.postId)
            .setContent(comment.content)
            .setTimestamps(comment.createdAt, comment.updatedAt)
            .setSource(comment.source)
            .setModerationInfo("approved", comment.content.length > 60 ? 80 : 40)
            .setIsPinned(false)
            .setLanguage("es")
            .setMetadata({ moderation: "approved", source: "legacy" })
            .build()
    }
}
