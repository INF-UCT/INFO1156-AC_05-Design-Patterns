import { PostEntity } from "@/posts/entities/post.entity"

/**
 * Interfaz que define el contrato para estrategias de ranking.
 * Todas las estrategias deben implementar este método para ordenar posts.
 */
export interface IRankingStrategy {
    /**
     * Ordena un arreglo de posts según la estrategia de ranking específica.
     * @param posts - Posts a ordenar
     * @returns Posts ordenados
     */
    rank(posts: PostEntity[]): PostEntity[]
}
