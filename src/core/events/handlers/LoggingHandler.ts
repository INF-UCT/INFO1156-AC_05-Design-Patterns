import { IEventHandler } from "@/core/events/IEventHandler"

export class LoggingHandler implements IEventHandler {
    handle(data: any): void {
        const payload: any = { postId: data.postId }
        if (data.title) payload.title = data.title
        if (data.commentId) payload.commentId = data.commentId
        if (data.likeId) payload.likeId = data.likeId

        console.log(`[event:${data.eventName}]`, payload)
    }
}
