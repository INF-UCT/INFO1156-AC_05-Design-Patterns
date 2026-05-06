import { PostEntity } from "@/posts/entities/post.entity"
import { FeedOrderingStrategy } from "./feed-ordering.strategy"

export class MostCommentedOrderingStrategy implements FeedOrderingStrategy {
    sort(posts: PostEntity[]): PostEntity[] {
        return posts.sort((a, b) => b.commentsCount - a.commentsCount)
    }
}
