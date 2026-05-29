import { Module } from "@nestjs/common"
import { PostsController } from "@/posts/posts.controller"
import { PostsService } from "@/posts/posts.service"
import { DomainEventPublisher } from "@/posts/events/domain-event.publisher"
import { LoggingObserver } from "@/posts/events/observers/logging.observer"
import { NotificationObserver } from "@/posts/events/observers/notification.observer"
import { RecomputeObserver } from "@/posts/events/observers/recompute.observer"
import { CONTENT_MODERATOR } from "@/posts/moderation/content-moderator.interface"
import { LegacyModerationAdapter } from "@/posts/moderation/legacy-moderation.adapter"
import { RankingService } from "@/posts/ranking/ranking.service"

@Module({
    controllers: [PostsController],
    providers: [
        PostsService,
        RankingService,
        { provide: CONTENT_MODERATOR, useClass: LegacyModerationAdapter },
        DomainEventPublisher,
        LoggingObserver,
        NotificationObserver,
        RecomputeObserver,
    ],
})
export class PostsModule {}
