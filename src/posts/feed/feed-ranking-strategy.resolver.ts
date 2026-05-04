import { Injectable } from "@nestjs/common"
import {
    FeedRankingStrategy,
    FeedRankingMode,
} from "@/posts/feed/feed-ranking.strategy"
import { LatestFeedRankingStrategy } from "@/posts/feed/latest-feed-ranking.strategy"
import { MostCommentedFeedRankingStrategy } from "@/posts/feed/most-commented-feed-ranking.strategy"
import { MostLikedFeedRankingStrategy } from "@/posts/feed/most-liked-feed-ranking.strategy"
import { RelevanceFeedRankingStrategy } from "@/posts/feed/relevance-feed-ranking.strategy"

@Injectable()
export class FeedRankingStrategyResolver {
    private readonly strategies: ReadonlyMap<string, FeedRankingStrategy>

    constructor(
        private readonly latestStrategy: LatestFeedRankingStrategy,
        mostLikedStrategy: MostLikedFeedRankingStrategy,
        mostCommentedStrategy: MostCommentedFeedRankingStrategy,
        relevanceStrategy: RelevanceFeedRankingStrategy,
    ) {
        const strategies = [
            latestStrategy,
            mostLikedStrategy,
            mostCommentedStrategy,
            relevanceStrategy,
        ]

        this.strategies = new Map(
            strategies.map((strategy) => [strategy.mode, strategy]),
        )
    }

    resolve(mode: FeedRankingMode) {
        return this.strategies.get(mode) || this.latestStrategy
    }
}
