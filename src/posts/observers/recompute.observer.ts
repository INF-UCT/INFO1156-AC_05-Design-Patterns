import { Injectable } from "@nestjs/common"
import { EventObserver } from "@/posts/observers/event-observer.interface"
import { DomainEvent } from "@/posts/events/domain-event.interface"

@Injectable()
export class RecomputeObserver implements EventObserver {
    update(event: DomainEvent): void {
        if (event.payload.postId) {
            console.log(`[recompute] postId=${event.payload.postId}`)
        }
    }
}
