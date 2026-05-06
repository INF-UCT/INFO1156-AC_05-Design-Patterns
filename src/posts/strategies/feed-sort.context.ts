import { Injectable } from "@nestjs/common"
import {
    LatestFeedSortStrategy,
    MostCommentedFeedSortStrategy,
    MostLikedFeedSortStrategy,
    RelevanceFeedSortStrategy,
} from "@/posts/strategies/feed-sort.strategy"
import { PostEntity } from "@/posts/entities/post.entity"

@Injectable()
export class FeedSortContext {
    constructor(
        private readonly latest: LatestFeedSortStrategy,
        private readonly mostLiked: MostLikedFeedSortStrategy,
        private readonly mostCommented: MostCommentedFeedSortStrategy,
        private readonly relevance: RelevanceFeedSortStrategy,
    ) {}

    sort(mode: string, posts: PostEntity[]): PostEntity[] {
        switch (mode) {
            case "mostLiked":
                return this.mostLiked.sort(posts)
            case "mostCommented":
                return this.mostCommented.sort(posts)
            case "relevance":
                return this.relevance.sort(posts)
            case "latest":
            default:
                return this.latest.sort(posts)
        }
    }
}
