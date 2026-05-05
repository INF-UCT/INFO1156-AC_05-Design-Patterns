import { PostEntity } from "@/posts/entities/post.entity"

export interface FeedOrderingStrategy {
    sort(posts: PostEntity[]): PostEntity[]
}
