import { Injectable } from "@nestjs/common"
import {
    DomainEvent,
    DomainEventObserver,
} from "@/posts/events/domain-event.interface"

/** Observador que registra una traza del evento de dominio. */
@Injectable()
export class LoggingObserver implements DomainEventObserver {
    handle(event: DomainEvent): void {
        console.log(`[event:${event.name}]`, event.payload)
    }
}
