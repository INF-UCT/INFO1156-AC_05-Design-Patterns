import { PostEntity } from "@/posts/entities/post.entity"

export interface PostSortStrategy {
    sort(posts: PostEntity[]): PostEntity[]
}

export class LatestSortStrategy implements PostSortStrategy {
    sort(posts: PostEntity[]): PostEntity[] {
        return posts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    }
}

export class MostLikedSortStrategy implements PostSortStrategy {
    sort(posts: PostEntity[]): PostEntity[] {
        return posts.sort((a, b) => b.likesCount - a.likesCount)
    }
}

export class MostCommentedSortStrategy implements PostSortStrategy {
    sort(posts: PostEntity[]): PostEntity[] {
        return posts.sort((a, b) => b.commentsCount - a.commentsCount)
    }
}

export class RelevanceSortStrategy implements PostSortStrategy {
    sort(posts: PostEntity[]): PostEntity[] {
        return posts.sort((a, b) => b.relevanceScore - a.relevanceScore)
    }
}

export class PostSortContext {
    private strategy: PostSortStrategy;

    constructor(mode: string) {
        switch (mode) {
            case "mostLiked":
                this.strategy = new MostLikedSortStrategy();
                break;
            case "mostCommented":
                this.strategy = new MostCommentedSortStrategy();
                break;
            case "relevance":
                this.strategy = new RelevanceSortStrategy();
                break;
            case "latest":
            default:
                this.strategy = new LatestSortStrategy();
                break;
        }
    }

    sort(posts: PostEntity[]): PostEntity[] {
        return this.strategy.sort(posts);
    }
}
