import { Module } from "@nestjs/common"
import { PostsController } from "@/posts/posts.controller"
import { PostsFacade } from "@/posts/posts.facade"
import { PostsService } from "@/posts/posts.service"

@Module({
    controllers: [PostsController],
    providers: [PostsFacade, PostsService],
})
export class PostsModule {}
