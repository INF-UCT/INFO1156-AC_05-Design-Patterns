import {
    Body,
    Controller,
    Get,
    Param,
    ParseIntPipe,
    Post,
    Query,
} from "@nestjs/common"
import { PostsService } from "@/posts/posts.service"
import {
    AddLikeDto,
    CreateCommentDto,
    CreatePostDto,
    FeedQueryDto,
} from "@/posts/posts.dtos"

/**
 * Controller Layer (Service Layer Pattern / N-Tier Architecture):
 * By moving business logic to the PostsService, the controller is solely responsible
 * for handling incoming HTTP requests, extracting payloads, and sending responses.
 * This satisfies the Single Responsibility Principle (SRP).
 */
@Controller("api/posts")
export class PostsController {
    constructor(private readonly postsService: PostsService) {}

    @Post()
    async create(@Body() body: CreatePostDto) {
        const created = await this.postsService.create(body)

        return {
            ok: true,
            payload: created,
        }
    }

    @Get()
    async findAll() {
        const posts = await this.postsService.findAll()
        return {
            total: posts.length,
            items: posts,
        }
    }

    @Get("feed")
    async getFeed(@Query() query: FeedQueryDto) {
        return this.postsService.getFeed(query)
    }

    @Get(":id/comments")
    async getComments(@Param("id", ParseIntPipe) id: number) {
        return this.postsService.getCommentsByPostId(id)
    }

    @Post(":id/comments")
    async createComment(
        @Param("id", ParseIntPipe) id: number,
        @Body() body: CreateCommentDto,
    ) {
        return this.postsService.createComment(id, body)
    }

    @Post(":id/likes")
    async addLike(
        @Param("id", ParseIntPipe) id: number,
        @Body() body: AddLikeDto,
    ) {
        return this.postsService.addLike(id, body)
    }
}
