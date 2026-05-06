import { Injectable } from "@nestjs/common"
import { EventObserver } from "@/posts/observers/event-observer.interface"
import { DomainEvent } from "@/posts/events/domain-event.interface"

@Injectable()
export class NotificationObserver implements EventObserver {
    update(event: DomainEvent): void {
        console.log(`[notify:${event.type}]`, event.payload)
    }
}
