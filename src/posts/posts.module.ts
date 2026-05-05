import { Module, OnModuleInit } from "@nestjs/common"
import { PostsController } from "@/posts/posts.controller"
import { PostsService } from "@/posts/posts.service"
import { FeedService } from "@/posts/feed/feed.service"
import { EntityFactory } from "@/posts/entities/entity.factory"
import { EventBus } from "@/posts/domain/event-bus"
import { LoggerSubscriber } from "@/posts/domain/logger.subscriber"
import { NotificationSubscriber } from "@/posts/domain/notification.subscriber"
import { RecomputeSubscriber } from "@/posts/domain/recompute.subscriber"
import { LegacyModerationAdapter } from "@/posts/moderation/legacy-moderation.adapter"
import { MODERATION_PROVIDER } from "@/posts/moderation/moderation.token"
import { FeedSortContext } from "@/posts/feed/feed-sort.context"
import { LatestSortStrategy } from "@/posts/feed/latest-sort.strategy"
import { MostLikedSortStrategy } from "@/posts/feed/most-liked-sort.strategy"
import { MostCommentedSortStrategy } from "@/posts/feed/most-commented-sort.strategy"
import { RelevanceSortStrategy } from "@/posts/feed/relevance-sort.strategy"

@Module({
    controllers: [PostsController],
    providers: [
        PostsService,
        FeedService,
        EntityFactory,
        EventBus,
        LoggerSubscriber,
        NotificationSubscriber,
        RecomputeSubscriber,
        {
            provide: MODERATION_PROVIDER,
            useClass: LegacyModerationAdapter,
        },
        FeedSortContext,
        LatestSortStrategy,
        MostLikedSortStrategy,
        MostCommentedSortStrategy,
        RelevanceSortStrategy,
    ],
    exports: [PostsService, FeedService, EventBus],
})
export class PostsModule implements OnModuleInit {
    constructor(
        private readonly eventBus: EventBus,
        private readonly loggerSubscriber: LoggerSubscriber,
        private readonly notificationSubscriber: NotificationSubscriber,
        private readonly recomputeSubscriber: RecomputeSubscriber,
    ) {}

    onModuleInit() {
        const events = ["post.created", "comment.created", "like.created"]

        for (const event of events) {
            this.eventBus.subscribe(event, this.loggerSubscriber)
            this.eventBus.subscribe(event, this.notificationSubscriber)
            this.eventBus.subscribe(event, this.recomputeSubscriber)
        }
    }
}
