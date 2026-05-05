import { Injectable } from "@nestjs/common"
import { FeedSortStrategy } from "@/posts/feed/feed-sort.strategy"
import { LatestSortStrategy } from "@/posts/feed/latest-sort.strategy"
import { MostCommentedSortStrategy } from "@/posts/feed/most-commented-sort.strategy"
import { MostLikedSortStrategy } from "@/posts/feed/most-liked-sort.strategy"
import { RelevanceSortStrategy } from "@/posts/feed/relevance-sort.strategy"

const STRATEGY_MAP: Record<string, new () => FeedSortStrategy> = {
    latest: LatestSortStrategy,
    mostLiked: MostLikedSortStrategy,
    mostCommented: MostCommentedSortStrategy,
    relevance: RelevanceSortStrategy,
}

@Injectable()
export class FeedSortContext {
    resolve(mode: string): FeedSortStrategy {
        const Strategy = STRATEGY_MAP[mode] || LatestSortStrategy
        return new Strategy()
    }
}
