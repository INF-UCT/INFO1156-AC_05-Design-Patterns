import { PostEntity } from "@/posts/entities/post.entity"
import { RankingStrategy } from "@/posts/ranking/ranking-strategy.interface"

/** Ordena por puntuación de relevancia (likes + comentarios - antigüedad). */
export class RelevanceRankingStrategy implements RankingStrategy {
    sort(posts: PostEntity[]): PostEntity[] {
        return [...posts].sort((a, b) => b.relevanceScore - a.relevanceScore)
    }
}
