import { FeedSortStrategy } from "./feed-sort.strategy"
import { LatestStrategy } from "./latest.strategy"
import { MostLikedStrategy } from "./most-liked.strategy"
import { MostCommentedStrategy } from "./most-commented.strategy"
import { RelevanceStrategy } from "./relevance.strategy"

export class FeedSortFactory {
    private static readonly strategies: Record<string, FeedSortStrategy> = {
        latest: new LatestStrategy(),
        mostLiked: new MostLikedStrategy(),
        mostCommented: new MostCommentedStrategy(),
        relevance: new RelevanceStrategy(),
    }

    static getStrategy(mode: string): FeedSortStrategy {
        return this.strategies[mode] || this.strategies["latest"]
    }
}