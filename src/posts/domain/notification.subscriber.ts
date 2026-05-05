import { Injectable, Logger } from "@nestjs/common"
import { DomainEvent, EventSubscriber } from "@/posts/domain/event-bus"

@Injectable()
export class NotificationSubscriber implements EventSubscriber {
    private readonly logger = new Logger(NotificationSubscriber.name)

    handle(event: DomainEvent): void {
        const type = event.name.split(".")[0]
        this.logger.log(`[notify:${type}]`, JSON.stringify(event.payload))
    }
}
