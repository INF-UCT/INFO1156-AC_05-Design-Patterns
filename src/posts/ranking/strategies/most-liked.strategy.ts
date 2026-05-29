import { PostEntity } from "@/posts/entities/post.entity"
import { IRankingStrategy } from "@/posts/ranking/ranking.interface"

/**
 * Estrategia "Most Liked" (Más Reaccionados):
 * Ordena posts por número de likes en orden descendente.
 */
export class MostLikedStrategy implements IRankingStrategy {
    rank(posts: PostEntity[]): PostEntity[] {
        return posts.sort((a, b) => {
            return b.likesCount - a.likesCount
        })
    }
}
