import { PostEntity } from "./entities/post.entity";

/**
 * Strategy Pattern:
 * Defines a family of algorithms (ranking methods for the feed), encapsulates each one,
 * and makes them interchangeable. This allows the ranking mode to vary independently
 * from the service that uses it, adhering to the Open/Closed Principle (OCP).
 * If a new ranking method is needed, we just add a new strategy class without modifying existing ones.
 */
export interface FeedRankingStrategy {
    rank(posts: PostEntity[]): PostEntity[];
}

export class LatestRankingStrategy implements FeedRankingStrategy {
    rank(posts: PostEntity[]): PostEntity[] {
        return [...posts].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
}

export class MostLikedRankingStrategy implements FeedRankingStrategy {
    rank(posts: PostEntity[]): PostEntity[] {
        return [...posts].sort((a, b) => b.likesCount - a.likesCount);
    }
}

export class MostCommentedRankingStrategy implements FeedRankingStrategy {
    rank(posts: PostEntity[]): PostEntity[] {
        return [...posts].sort((a, b) => b.commentsCount - a.commentsCount);
    }
}

export class RelevanceRankingStrategy implements FeedRankingStrategy {
    rank(posts: PostEntity[]): PostEntity[] {
        return [...posts].sort((a, b) => b.relevanceScore - a.relevanceScore);
    }
}

export class FeedRankingContext {
    private strategy: FeedRankingStrategy;

    constructor(mode: string) {
        switch (mode) {
            case "mostLiked":
                this.strategy = new MostLikedRankingStrategy();
                break;
            case "mostCommented":
                this.strategy = new MostCommentedRankingStrategy();
                break;
            case "relevance":
                this.strategy = new RelevanceRankingStrategy();
                break;
            case "latest":
            default:
                this.strategy = new LatestRankingStrategy();
                break;
        }
    }

    execute(posts: PostEntity[]): PostEntity[] {
        return this.strategy.rank(posts);
    }
}
