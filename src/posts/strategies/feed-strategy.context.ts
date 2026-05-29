import { Injectable } from "@nestjs/common"
import {
    FeedStrategy,
    LatestFeedStrategy,
    MostCommentedFeedStrategy,
    MostLikedFeedStrategy,
    RelevanceFeedStrategy,
} from "@/posts/strategies/feed.strategy"

@Injectable()
export class FeedStrategyContext {
    private readonly strategies: Record<string, FeedStrategy> = {
        latest: new LatestFeedStrategy(),
        mostLiked: new MostLikedFeedStrategy(),
        mostCommented: new MostCommentedFeedStrategy(),
        relevance: new RelevanceFeedStrategy(),
    }

    resolve(mode: string): FeedStrategy {
        return this.strategies[mode] ?? this.strategies["latest"]
    }
}
