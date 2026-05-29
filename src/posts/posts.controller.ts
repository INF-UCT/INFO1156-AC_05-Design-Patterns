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
    getFeed(@Query() query: FeedQueryDto) {
        const mode = query.mode || "latest"

        return this.postsService.getFeed(mode)
    }

    @Get(":id/comments")
    async getComments(@Param("id", ParseIntPipe) id: number) {
        const comments = await this.postsService.getComments(id)

        return {
            total_comments: comments.length,
            comments,
        }
    }

    @Post(":id/comments")
    async createComment(
        @Param("id", ParseIntPipe) id: number,
        @Body() body: CreateCommentDto,
    ) {
        const entity = await this.postsService.createComment(id, body)

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
        const like = await this.postsService.addLike(id, body)

        return {
            success: true,
            like,
        }
    }
}
