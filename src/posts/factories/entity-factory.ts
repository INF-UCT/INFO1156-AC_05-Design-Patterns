import { PostEntity } from "@/posts/entities/post.entity"
import { CommentEntity } from "@/posts/entities/comment.entity"
import { LikeEntity } from "@/posts/entities/like.entity"

export class EntityFactory {
    static createPostEntity(
        post: {
            id: number
            title: string
            description: string
            imageUrl: string
            createdAt: Date
            updatedAt: Date
            likes?: { weight: number }[]
            comments?: { content: string }[]
        },
        mode: string,
    ): PostEntity {
        const likesCount = post.likes
            ? post.likes.reduce((sum, like) => sum + like.weight, 0)
            : 0
        const commentsCount = post.comments ? post.comments.length : 0

        const hoursSinceCreated =
            (Date.now() - new Date(post.createdAt).getTime()) / 36_000_00

        const relevanceScore =
            likesCount * 2 + commentsCount * 3 - Math.floor(hoursSinceCreated)

        const tags = post.title.split(" ").filter((word) => word.length > 4)

        const metadata = {
            likesWeights: post.likes?.map((like) => like.weight) || [],
            commentLengths:
                post.comments?.map((comment) => comment.content.length) || [],
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
            "factory",
            tags,
            metadata,
            mode,
        )
    }

    static createCommentEntity(
        comment: {
            id: number
            postId: number
            content: string
            createdAt: Date
            updatedAt: Date
            source: string
        },
        options?: {
            source?: string
            moderation?: unknown
            moderationState?: string
        },
    ): CommentEntity {
        const contentLength = comment.content.length

        return new CommentEntity(
            comment.id,
            comment.postId,
            comment.content,
            comment.createdAt,
            comment.updatedAt,
            options?.source || comment.source,
            options?.moderationState || "approved",
            contentLength > 80 ? 70 : 45,
            contentLength % 2 === 0,
            "es",
            options?.moderation
                ? { ...options.moderation, source: "legacy" }
                : { chars: contentLength, source: comment.source },
        )
    }

    static createLikeEntity(
        like: {
            id: number
            postId: number
            reactionType: string
            weight: number
            source: string
            createdAt: Date
        },
        options?: {
            source?: string
            reactionType?: string
            weight?: number
        },
    ): LikeEntity {
        const reaction = options?.reactionType || like.reactionType
        const weight = options?.weight || like.weight

        return new LikeEntity(
            like.id,
            like.postId,
            reaction,
            weight,
            options?.source || like.source,
            like.createdAt,
            weight > 2 ? "strong" : "normal",
            true,
            { from: "factory", r: reaction },
        )
    }
}