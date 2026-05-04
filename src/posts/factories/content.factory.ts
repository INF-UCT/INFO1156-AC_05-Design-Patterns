import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { AddLikeDto, CreateCommentDto, CreatePostDto } from "../posts.dtos";

export abstract class ContentFactory {
    abstract createPost(data: CreatePostDto): Promise<any>;
    abstract createComment(postId: number, data: CreateCommentDto): Promise<any>;
    abstract createLike(postId: number, data: AddLikeDto): Promise<any>;
}

@Injectable()
export class PrismaContentFactory extends ContentFactory {
    constructor(private readonly prisma: PrismaService) {
        super();
    }

    createPost(data: CreatePostDto) {
        return this.prisma.post.create({ data });
    }

    createComment(postId: number, data: CreateCommentDto) {
        return this.prisma.comment.create({
            data: {
                postId,
                content: data.content,
                source: "service",
            },
        });
    }

    createLike(postId: number, data: AddLikeDto) {
        return this.prisma.like.create({
            data: {
                postId,
                reactionType: data.reactionType || "like",
                weight: data.weight || 1,
                source: "service",
            },
        });
    }
}
