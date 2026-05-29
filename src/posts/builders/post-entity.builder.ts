import { Post, Comment, Like } from "@prisma/client"
import { PostEntity } from "@/posts/entities/post.entity"

type PostWithRelations = Post & { comments: Comment[]; likes: Like[] }

export class PostEntityBuilder {
    private readonly post: PostWithRelations
    private mode: string = "latest"

    constructor(post: PostWithRelations) {
        this.post = post
    }

    withMode(mode: string): this {
        this.mode = mode
        return this
    }

    build(): PostEntity {
        const { post, mode } = this

        const likesCount = post.likes.reduce(
            (sum, like) => sum + like.weight,
            0,
        )
        const commentsCount = post.comments.length
        const hoursSinceCreated =
            (Date.now() - new Date(post.createdAt).getTime()) / 3_600_000
        const relevanceScore =
            likesCount * 2 +
            commentsCount * 3 -
            Math.floor(hoursSinceCreated)

        const tags = post.title
            .split(" ")
            .filter((word) => word.length > 4)

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
