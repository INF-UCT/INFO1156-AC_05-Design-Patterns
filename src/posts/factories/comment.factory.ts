import type { Comment } from "@prisma/client"
import { CommentEntity } from "@/posts/entities/comment.entity"

export class CommentFactory {
    static fromDb(comment: Comment): CommentEntity {
        return new CommentEntity(
            comment.id,
            comment.postId,
            comment.content,
            comment.createdAt,
            comment.updatedAt,
            comment.source,
            "approved",
            comment.content.length > 80 ? 70 : 45,
            comment.content.length % 2 === 0,
            "es",
            { chars: comment.content.length, source: comment.source },
        )
    }

    static fromCreated(comment: Comment, moderation: unknown): CommentEntity {
        return new CommentEntity(
            comment.id,
            comment.postId,
            comment.content,
            comment.createdAt,
            comment.updatedAt,
            comment.source,
            "approved",
            comment.content.length > 60 ? 80 : 40,
            false,
            "es",
            { moderation, source: "legacy" },
        )
    }
}
