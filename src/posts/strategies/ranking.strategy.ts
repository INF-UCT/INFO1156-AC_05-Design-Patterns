import { PostEntity } from "@/posts/entities/post.entity"

export interface RankingStrategy {
    sort(posts: PostEntity[]): PostEntity[]
}

export class LatestRankingStrategy implements RankingStrategy {
    sort(posts: PostEntity[]): PostEntity[] {
        return [...posts].sort(
            (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
        )
    }
}

export class MostLikedRankingStrategy implements RankingStrategy {
    sort(posts: PostEntity[]): PostEntity[] {
        return [...posts].sort((a, b) => b.likesCount - a.likesCount)
    }
}

export class MostCommentedRankingStrategy implements RankingStrategy {
    sort(posts: PostEntity[]): PostEntity[] {
        return [...posts].sort((a, b) => b.commentsCount - a.commentsCount)
    }
}

export class RelevanceRankingStrategy implements RankingStrategy {
    sort(posts: PostEntity[]): PostEntity[] {
        return [...posts].sort((a, b) => b.relevanceScore - a.relevanceScore)
    }
}

export class RankingContext {
    private strategy: RankingStrategy = new LatestRankingStrategy()

    setStrategy(strategy: RankingStrategy): void {
        this.strategy = strategy
    }

    execute(posts: PostEntity[]): PostEntity[] {
        return this.strategy.sort(posts)
    }

    static createFromMode(mode: string): RankingStrategy {
        switch (mode) {
            case "latest":
                return new LatestRankingStrategy()
            case "mostLiked":
                return new MostLikedRankingStrategy()
            case "mostCommented":
                return new MostCommentedRankingStrategy()
            case "relevance":
                return new RelevanceRankingStrategy()
            default:
                return new LatestRankingStrategy()
        }
    }
}