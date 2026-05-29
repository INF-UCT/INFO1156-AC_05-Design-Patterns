import { Injectable } from "@nestjs/common"
import { AddLikeDto, CreateCommentDto, CreatePostDto } from "@/posts/posts.dtos"
import { PostsRepository } from "@/posts/posts.repository"

@Injectable()
export class PostsService {
    constructor(private readonly postsRepository: PostsRepository) {}

    create(data: CreatePostDto) {
        return this.postsRepository.createPost(data)
    }

    findAll() {
        return this.postsRepository.findAllPosts()
    }

    findById(id: number) {
        return this.postsRepository.findPostById(id)
    }

    findFeedPosts() {
        return this.postsRepository.findFeedPosts()
    }

    findCommentsByPostId(postId: number) {
        return this.postsRepository.findCommentsByPostId(postId)
    }

    createComment(postId: number, data: CreateCommentDto) {
        return this.postsRepository.createComment(postId, data)
    }

    addLike(postId: number, data: AddLikeDto) {
        return this.postsRepository.createLike(postId, data)
    }
}