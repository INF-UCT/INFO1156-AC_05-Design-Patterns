import { IEventHandler } from "@/core/events/IEventHandler"

export class NotificationHandler implements IEventHandler {
    handle(data: any): void {
        const type = data.eventName.split(".")[0]
        const payload: any = { postId: data.postId }
        if (data.reactionType) payload.reactionType = data.reactionType

        console.log(`[notify:${type}]`, payload)
    }
}
