import { FeedOrderingStrategy } from "./feed-ordering.strategy"
import { LatestOrderingStrategy } from "./latest-ordering.strategy"
import { MostLikedOrderingStrategy } from "./most-liked-ordering.strategy"
import { MostCommentedOrderingStrategy } from "./most-commented-ordering.strategy"
import { RelevanceOrderingStrategy } from "./relevance-ordering.strategy"

export class FeedOrderingContext {
    private strategies: Record<string, FeedOrderingStrategy>

    constructor() {
        this.strategies = {
            latest: new LatestOrderingStrategy(),
            mostLiked: new MostLikedOrderingStrategy(),
            mostCommented: new MostCommentedOrderingStrategy(),
            relevance: new RelevanceOrderingStrategy(),
        }
    }

    getStrategy(mode: string): FeedOrderingStrategy {
        return this.strategies[mode] || this.strategies["latest"]
    }
}
