import {
    BadRequestException,
    Body,
    Controller,
    Get,
    Param,
    ParseIntPipe,
    Post,
    Query,
    NotFoundException,
} from "@nestjs/common"

import { EntityFactory } from "@/posts/entities/entity.factory"
import { legacyModerationApi } from "@/posts/legacy-moderation.client"
import { PrismaService } from "@/prisma/prisma.service"
import { PostsService } from "@/posts/posts.service"
import { ModerationAdapter } from "@/posts/moderation.adapter"
import { feedStrategies } from "@/posts/feed-sorter"
import { ForbiddenException } from "@nestjs/common"

import {
    AddLikeDto,
    CreateCommentDto,
    CreatePostDto,
    FeedQueryDto,
} from "@/posts/posts.dtos"

@Controller("api/posts")
export class PostsController {
    constructor(
        private readonly postsService: PostsService,
        private readonly prisma: PrismaService,
    ) {}

    @Post()
    async create(@Body() body: CreatePostDto) {
        if (body.title.length < 3 || body.title.length > 120) {
            throw new BadRequestException(
                "Title length must be between 3 and 120",
            )
        }

        if (!body.imageUrl.startsWith("http")) {
            throw new BadRequestException("Image URL must start with http")
        }

        const created = await this.prisma.post.create({
            data: body,
        })

        const entity = EntityFactory.createPost(created, "latest")

        return {
            ok: true,
            payload: entity,
        }
    }

    @Get()
    async findAll() {
        const posts = await this.prisma.post.findMany({
            include: {
                comments: true,
                likes: true,
            },
        })

        const entities = posts.map((post) =>
            EntityFactory.createPost(post, "latest"),
        )

        return {
            total: entities.length,
            items: entities,
        }
    }

    @Get("feed")
        async getFeed(@Query() query: FeedQueryDto) {
            const mode = query.mode || "latest"

            // ... (Tu lógica de obtención de posts y mappedPosts igual que antes) ...
            const posts = await this.prisma.post.findMany({ /* ... */ })
            const mappedPosts = posts.map((post) => { /* ... */ })

            // REEMPLAZO DEL SWITCH:
            const sortFn = feedStrategies[mode] || feedStrategies["latest"];
            const sorted = [...mappedPosts].sort(sortFn);

            return {
                mode,
                count: sorted.length,
                rows: sorted,
            }
        }

    @Get(":id/comments")
    async getComments(@Param("id", ParseIntPipe) id: number) {
        const post = await this.postsService.findById(id)
        if (!post) {
            throw new NotFoundException("Post not found")
        }

        const comments = await this.prisma.comment.findMany({
            where: { postId: id },
            orderBy: { createdAt: "desc" },
        })

        const entities = comments.map((comment) =>
            EntityFactory.createComment(comment),
        )

        return {
            total_comments: entities.length,
            comments: entities,
        }
    }

    @Post(":id/comments")
        async createComment(
            @Param("id", ParseIntPipe) id: number,
            @Body() body: CreateCommentDto,
        ) {
            const post = await this.postsService.findById(id)
            if (!post) {
                throw new NotFoundException("Post not found")
            }

            if (body.content.length < 2) {
                throw new BadRequestException("Comment too short")
            }

            // Cliente legacy: el adaptador normaliza la respuesta
            const moderation = ModerationAdapter.review(body.content)
            if (moderation.blocked) {
                throw new ForbiddenException("Comment blocked by moderation")
            }

            // Se persiste la información en la base de datos
            const created = await this.prisma.comment.create({
                data: {
                    postId: id,
                    content: body.content,
                    source: "controller",
                },
            })

            const entity = new CommentEntity(
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

            logDomainEvent("comment.created", { postId: id, commentId: created.id })
            fakeSendNotification("comment", { postId: id })
            fakeRecomputeSomething(id)

            return {
                message: "comment_created",
                entity,
            }
        }

    @Post(":id/likes")
    async addLike(
        @Param("id", ParseIntPipe) id: number,
        @Body() body: AddLikeDto,
    ) {
        const post = await this.postsService.findById(id)
        if (!post) {
            throw new NotFoundException("Post not found")
        }

        const reactionType = body.reactionType || "like"
        const weight = body.weight || 1

        if (weight < 1) {
            throw new BadRequestException("Weight must be at least 1")
        }

        const like = await this.prisma.like.create({
            data: {
                postId: id,
                reactionType,
                weight,
                source: "controller",
            },
        })

        const entity = EntityFactory.createLike(like)

        logDomainEvent("like.created", {
            postId: id,
            likeId: like.id,
        })
        fakeSendNotification("like", { postId: id, reactionType })
        fakeRecomputeSomething(id)

        return {
            success: true,
            like: entity,
        }
    }
}