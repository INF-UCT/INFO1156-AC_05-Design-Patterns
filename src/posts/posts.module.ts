import { Module } from "@nestjs/common"
import { PostsController } from "@/posts/posts.controller"
import { PostsService } from "@/posts/posts.service"
import { RankingService } from "@/posts/ranking/ranking.service"

@Module({
    controllers: [PostsController],
    providers: [PostsService, RankingService],
})
export class PostsModule {}
