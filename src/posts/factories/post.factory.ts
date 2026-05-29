import { PostEntity } from "@/posts/entities/post.entity"
import { RANKING_CONSTANTS } from "@/posts/constants"

/**
 * Factory para crear instancias de PostEntity desde diferentes fuentes (BD, payloads externos).
 * Encapsula la lógica de derivación de campos y mapeo.
 *
 * Este es un ejemplo del patrón Factory Method.
 */
export class PostFactory {
    /**
     * Crea una PostEntity enriquecida desde datos crudos de Prisma
     * @param raw - Datos crudos de la base de datos incluyendo likes y comments
     * @param rankingMode - Modo de ranking aplicado (para metadata)
     * @returns Entidad enriquecida con campos derivados
     */
    static fromDb(
        raw: any,
        rankingMode: string = "latest",
    ): PostEntity {
        const likesCount = raw.likes?.reduce(
            (sum: number, like: any) => sum + like.weight,
            0,
        ) ?? 0

        const commentsCount = raw.comments?.length ?? 0

        // Calcular relevance score
        const hoursSinceCreated =
            (Date.now() - new Date(raw.createdAt).getTime()) /
            RANKING_CONSTANTS.HOUR_IN_MS

        const relevanceScore =
            likesCount * RANKING_CONSTANTS.LIKE_WEIGHT +
            commentsCount * RANKING_CONSTANTS.COMMENT_WEIGHT -
            Math.floor(hoursSinceCreated)

        // Extraer tags del título (palabras > 4 caracteres)
        const tags = raw.title
            .split(" ")
            .filter((word: string) => word.length > 4)

        // Construir metadata
        const metadata = {
            likesWeights: raw.likes?.map((like: any) => like.weight) ?? [],
            commentLengths:
                raw.comments?.map((comment: any) => comment.content.length) ??
                [],
            hourOfCreate: new Date(raw.createdAt).getHours(),
        }

        return new PostEntity(
            raw.id,
            raw.title,
            raw.description,
            raw.imageUrl,
            raw.createdAt,
            raw.updatedAt,
            likesCount,
            commentsCount,
            relevanceScore,
            relevanceScore > RANKING_CONSTANTS.FEATURED_THRESHOLD,
            "post-factory",
            tags,
            metadata,
            rankingMode,
        )
    }
}
