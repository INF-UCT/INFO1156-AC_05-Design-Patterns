import { Injectable } from "@nestjs/common"
import {
    DomainObserver,
    LoggingObserver,
    NotificationObserver,
    RecomputeObserver,
} from "./domain-event.observer"

@Injectable()
export class EventBusService {
    private observers: DomainObserver[] = []

    constructor() {
        this.observers.push(
            new LoggingObserver(),
            new NotificationObserver(),
            new RecomputeObserver(),
        )
    }

    subscribe(observer: DomainObserver): void {
        this.observers.push(observer)
    }

    publish(event: string, data: Record<string, unknown>): void {
        this.observers.forEach((obs) => obs.onEvent(event, data))
    }
}