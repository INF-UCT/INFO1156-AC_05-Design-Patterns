import { Module } from "@nestjs/common"
import { PostsController } from "@/posts/posts.controller"
import { PostsService } from "@/posts/posts.service"
import { RankingService } from "@/posts/ranking/ranking.service"
import { ModerationAdapter } from "@/posts/adapters/moderation.adapter"

@Module({
    controllers: [PostsController],
    providers: [PostsService, RankingService, ModerationAdapter],
})
export class PostsModule {}
