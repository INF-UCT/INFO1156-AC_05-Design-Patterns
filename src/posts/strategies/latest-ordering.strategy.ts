import { PostEntity } from "@/posts/entities/post.entity"
import { FeedOrderingStrategy } from "./feed-ordering.strategy"

export class LatestOrderingStrategy implements FeedOrderingStrategy {
    sort(posts: PostEntity[]): PostEntity[] {
        return posts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    }
}
