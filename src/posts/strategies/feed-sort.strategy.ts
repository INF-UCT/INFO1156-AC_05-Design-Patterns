import { Injectable } from "@nestjs/common"
import { PostEntity } from "@/posts/entities/post.entity"

export interface FeedSortStrategy {
    sort(posts: PostEntity[]): PostEntity[]
}

@Injectable()
export class LatestFeedSortStrategy implements FeedSortStrategy {
    sort(posts: PostEntity[]): PostEntity[] {
        return [...posts].sort(
            (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
        )
    }
}

@Injectable()
export class MostLikedFeedSortStrategy implements FeedSortStrategy {
    sort(posts: PostEntity[]): PostEntity[] {
        return [...posts].sort((a, b) => b.likesCount - a.likesCount)
    }
}

@Injectable()
export class MostCommentedFeedSortStrategy implements FeedSortStrategy {
    sort(posts: PostEntity[]): PostEntity[] {
        return [...posts].sort((a, b) => b.commentsCount - a.commentsCount)
    }
}

@Injectable()
export class RelevanceFeedSortStrategy implements FeedSortStrategy {
    sort(posts: PostEntity[]): PostEntity[] {
        return [...posts].sort((a, b) => b.relevanceScore - a.relevanceScore)
    }
}
