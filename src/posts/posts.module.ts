import { Module } from "@nestjs/common"
import { FeedRankingStrategyResolver } from "@/posts/feed/feed-ranking-strategy.resolver"
import { LatestFeedRankingStrategy } from "@/posts/feed/latest-feed-ranking.strategy"
import { MostCommentedFeedRankingStrategy } from "@/posts/feed/most-commented-feed-ranking.strategy"
import { MostLikedFeedRankingStrategy } from "@/posts/feed/most-liked-feed-ranking.strategy"
import { RelevanceFeedRankingStrategy } from "@/posts/feed/relevance-feed-ranking.strategy"
import { PostsController } from "@/posts/posts.controller"
import { PostsService } from "@/posts/posts.service"
<<<<<<< HEAD
import { ModerationAdapter } from "@/posts/moderation.adapter"
=======
import { ContentFactory, PrismaContentFactory } from "./factories/content.factory"
>>>>>>> cc5b559b2ab5e9ccd5be25f074c1e57c7247bbd4

@Module({
    controllers: [PostsController],
    providers: [
        PostsService,
        {
            provide: ContentFactory,
            useClass: PrismaContentFactory,
        },
        LatestFeedRankingStrategy,
        MostLikedFeedRankingStrategy,
        MostCommentedFeedRankingStrategy,
        RelevanceFeedRankingStrategy,
        FeedRankingStrategyResolver,
        ModerationAdapter,
    ],
})
export class PostsModule {}
