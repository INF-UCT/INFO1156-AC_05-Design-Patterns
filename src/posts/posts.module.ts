import { Module } from "@nestjs/common"
import { FeedRankingStrategyResolver } from "@/posts/feed/feed-ranking-strategy.resolver"
import { LatestFeedRankingStrategy } from "@/posts/feed/latest-feed-ranking.strategy"
import { MostCommentedFeedRankingStrategy } from "@/posts/feed/most-commented-feed-ranking.strategy"
import { MostLikedFeedRankingStrategy } from "@/posts/feed/most-liked-feed-ranking.strategy"
import { RelevanceFeedRankingStrategy } from "@/posts/feed/relevance-feed-ranking.strategy"
import { PostsController } from "@/posts/posts.controller"
import { PostsService } from "@/posts/posts.service"
import { ModerationAdapter } from "@/posts/moderation.adapter"

@Module({
    controllers: [PostsController],
    providers: [
        PostsService,
        LatestFeedRankingStrategy,
        MostLikedFeedRankingStrategy,
        MostCommentedFeedRankingStrategy,
        RelevanceFeedRankingStrategy,
        FeedRankingStrategyResolver,
        ModerationAdapter,
    ],
})
export class PostsModule {}
