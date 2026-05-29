import { PostEntity } from "@/posts/entities/post.entity"
import { RankingStrategy } from "@/posts/ranking/ranking-strategy.interface"

/** Ordena del más reciente al más antiguo. */
export class LatestRankingStrategy implements RankingStrategy {
    sort(posts: PostEntity[]): PostEntity[] {
        return [...posts].sort(
            (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
        )
    }
}
