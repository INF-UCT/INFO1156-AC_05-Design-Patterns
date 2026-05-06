import { PostEntity } from "./post.entity"
import { CommentEntity } from "./comment.entity"
import { LikeEntity } from "./like.entity"

export class EntityFactory {
    static createPost(post: any, mode: string): PostEntity {
        const likesCount = post.likes.reduce(
            (sum: number, like: any) => sum + like.weight,
            0,
        )
        const commentsCount = post.comments.length
        
        // 36_000_00 = 1 hora en milisegundos.
        const hoursSinceCreated =
            (Date.now() - new Date(post.createdAt).getTime()) / 36_000_00
            
        const relevanceScore =
            likesCount * 2 + commentsCount * 3 - Math.floor(hoursSinceCreated)

        const tags = post.title.split(" ").filter((word: string) => word.length > 4)
        
        const metadata = {
            likesWeights: post.likes.map((like: any) => like.weight),
            commentLengths: post.comments.map((comment: any) => comment.content.length),
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
            "feed-factory",
            tags,
            metadata,
            mode,
        )
    }

    static createComment(comment: any): CommentEntity {
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
            { chars: comment.content.length, source: comment.source },
        )
    }

    static createCommentWithModeration(created: any, moderation: any): CommentEntity {
        return new CommentEntity(
            created.id,
            created.postId,
            created.content,
            created.createdAt,
            created.updatedAt,
            created.source,
            "approved",
            created.content.length > 60 ? 80 : 40,
            false,
            "es",
            { moderation, source: "legacy" },
        )
    }

    static createLike(like: any): LikeEntity {
        return new LikeEntity(
            like.id,
            like.postId,
            like.reactionType,
            like.weight,
            like.source,
            like.createdAt,
            like.weight > 2 ? "strong" : "normal",
            true,
            { from: "manual", r: like.reactionType },
        )
    }
}
