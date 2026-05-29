import { PostEntity } from "@/posts/entities/post.entity"
import { RankingStrategy } from "@/posts/ranking/ranking-strategy.interface"

/** Ordena por mayor cantidad de comentarios. */
export class MostCommentedRankingStrategy implements RankingStrategy {
    sort(posts: PostEntity[]): PostEntity[] {
        return [...posts].sort((a, b) => b.commentsCount - a.commentsCount)
    }
}
