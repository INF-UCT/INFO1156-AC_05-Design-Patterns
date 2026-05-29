import { PostEntity } from "@/posts/entities/post.entity"
import { RankingStrategy } from "@/posts/ranking/ranking-strategy.interface"

/** Ordena por mayor cantidad de likes (ponderados). */
export class MostLikedRankingStrategy implements RankingStrategy {
    sort(posts: PostEntity[]): PostEntity[] {
        return [...posts].sort((a, b) => b.likesCount - a.likesCount)
    }
}
