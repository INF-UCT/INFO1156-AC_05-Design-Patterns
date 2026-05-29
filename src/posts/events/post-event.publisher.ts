import { Injectable } from "@nestjs/common"

export type PostDomainEventName =
    | "post.created"
    | "comment.created"
    | "like.created"

export type PostDomainEvent = {
    name: PostDomainEventName
    payload: Record<string, unknown>
}

export interface PostDomainEventObserver {
    handle(event: PostDomainEvent): void
}

@Injectable()
export class DomainEventLogger implements PostDomainEventObserver {
    handle(event: PostDomainEvent): void {
        console.log(`[event:${event.name}]`, event.payload)
    }
}

@Injectable()
export class NotificationObserver implements PostDomainEventObserver {
    handle(event: PostDomainEvent): void {
        const notificationType = event.name.split(".")[0]

        console.log(`[notify:${notificationType}]`, event.payload)
    }
}

@Injectable()
export class RelevanceRecomputeObserver implements PostDomainEventObserver {
    handle(event: PostDomainEvent): void {
        const postId = event.payload.postId

        if (typeof postId === "number") {
            console.log(`[recompute] postId=${postId}`)
        }
    }
}

@Injectable()
export class PostEventPublisher {
    private readonly observers: PostDomainEventObserver[]

    constructor(
        logger: DomainEventLogger,
        notification: NotificationObserver,
        recompute: RelevanceRecomputeObserver,
    ) {
        this.observers = [logger, notification, recompute]
    }

    publish(
        name: PostDomainEventName,
        payload: Record<string, unknown>,
    ): void {
        const event: PostDomainEvent = { name, payload }

        this.observers.forEach((observer) => observer.handle(event))
    }
}