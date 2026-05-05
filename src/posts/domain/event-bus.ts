export interface DomainEvent {
    name: string
    payload: Record<string, unknown>
    timestamp: Date
}

export interface EventSubscriber {
    handle(event: DomainEvent): void
}

export class EventBus {
    private subscribers = new Map<string, EventSubscriber[]>()

    subscribe(eventName: string, subscriber: EventSubscriber): void {
        const list = this.subscribers.get(eventName) || []
        list.push(subscriber)
        this.subscribers.set(eventName, list)
    }

    publish(event: DomainEvent): void {
        const list = this.subscribers.get(event.name) || []
        for (const subscriber of list) {
            subscriber.handle(event)
        }
    }
}
