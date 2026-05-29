import { Module } from "@nestjs/common"
import { PostsController } from "@/posts/posts.controller"
import { PostsService } from "@/posts/posts.service"
import { MODERATION_PORT } from "@/posts/moderation/moderation.port"
import { LegacyModerationAdapter } from "@/posts/moderation/legacy-moderation.adapter"
import { RankingService } from "@/posts/ranking/ranking.service"
import { PostEventsFacade } from "@/posts/events.facade"
import { PostEntityFactory } from "@/posts/factories/post-entity.factory"
import { CommentEntityFactory } from "@/posts/factories/comment-entity.factory"
import { LikeEntityFactory } from "@/posts/factories/like-entity.factory"

@Module({
    controllers: [PostsController],
    providers: [
        PostsService,
        RankingService,
        PostEventsFacade,
        PostEntityFactory,
        CommentEntityFactory,
        LikeEntityFactory,
        { provide: MODERATION_PORT, useClass: LegacyModerationAdapter },
    ],
})
export class PostsModule {}
