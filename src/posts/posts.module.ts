import { Module } from '@nestjs/common';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { LegacyModerationAdapter } from './legacy-moderation.adapter';
import { CONTENT_MODERATOR_TOKEN } from './moderation.interface';

@Module({
  controllers: [PostsController],
  providers: [
    PostsService,
    // Vinculamos la interfaz con nuestro Adapter
    {
      provide: CONTENT_MODERATOR_TOKEN,
      useClass: LegacyModerationAdapter, 
    },
  ],
})
export class PostsModule {}
