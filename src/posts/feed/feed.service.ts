import { Injectable } from "@nestjs/common"
import { PrismaService } from "@/prisma/prisma.service"
import { FeedQueryDto } from "@/posts/posts.dtos"
import { PostEntity } from "@/posts/entities/post.entity"
import { EntityFactory } from "@/posts/entities/entity.factory"
import { FeedSortContext } from "@/posts/feed/feed-sort.context"

@Injectable()
export class FeedService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly entityFactory: EntityFactory,
        private readonly feedSortContext: FeedSortContext,
    ) {}

    async getFeed(query: FeedQueryDto): Promise<{
        mode: string
        count: number
        rows: PostEntity[]
    }> {
        const mode = query.mode || "latest"

        const posts = await this.prisma.post.findMany({
            include: {
                comments: true,
                likes: true,
            },
        })

        const mappedPosts = posts.map((post) =>
            this.entityFactory.createPostEntity(post, mode),
        )

        const strategy = this.feedSortContext.resolve(mode)
        const sorted = strategy.sort(mappedPosts)

        return {
            mode,
            count: sorted.length,
            rows: sorted,
        }
    }
}
