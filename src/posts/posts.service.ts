// src/posts/posts.service.ts
import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { ContentModerator, CONTENT_MODERATOR_TOKEN } from './moderation.interface';
import { CreatePostDto } from './posts.dtos';

@Injectable()
export class PostsService {
  constructor(
    @Inject(CONTENT_MODERATOR_TOKEN)
    private readonly moderator: ContentModerator,
  ) {}

  public async createPost(dto: CreatePostDto) {
    // 1. Moderamos tanto el título como la descripción
    const isTitleSafe = await this.moderator.moderateContent(dto.title);
    const isDescriptionSafe = await this.moderator.moderateContent(dto.description);

    // 2. Si alguno de los dos no pasa la moderación, bloqueamos la creación
    if (!isTitleSafe || !isDescriptionSafe) {
      throw new BadRequestException('El contenido no pasó la moderación.');
    }

    // 3. Lógica para guardar en la base de datos...
    return { message: 'Post creado con éxito' };
  }
}
