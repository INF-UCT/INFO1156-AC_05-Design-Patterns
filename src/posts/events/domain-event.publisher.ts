import { Injectable } from "@nestjs/common"
import {
    DomainEvent,
    DomainEventObserver,
} from "@/posts/events/domain-event.interface"
import { LoggingObserver } from "@/posts/events/observers/logging.observer"
import { NotificationObserver } from "@/posts/events/observers/notification.observer"
import { RecomputeObserver } from "@/posts/events/observers/recompute.observer"

/**
 * Patrón Observer: el Subject. Mantiene la lista de observadores suscritos y, al
 * publicar un evento, notifica a todos. Los observadores por defecto se suscriben
 * en el constructor, pero `subscribe` permite agregar más en caliente o en tests.
 */
@Injectable()
export class DomainEventPublisher {
    private readonly observers: DomainEventObserver[] = []

    constructor(
        logging: LoggingObserver,
        notification: NotificationObserver,
        recompute: RecomputeObserver,
    ) {
        this.subscribe(logging)
        this.subscribe(notification)
        this.subscribe(recompute)
    }

    subscribe(observer: DomainEventObserver): void {
        this.observers.push(observer)
    }

    publish(event: DomainEvent): void {
        for (const observer of this.observers) {
            observer.handle(event)
        }
    }
}
