import { Module } from "@nestjs/common"
import { PostsController } from "@/posts/posts.controller"
import { PostsService } from "@/posts/posts.service"
import { IModerationService } from "./interfaces/moderation.interface"
import { LegacyModerationAdapter } from "./legacy-moderation.adapter"
import { DomainEventPublisher } from "@/posts/events/domain-event-publisher.service"
import { LoggerObserver } from "@/posts/observers/logger.observer"
import { NotificationObserver } from "@/posts/observers/notification.observer"
import { RecomputeObserver } from "@/posts/observers/recompute.observer"

@Module({
    controllers: [PostsController],
    providers: [
        PostsService,
        DomainEventPublisher,
        // Inicializar instancias de observadores
        LoggerObserver,
        NotificationObserver,
        RecomputeObserver,
        //
        {
            provide: IModerationService,
            useClass: LegacyModerationAdapter,
        },
    ],
})
export class PostsModule {}
