import { Injectable } from "@nestjs/common"
import {
    DomainEvent,
    DomainEventObserver,
} from "@/posts/events/domain-event.interface"

/** Observador que dispara una notificación a partir del evento de dominio. */
@Injectable()
export class NotificationObserver implements DomainEventObserver {
    handle(event: DomainEvent): void {
        console.log(`[notify:${event.name}]`, event.payload)
    }
}
