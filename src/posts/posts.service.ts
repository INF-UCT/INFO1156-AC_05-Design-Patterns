import { Injectable } from "@nestjs/common"
import { AddLikeDto, CreateCommentDto, CreatePostDto } from "@/posts/posts.dtos"
import { PrismaService } from "@/prisma/prisma.service"
import { ContentFactory } from "./factories/content.factory"

@Injectable()
export class PostsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly contentFactory: ContentFactory,
    ) {}

    create(data: CreatePostDto) {
        return this.contentFactory.createPost(data)
    }

    findAll() {
        return this.prisma.post.findMany({
            orderBy: { createdAt: "desc" },
        })
    }

    findById(id: number) {
        return this.prisma.post.findUnique({ where: { id } })
    }

    createComment(postId: number, data: CreateCommentDto) {
        return this.contentFactory.createComment(postId, data)
    }

    addLike(postId: number, data: AddLikeDto) {
        return this.contentFactory.createLike(postId, data)
    }
}
