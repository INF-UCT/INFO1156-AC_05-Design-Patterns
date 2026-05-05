import { Injectable } from "@nestjs/common"
import { PostEntity } from "@/posts/entities/post.entity"
import { FeedSortStrategy } from "@/posts/feed/feed-sort.strategy"

@Injectable()
export class LatestSortStrategy implements FeedSortStrategy {
    sort(posts: PostEntity[]): PostEntity[] {
        return [...posts].sort(
            (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
        )
    }
}
