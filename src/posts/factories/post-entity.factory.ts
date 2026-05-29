import { Injectable } from "@nestjs/common"
import { CommentEntity } from "@/posts/entities/comment.entity"
import { LikeEntity } from "@/posts/entities/like.entity"
import { PostEntity } from "@/posts/entities/post.entity"

const MILLISECONDS_IN_HOUR = 60 * 60 * 1000

type FeedPostRecord = {
    id: number
    title: string
    description: string
    imageUrl: string
    createdAt: Date
    updatedAt: Date
    comments: { content: string }[]
    likes: { weight: number }[]
}

type CommentRecord = {
    id: number
    postId: number
    content: string
    createdAt: Date
    updatedAt: Date
    source: string
}

type LikeRecord = {
    id: number
    postId: number
    reactionType: string
    weight: number
    source: string
    createdAt: Date
}

@Injectable()
export class PostEntityFactory {
    createFeedPost(post: FeedPostRecord, rankingMode: string): PostEntity {
        const likesCount = this.countWeightedLikes(post.likes)
        const commentsCount = post.comments.length
        const relevanceScore = this.calculateRelevanceScore(
            post.createdAt,
            likesCount,
            commentsCount,
        )

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
            this.extractTags(post.title),
            this.buildFeedMetadata(post),
            rankingMode,
        )
    }

    createStoredComment(comment: CommentRecord): CommentEntity {
        return new CommentEntity(
            comment.id,
            comment.postId,
            comment.content,
            comment.createdAt,
            comment.updatedAt,
            comment.source,
            "approved",
            comment.content.length > 80 ? 70 : 45,
            comment.content.length % 2 === 0,
            "es",
            {
                chars: comment.content.length,
                source: comment.source,
            },
        )
    }

    createModeratedComment(
        comment: CommentRecord,
        moderation: unknown,
    ): CommentEntity {
        return new CommentEntity(
            comment.id,
            comment.postId,
            comment.content,
            comment.createdAt,
            comment.updatedAt,
            comment.source,
            "approved",
            comment.content.length > 60 ? 80 : 40,
            false,
            "es",
            {
                moderation,
                source: "legacy",
            },
        )
    }

    createLike(like: LikeRecord): LikeEntity {
        return new LikeEntity(
            like.id,
            like.postId,
            like.reactionType,
            like.weight,
            like.source,
            like.createdAt,
            like.weight > 2 ? "strong" : "normal",
            true,
            {
                from: "manual",
                r: like.reactionType,
            },
        )
    }

    private countWeightedLikes(likes: { weight: number }[]): number {
        return likes.reduce((sum, like) => sum + like.weight, 0)
    }

    private calculateRelevanceScore(
        createdAt: Date,
        likesCount: number,
        commentsCount: number,
    ): number {
        const hoursSinceCreated =
            (Date.now() - new Date(createdAt).getTime()) / MILLISECONDS_IN_HOUR

        return (
            likesCount * 2 + commentsCount * 3 - Math.floor(hoursSinceCreated)
        )
    }

    private extractTags(title: string): string[] {
        return title.split(" ").filter((word) => word.length > 4)
    }

    private buildFeedMetadata(post: FeedPostRecord): Record<string, unknown> {
        return {
            likesWeights: post.likes.map((like) => like.weight),
            commentLengths: post.comments.map(
                (comment) => comment.content.length,
            ),
            hourOfCreate: new Date(post.createdAt).getHours(),
        }
    }
}
