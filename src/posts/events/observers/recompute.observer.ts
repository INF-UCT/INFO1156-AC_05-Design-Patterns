import { Injectable } from "@nestjs/common"
import {
    DomainEvent,
    DomainEventObserver,
} from "@/posts/events/domain-event.interface"

/** Observador que dispara el recálculo asociado a un post. */
@Injectable()
export class RecomputeObserver implements DomainEventObserver {
    handle(event: DomainEvent): void {
        const postId = event.payload.postId
        if (postId !== undefined) {
            console.log(`[recompute] postId=${postId}`)
        }
    }
}
