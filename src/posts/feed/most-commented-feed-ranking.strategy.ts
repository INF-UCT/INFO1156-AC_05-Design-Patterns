import { Injectable } from "@nestjs/common"
import { PostEntity } from "@/posts/entities/post.entity"
import {
    FeedRankingMode,
    FeedRankingStrategy,
} from "@/posts/feed/feed-ranking.strategy"

@Injectable()
export class MostCommentedFeedRankingStrategy implements FeedRankingStrategy {
    readonly mode: FeedRankingMode = "mostCommented"

    sort(posts: PostEntity[]) {
        return [...posts].sort((a, b) => b.commentsCount - a.commentsCount)
    }
}
