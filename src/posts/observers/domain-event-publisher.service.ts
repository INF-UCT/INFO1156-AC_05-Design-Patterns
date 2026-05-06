import { Injectable, OnModuleInit } from "@nestjs/common";
import { EventObserver } from "./event-observer.interface";
import { DomainEvent } from "../events/domain-event.interface";
import { LoggerObserver } from "./logger.observer";
import { NotificationObserver } from "./notification.observer";
import { RecomputeObserver } from "./recompute.observer";

// Este es el coordinador, almacena todos los observadores posibles
@Injectable() // Permite usarla de manera externa
export class DomainEventPublisher implements OnModuleInit {

    private observers: EventObserver[] = []

    constructor(
        private readonly loggerObserver: LoggerObserver,
        private readonly notificationObserver: NotificationObserver,
        private readonly recomputeObserver: RecomputeObserver,
    ) {}

    onModuleInit() {
        this.observers.push(this.loggerObserver)
        this.observers.push(this.notificationObserver)
        this.observers.push(this.recomputeObserver)
    }


    publish(event: DomainEvent): void {
        for (const observer of this.observers) {
            observer.update(event)
        }
    }
}
