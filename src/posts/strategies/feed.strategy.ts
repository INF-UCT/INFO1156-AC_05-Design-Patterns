import { PostEntity } from "@/posts/entities/post.entity"

export interface FeedStrategy {
    sort(posts: PostEntity[]): PostEntity[]
}

export class LatestFeedStrategy implements FeedStrategy {
    sort(posts: PostEntity[]): PostEntity[] {
        return [...posts].sort(
            (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
        )
    }
}

export class MostLikedFeedStrategy implements FeedStrategy {
    sort(posts: PostEntity[]): PostEntity[] {
        return [...posts].sort((a, b) => b.likesCount - a.likesCount)
    }
}

export class MostCommentedFeedStrategy implements FeedStrategy {
    sort(posts: PostEntity[]): PostEntity[] {
        return [...posts].sort((a, b) => b.commentsCount - a.commentsCount)
    }
}

export class RelevanceFeedStrategy implements FeedStrategy {
    sort(posts: PostEntity[]): PostEntity[] {
        return [...posts].sort((a, b) => b.relevanceScore - a.relevanceScore)
    }
}
