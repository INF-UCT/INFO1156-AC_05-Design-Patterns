import { PostEntity } from "@/posts/entities/post.entity"
import { IRankingStrategy } from "@/posts/ranking/ranking.interface"

/**
 * Estrategia "Hot" (Caliente/Tendencia):
 * Prioriza posts recientes con alto engagement (likes + comments)
 * Fórmula: (likes * 2) + (comments * 3) - floor(hours_since_created)
 */
export class HotStrategy implements IRankingStrategy {
    rank(posts: PostEntity[]): PostEntity[] {
        return posts.sort((a, b) => {
            // Ordenar por relevanceScore en orden descendente
            return b.relevanceScore - a.relevanceScore
        })
    }
}
