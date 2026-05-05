import { Injectable } from "@nestjs/common"
import {
    Post as PrismaPost,
    Comment as PrismaComment,
    Like as PrismaLike,
} from "@prisma/client"
import { PostEntity } from "@/posts/entities/post.entity"
import { CommentEntity } from "@/posts/entities/comment.entity"
import { LikeEntity } from "@/posts/entities/like.entity"
import { PostEntityBuilder } from "@/posts/entities/post-entity.builder"
import { CommentEntityBuilder } from "@/posts/entities/comment-entity.builder"
import { LikeEntityBuilder } from "@/posts/entities/like-entity.builder"

@Injectable()
export class EntityFactory {
    createPostEntity(
        post: PrismaPost & { likes: PrismaLike[]; comments: PrismaComment[] },
        mode: string,
    ): PostEntity {
        const likesCount = post.likes.reduce(
            (sum, like) => sum + like.weight,
            0,
        )
        const commentsCount = post.comments.length
        const hoursSinceCreated =
            (Date.now() - new Date(post.createdAt).getTime()) / 3_600_000
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

        return new PostEntityBuilder()
            .withId(post.id)
            .withTitle(post.title)
            .withDescription(post.description)
            .withImageUrl(post.imageUrl)
            .withCreatedAt(post.createdAt)
            .withUpdatedAt(post.updatedAt)
            .withLikesCount(likesCount)
            .withCommentsCount(commentsCount)
            .withRelevanceScore(relevanceScore)
            .withIsFeatured(relevanceScore > 20)
            .withSource("feed-service")
            .withTags(tags)
            .withMetadata(metadata)
            .withRankingMode(mode)
            .build()
    }

    createCommentEntity(
        comment: PrismaComment,
        source: string,
        metadata?: Record<string, unknown>,
    ): CommentEntity {
        const sentimentScore = comment.content.length > 80 ? 70 : 45

        return new CommentEntityBuilder()
            .withId(comment.id)
            .withPostId(comment.postId)
            .withContent(comment.content)
            .withCreatedAt(comment.createdAt)
            .withUpdatedAt(comment.updatedAt)
            .withSource(source)
            .withModerationState("approved")
            .withSentimentScore(sentimentScore)
            .withIsPinned(comment.content.length % 2 === 0)
            .withLanguage("es")
            .withMetadata(
                metadata || {
                    chars: comment.content.length,
                    source: comment.source,
                },
            )
            .build()
    }

    createLikeEntity(
        like: PrismaLike,
        metadata?: Record<string, unknown>,
    ): LikeEntity {
        const strengthLabel = like.weight > 2 ? "strong" : "normal"

        return new LikeEntityBuilder()
            .withId(like.id)
            .withPostId(like.postId)
            .withReactionType(like.reactionType)
            .withWeight(like.weight)
            .withSource(like.source)
            .withCreatedAt(like.createdAt)
            .withStrengthLabel(strengthLabel)
            .withAffectsRelevance(true)
            .withMetadata(
                metadata || {
                    from: "manual",
                    r: like.reactionType,
                },
            )
            .build()
    }
}
