import { Injectable } from "@nestjs/common"
import { PostEntity } from "@/posts/entities/post.entity"
import {
    FeedRankingMode,
    FeedRankingStrategy,
} from "@/posts/feed/feed-ranking.strategy"

@Injectable()
export class LatestFeedRankingStrategy implements FeedRankingStrategy {
    readonly mode: FeedRankingMode = "latest"

    sort(posts: PostEntity[]) {
        return [...posts].sort(
            (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
        )
    }
}
