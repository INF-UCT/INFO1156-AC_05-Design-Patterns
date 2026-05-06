import { PostEntity } from "../entities/post.entity"

// Esta clase solo tiene una razón para cambiar: si cambian las fórmulas matemáticas del negocio.
class FeedMetricsCalculator {
    static calculateScore(
        likesCount: number,
        commentsCount: number,
        createdAt: Date,
    ): number {
        const hoursSinceCreated = (Date.now() - createdAt.getTime()) / 36_000_00
        return (
            likesCount * 2 + commentsCount * 3 - Math.floor(hoursSinceCreated)
        )
    }

    static extractTags(title: string): string[] {
        return title.split(" ").filter((word: string) => word.length > 4)
    }
}

// Esta clase ahora solo mapea datos, no hace cálculos matemáticos
export class PostFactory {
    static createFromFeed(post: any, mode: string): PostEntity {
        const likesCount = post.likes.reduce(
            (sum: any, like: any) => sum + like.weight,
            0,
        )
        const commentsCount = post.comments.length
        const createdAt = new Date(post.createdAt)

        // Delegamos los cálculos a la clase experta
        const relevanceScore = FeedMetricsCalculator.calculateScore(
            likesCount,
            commentsCount,
            createdAt,
        )
        const tags = FeedMetricsCalculator.extractTags(post.title)

        const metadata = {
            likesWeights: post.likes.map((like: any) => like.weight),
            commentLengths: post.comments.map(
                (comment: any) => comment.content.length,
            ),
            hourOfCreate: createdAt.getHours(),
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
}
