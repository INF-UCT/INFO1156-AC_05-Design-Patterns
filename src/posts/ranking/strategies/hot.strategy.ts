import { PostEntity } from "@/posts/entities/post.entity"

/**
 * Estrategia de ranking "Hot" (Tendencia/Caliente)
 *
 * Ordena posts basándose en el relevance score, que representa
 * engagement reciente (likes + comments) ajustado por tiempo.
 *
 * Fórmula: (likes * 2) + (comments * 3) - floor(hours_desde_creación)
 *
 * Beneficios:
 * - Favorece posts recientes con alto engagement
 * - Desvanece naturalmente posts antiguos
 * - Promueve contenido participativo (comentarios ponderados más que likes)
 */
export class HotStrategy {
    /**
     * Ordena un arreglo de posts por relevance score en orden descendente
     * @param posts - Array de PostEntity a ordenar
     * @returns Posts ordenados por relevance (más relevantes primero)
     */
    rank(posts: PostEntity[]): PostEntity[] {
        return [...posts].sort((a, b) => b.relevanceScore - a.relevanceScore)
    }
}
