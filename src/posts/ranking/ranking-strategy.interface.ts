import { PostEntity } from "@/posts/entities/post.entity"

/**
 * Patrón Strategy: contrato común para todas las formas de ordenar el feed.
 * Cada modo de ranking implementa esta interfaz, de modo que agregar un nuevo
 * orden no requiere modificar el controller ni el resto de estrategias (OCP).
 */
export interface RankingStrategy {
    sort(posts: PostEntity[]): PostEntity[]
}
