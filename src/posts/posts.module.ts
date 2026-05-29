import { Module } from "@nestjs/common"
import { PostsController } from "@/posts/posts.controller"
import { PostsService } from "@/posts/posts.service"
import { LegacyModerationAdapter } from "@/posts/adapters/moderation.adapter"
import { FeedStrategyContext } from "@/posts/strategies/feed-strategy.context"

@Module({
    controllers: [PostsController],
    providers: [PostsService, LegacyModerationAdapter, FeedStrategyContext],
})
export class PostsModule {}
