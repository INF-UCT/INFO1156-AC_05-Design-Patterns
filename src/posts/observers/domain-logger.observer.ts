import { IPostEventObserver, PostEvent } from "@/posts/observers/interfaces/post-events.interface"

export class DomainEventLogger implements IPostEventObserver {
    handle(event: PostEvent): void {
        const { type, ...payload } = event
        console.log(`[event:${type}]`, payload)
    }
}