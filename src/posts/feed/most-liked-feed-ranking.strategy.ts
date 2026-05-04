import { Injectable } from "@nestjs/common"
import { PostEntity } from "@/posts/entities/post.entity"
import {
    FeedRankingMode,
    FeedRankingStrategy,
} from "@/posts/feed/feed-ranking.strategy"

@Injectable()
export class MostLikedFeedRankingStrategy implements FeedRankingStrategy {
    readonly mode: FeedRankingMode = "mostLiked"

    sort(posts: PostEntity[]) {
        return [...posts].sort((a, b) => b.likesCount - a.likesCount)
    }
}
