import { CommentEntity } from "../entities/comment.entity"

export class CommentFactory {
    static create(dbRecord: any, moderationMetadata?: any): CommentEntity {
        return new CommentEntity(
            dbRecord.id,
            dbRecord.postId,
            dbRecord.content,
            dbRecord.createdAt,
            dbRecord.updatedAt,
            dbRecord.source,
            "approved", // estado fijo por defecto
            dbRecord.content.length > 60 ? 80 : 40, // lógica de score
            false, // isEdited
            "es", // idioma
            { moderation: moderationMetadata, source: "legacy-adapter" },
        )
    }
}
