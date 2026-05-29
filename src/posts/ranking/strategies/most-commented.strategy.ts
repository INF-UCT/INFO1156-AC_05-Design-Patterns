import { PostEntity } from "@/posts/entities/post.entity"
import { IRankingStrategy } from "@/posts/ranking/ranking.interface"

/**
 * Estrategia "Most Commented" (Más Comentados):
 * Ordena posts por número de comentarios en orden descendente.
 */
export class MostCommentedStrategy implements IRankingStrategy {
    rank(posts: PostEntity[]): PostEntity[] {
        return posts.sort((a, b) => {
            return b.commentsCount - a.commentsCount
        })
    }
}
