import { Injectable } from "@nestjs/common"
import { PrismaService } from "@/prisma/prisma.service"
import { AddLikeDto, CreateCommentDto, CreatePostDto } from "@/posts/posts.dtos"

@Injectable()
export class PostsRepository {
    constructor(private readonly prisma: PrismaService) {}

    createPost(data: CreatePostDto) {
        return this.prisma.post.create({ data })
    }

    findAllPosts() {
        return this.prisma.post.findMany({
            orderBy: { createdAt: "desc" },
        })
    }

    findPostById(id: number) {
        return this.prisma.post.findUnique({
            where: { id },
        })
    }

    findFeedPosts() {
        return this.prisma.post.findMany({
            include: {
                comments: true,
                likes: true,
            },
        })
    }

    findCommentsByPostId(postId: number) {
        return this.prisma.comment.findMany({
            where: { postId },
            orderBy: { createdAt: "desc" },
        })
    }

    createComment(
        postId: number,
        data: CreateCommentDto,
        source = "controller",
    ) {
        return this.prisma.comment.create({
            data: {
                postId,
                content: data.content,
                source,
            },
        })
    }

    createLike(postId: number, data: AddLikeDto, source = "controller") {
        return this.prisma.like.create({
            data: {
                postId,
                reactionType: data.reactionType || "like",
                weight: data.weight || 1,
                source,
            },
        })
    }
}