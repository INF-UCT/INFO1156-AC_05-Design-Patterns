import { Injectable, Logger } from "@nestjs/common"
import { DomainEvent, EventSubscriber } from "@/posts/domain/event-bus"

@Injectable()
export class LoggerSubscriber implements EventSubscriber {
    private readonly logger = new Logger(LoggerSubscriber.name)

    handle(event: DomainEvent): void {
        this.logger.log(`[event:${event.name}]`, JSON.stringify(event.payload))
    }
}
