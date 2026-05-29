import { Module } from "@nestjs/common"
import { PostsController } from "@/posts/posts.controller"
import { PostsService } from "@/posts/posts.service"
import { CONTENT_MODERATOR } from "@/posts/moderation/content-moderator.interface"
import { LegacyModerationAdapter } from "@/posts/moderation/legacy-moderation.adapter"
import { RankingService } from "@/posts/ranking/ranking.service"

@Module({
    controllers: [PostsController],
    providers: [
        PostsService,
        RankingService,
        { provide: CONTENT_MODERATOR, useClass: LegacyModerationAdapter },
    ],
})
export class PostsModule {}
