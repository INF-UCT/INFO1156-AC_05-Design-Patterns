import { Module } from "@nestjs/common"
import { PostsController } from "@/posts/posts.controller"
import {
    DomainEventLogger,
    NotificationObserver,
    PostEventPublisher,
    RelevanceRecomputeObserver,
} from "@/posts/events/post-event.publisher"
import { PostEntityFactory } from "@/posts/factories/post-entity.factory"
import { PostsRepository } from "@/posts/posts.repository"
import { PostsService } from "@/posts/posts.service"

@Module({
    controllers: [PostsController],
    providers: [
        PostsService,
        PostsRepository,
        PostEntityFactory,
        PostEventPublisher,
        DomainEventLogger,
        NotificationObserver,
        RelevanceRecomputeObserver,
    ],
})
export class PostsModule {}