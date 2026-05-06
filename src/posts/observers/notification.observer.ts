import { IPostEventObserver, PostEvent } from "@/posts/observers/interfaces/post-events.interface";

export class NotificationObserver implements IPostEventObserver {
    private static readonly notifyMap: Record<PostEvent["type"], string> = {
        "post.created":    "post",
        "comment.created": "comment",
        "like.created":    "like",
    }

    handle(event: PostEvent): void {
        const notifyType = NotificationObserver.notifyMap[event.type]
        console.log(`[notify:${notifyType}]`, event)
    }
}