import { PostEntity } from "./entities/post.entity";

export const feedStrategies: Record<string, (a: PostEntity, b: PostEntity) => number> = {
    latest: (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    mostLiked: (a, b) => b.likesCount - a.likesCount,
    mostCommented: (a, b) => b.commentsCount - a.commentsCount,
    relevance: (a, b) => b.relevanceScore - a.relevanceScore,
};