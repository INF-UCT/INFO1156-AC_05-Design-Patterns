import { Injectable } from "@nestjs/common"
import { PostBuilder } from "@/posts/entities/post.builder"
import { PostEntity } from "@/posts/entities/post.entity"

interface FeedPostRecord {
    id: number
    title: string
    description: string
    imageUrl: string
    createdAt: Date
    updatedAt: Date
    comments: Array<{ content: string }>
    likes: Array<{ weight: number }>
}

@Injectable()
export class PostEntityFactory {
    fromFeedRecord(post: FeedPostRecord, mode: string): PostEntity {
        const likesCount = post.likes.reduce(
            (sum, like) => sum + like.weight,
            0,
        )
        const commentsCount = post.comments.length
        const hoursSinceCreated =
            (Date.now() - new Date(post.createdAt).getTime()) / 36_000_00
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

        return new PostBuilder()
            .setId(post.id)
            .setTitle(post.title)
            .setDescription(post.description)
            .setImageUrl(post.imageUrl)
            .setTimestamps(post.createdAt, post.updatedAt)
            .setMetrics(likesCount, commentsCount)
            .setRelevance(relevanceScore, relevanceScore > 20)
            .setSourceInfo("feed-controller")
            .setTags(tags)
            .setMetadata(metadata)
            .setRankingMode(mode)
            .build()
    }
}
