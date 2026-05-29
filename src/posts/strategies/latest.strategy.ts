import { PostEntity } from "@/posts/entities/post.entity"
import { FeedSortStrategy } from "./feed-sort.strategy"

export class LatestStrategy implements FeedSortStrategy {
    sort(posts: PostEntity[]): PostEntity[] {
        return [...posts].sort(
            (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
        )
    }
}