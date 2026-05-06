import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common"
import { AddLikeDto, CreateCommentDto, CreatePostDto } from "@/posts/posts.dtos"
import { EntityFactory } from "@/posts/entities/entity.factory"
import { ModerationAdapter } from "@/posts/moderation.adapter"
import { PostsService } from "@/posts/posts.service"
import { PrismaService } from "@/prisma/prisma.service"

@Injectable()
export class PostsFacade {
    constructor(
        private readonly postsService: PostsService,
        private readonly prisma: PrismaService,
    ) {}

    private logDomainEvent(eventName: string, payload: Record<string, unknown>) {
        console.log(`[event:${eventName}]`, payload)
    }

    private fakeSendNotification(type: string, payload: Record<string, unknown>) {
        console.log(`[notify:${type}]`, payload)
    }

    private fakeRecomputeSomething(postId: number) {
        console.log(`[recompute] postId=${postId}`)
    }

    async createPost(data: CreatePostDto) {
        const created = await this.postsService.create(data)
        this.logDomainEvent("post.created", {
            postId: created.id,
            title: created.title,
        })
        this.fakeSendNotification("post", { postId: created.id })
        this.fakeRecomputeSomething(created.id)
        return created
    }

    getAllPosts() {
        return this.postsService.findAll()
    }

    async findPostById(id: number) {
        const post = await this.postsService.findById(id)
        if (!post) {
            throw new NotFoundException("Post not found")
        }
        return post
    }

    async getFeed(mode: string) {
        const posts = await this.prisma.post.findMany({
            include: {
                comments: true,
                likes: true,
            },
        })

        const mappedPosts = posts.map((post) => EntityFactory.createPost(post, mode))

        let sorted = [...mappedPosts]
        switch (mode) {
            case "latest":
                sorted = sorted.sort(
                    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
                )
                break
            case "mostLiked":
                sorted = sorted.sort((a, b) => b.likesCount - a.likesCount)
                break
            case "mostCommented":
                sorted = sorted.sort(
                    (a, b) => b.commentsCount - a.commentsCount,
                )
                break
            case "relevance":
                sorted = sorted.sort(
                    (a, b) => b.relevanceScore - a.relevanceScore,
                )
                break
            default:
                sorted = sorted.sort(
                    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
                )
                break
        }

        return {
            mode,
            count: sorted.length,
            rows: sorted,
        }
    }

    async getComments(postId: number) {
        await this.findPostById(postId)

        const comments = await this.prisma.comment.findMany({
            where: { postId },
            orderBy: { createdAt: "desc" },
        })

        const entities = comments.map((comment) => EntityFactory.createComment(comment))

        return {
            total_comments: entities.length,
            comments: entities,
        }
    }

    async createComment(postId: number, data: CreateCommentDto) {
        await this.findPostById(postId)

        const moderation = ModerationAdapter.review(data.content)
        if (moderation.blocked) {
            throw new BadRequestException("Comment blocked by moderation")
        }

        const created = await this.prisma.comment.create({
            data: {
                postId,
                content: data.content,
                source: "facade",
            },
        })

        const entity = EntityFactory.createCommentWithModeration(
            created,
            moderation.raw,
        )

        this.logDomainEvent("comment.created", {
            postId,
            commentId: created.id,
        })
        this.fakeSendNotification("comment", { postId })
        this.fakeRecomputeSomething(postId)

        return {
            message: "comment_created",
            entity,
        }
    }

    async addLike(postId: number, data: AddLikeDto) {
        await this.findPostById(postId)

        const reactionType = data.reactionType || "like"
        const weight = data.weight || 1
        if (weight < 1) {
            throw new BadRequestException("Weight must be at least 1")
        }

        const like = await this.prisma.like.create({
            data: {
                postId,
                reactionType,
                weight,
                source: "facade",
            },
        })

        const entity = EntityFactory.createLike(like)

        this.logDomainEvent("like.created", {
            postId,
            likeId: like.id,
        })
        this.fakeSendNotification("like", { postId, reactionType })
        this.fakeRecomputeSomething(postId)

        return {
            success: true,
            like: entity,
        }
    }
}
