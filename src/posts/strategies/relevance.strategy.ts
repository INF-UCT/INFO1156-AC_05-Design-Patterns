import { PostEntity } from "@/posts/entities/post.entity"
import { FeedSortStrategy } from "./feed-sort.strategy"

export class RelevanceStrategy implements FeedSortStrategy {
    sort(posts: PostEntity[]): PostEntity[] {
        return [...posts].sort((a, b) => b.relevanceScore - a.relevanceScore)
    }
}