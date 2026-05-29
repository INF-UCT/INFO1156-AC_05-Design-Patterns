import { PostEntity } from "@/posts/entities/post.entity"
import { IRankingStrategy } from "@/posts/ranking/ranking.interface"

/**
 * Estrategia "Latest" (Más Reciente):
 * Ordena posts por fecha de creación, más recientes primero.
 */
export class LatestStrategy implements IRankingStrategy {
    rank(posts: PostEntity[]): PostEntity[] {
        return posts.sort((a, b) => {
            // Ordenar por fecha de creación en orden descendente
            return b.createdAt.getTime() - a.createdAt.getTime()
        })
    }
}
