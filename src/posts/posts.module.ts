import { Module, OnModuleInit } from "@nestjs/common"
import { PostsController } from "@/posts/posts.controller"
import { PostsService } from "@/posts/posts.service"
import { LegacyModerationAdapter } from "@/posts/moderation/legacy-moderation.adapter"
import { EventBus } from "@/core/events/EventBus"
import { LoggingHandler } from "@/core/events/handlers/LoggingHandler"
import { NotificationHandler } from "@/core/events/handlers/NotificationHandler"
import { RecomputeHandler } from "@/core/events/handlers/RecomputeHandler"

@Module({
    controllers: [PostsController],
    providers: [PostsService, LegacyModerationAdapter],
})
export class PostsModule implements OnModuleInit {
    onModuleInit() {
        const eventBus = EventBus.getInstance()
        const loggingHandler = new LoggingHandler()
        const notificationHandler = new NotificationHandler()
        const recomputeHandler = new RecomputeHandler()

        const events = ["post.created", "comment.created", "like.created"]

        events.forEach((eventName) => {
            eventBus.subscribe(eventName, loggingHandler)
            eventBus.subscribe(eventName, notificationHandler)
            eventBus.subscribe(eventName, recomputeHandler)
        })
    }
}
