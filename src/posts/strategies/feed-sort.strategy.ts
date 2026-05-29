import { PostEntity } from "@/posts/entities/post.entity"

export interface FeedSortStrategy {
    sort(posts: PostEntity[]): PostEntity[]
}