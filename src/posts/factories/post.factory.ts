import type { Comment, Like, Post } from "@prisma/client"
import { PostEntity } from "@/posts/entities/post.entity"

type PostWithInteractions = Post & {
    comments: Comment[]
    likes: Like[]
}

const ONE_HOUR_IN_MS = 36_000_00

export class PostFactory {
    static fromDb(post: PostWithInteractions, mode: string): PostEntity {
        const likesCount = post.likes.reduce(
            (sum, like) => sum + like.weight,
            0,
        )
        const commentsCount = post.comments.length
        const hoursSinceCreated =
            (Date.now() - new Date(post.createdAt).getTime()) / ONE_HOUR_IN_MS
        const relevanceScore =
            likesCount * 2 + commentsCount * 3 - Math.floor(hoursSinceCreated)

        const tags = post.title.split(" ").filter((word) => word.length > 4)
        const metadata = {
            likesWeights: post.likes.map((like) => like.weight),
            commentLengths: post.comments.map(
                (comment) => comment.content.length,
            ),
            hourOfCreate: new Date(post.createdAt).getHours(),
        }

        return new PostEntity(
            post.id,
            post.title,
            post.description,
            post.imageUrl,
            post.createdAt,
            post.updatedAt,
            likesCount,
            commentsCount,
            relevanceScore,
            relevanceScore > 20,
            "feed-controller",
            tags,
            metadata,
            mode,
        )
    }
}
