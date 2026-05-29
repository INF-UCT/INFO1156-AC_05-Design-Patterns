import { Module } from "@nestjs/common"
import { PostsController } from "@/posts/posts.controller"
import { PostsService } from "@/posts/posts.service"
import { MODERATION_PORT } from "@/posts/moderation/moderation.port"
import { LegacyModerationAdapter } from "@/posts/moderation/legacy-moderation.adapter"
import { RankingService } from "@/posts/ranking/ranking.service"
import { PostEventsFacade } from "@/posts/events.facade"

@Module({
    controllers: [PostsController],
    providers: [
        PostsService,
        RankingService,
        PostEventsFacade,
        { provide: MODERATION_PORT, useClass: LegacyModerationAdapter },
    ],
})
export class PostsModule {}
