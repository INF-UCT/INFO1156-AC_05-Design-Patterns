import { Module } from "@nestjs/common"
import { PostsController } from "@/posts/posts.controller"
import { PostsService } from "@/posts/posts.service"
import { ModerationAdapter } from "@/posts/moderation.adapter"
import {
    LatestFeedSortStrategy,
    MostCommentedFeedSortStrategy,
    MostLikedFeedSortStrategy,
    RelevanceFeedSortStrategy,
} from "@/posts/strategies/feed-sort.strategy"
import { FeedSortContext } from "@/posts/strategies/feed-sort.context"
import { PostEventsEmitter } from "@/posts/observers/post-events.emitter"
import { DomainLoggerObserver } from "@/posts/observers/domain-logger.observer"
import { NotificationObserver } from "@/posts/observers/notification.observer"
import { RecomputeObserver } from "@/posts/observers/recompute.observer"

@Module({
    controllers: [PostsController],
    providers: [
        PostsService,
        ModerationAdapter,
        FeedSortContext,
        LatestFeedSortStrategy,
        MostLikedFeedSortStrategy,
        MostCommentedFeedSortStrategy,
        RelevanceFeedSortStrategy,
        PostEventsEmitter,
        DomainLoggerObserver,
        NotificationObserver,
        RecomputeObserver,
    ],
})
export class PostsModule {}
