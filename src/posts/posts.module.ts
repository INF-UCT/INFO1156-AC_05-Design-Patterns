import { Module } from "@nestjs/common"
import { PostsController } from "@/posts/posts.controller"
import { PostsService } from "@/posts/posts.service"
import { IModerationService } from "./interfaces/moderation.interface"
import { LegacyModerationAdapter } from "./legacy-moderation.adapter"

@Module({
    controllers: [PostsController],
    providers: [
        PostsService,
        {
            provide: IModerationService,
            useClass: LegacyModerationAdapter,
        },
    ],
})
export class PostsModule {}
