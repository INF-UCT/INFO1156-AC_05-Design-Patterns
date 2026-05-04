import { PostEntity } from "@/posts/entities/post.entity"

export type FeedRankingMode =
    | "latest"
    | "mostLiked"
    | "mostCommented"
    | "relevance"

export interface FeedRankingStrategy {
    readonly mode: FeedRankingMode
    sort(posts: PostEntity[]): PostEntity[]
}
