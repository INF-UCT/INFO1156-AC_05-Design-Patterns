export interface ContentModerator {
  moderateContent(content: string): Promise<boolean>;
}

// Token para la inyeccion de dependencias en NestJS
export const CONTENT_MODERATOR_TOKEN = Symbol('CONTENT_MODERATOR_TOKEN');
