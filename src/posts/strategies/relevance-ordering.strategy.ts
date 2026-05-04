import { PostEntity } from "@/posts/entities/post.entity"
import { FeedOrderingStrategy } from "./feed-ordering.strategy"

export class RelevanceOrderingStrategy implements FeedOrderingStrategy {
    sort(posts: PostEntity[]): PostEntity[] {
        return posts.sort((a, b) => b.relevanceScore - a.relevanceScore)
    }
}
