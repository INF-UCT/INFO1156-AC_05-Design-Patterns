import { Injectable, Logger } from "@nestjs/common"
import { DomainEvent, EventSubscriber } from "@/posts/domain/event-bus"

@Injectable()
export class RecomputeSubscriber implements EventSubscriber {
    private readonly logger = new Logger(RecomputeSubscriber.name)

    handle(event: DomainEvent): void {
        const postId = event.payload.postId as number | undefined
        if (postId !== undefined) {
            this.logger.log(`[recompute] postId=${postId}`)
        }
    }
}
