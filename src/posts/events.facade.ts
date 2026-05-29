import { Injectable } from "@nestjs/common"

@Injectable()
export class PostEventsFacade {
    private logDomainEvent(eventName: string, payload: Record<string, unknown>) {
        console.log(`[event:${eventName}]`, payload)
    }

    private fakeSendNotification(type: string, payload: Record<string, unknown>) {
        console.log(`[notify:${type}]`, payload)
    }

    private fakeRecomputeSomething(postId: number) {
        console.log(`[recompute] postId=${postId}`)
    }

    dispatchPostCreated(postId: number, title: string) {
        this.logDomainEvent("post.created", { postId, title })
        this.fakeSendNotification("post", { postId })
        this.fakeRecomputeSomething(postId)
    }

    dispatchCommentCreated(postId: number, commentId: number) {
        this.logDomainEvent("comment.created", { postId, commentId })
        this.fakeSendNotification("comment", { postId })
        this.fakeRecomputeSomething(postId)
    }

    dispatchLikeAdded(postId: number, likeId: number, reactionType: string) {
        this.logDomainEvent("like.created", { postId, likeId })
        this.fakeSendNotification("like", { postId, reactionType })
        this.fakeRecomputeSomething(postId)
    }
}
