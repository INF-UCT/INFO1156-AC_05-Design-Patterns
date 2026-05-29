/**
 * Observer Pattern:
 * Defines a one-to-many dependency between objects so that when one object changes state,
 * all its dependents are notified and updated automatically.
 * Here it handles side-effects (logging, notifications, recomputations) decoupling them
 * from the main business flow.
 */
export interface PostEventPayload {
    eventName: string;
    postId: number;
    [key: string]: any;
}

export interface Observer {
    update(payload: PostEventPayload): void;
}

export class PostEventDispatcher {
    private observers: Observer[] = [];

    addObserver(observer: Observer) {
        this.observers.push(observer);
    }

    notify(payload: PostEventPayload) {
        for (const observer of this.observers) {
            observer.update(payload);
        }
    }
}

// Concretos
export class LoggerObserver implements Observer {
    update(payload: PostEventPayload) {
        console.log(`[event:${payload.eventName}]`, payload);
    }
}

export class NotificationObserver implements Observer {
    update(payload: PostEventPayload) {
        const typeMap: Record<string, string> = {
            "post.created": "post",
            "comment.created": "comment",
            "like.created": "like"
        };
        const type = typeMap[payload.eventName] || "unknown";
        console.log(`[notify:${type}]`, payload);
    }
}

export class RecomputeObserver implements Observer {
    update(payload: PostEventPayload) {
        console.log(`[recompute] postId=${payload.postId}`);
    }
}

// Singleton dispatcher para el módulo (En NestJS esto idealmente sería un Provider, 
// pero se hace singleton simple para no modificar los modules de manera extensa).
export const postEventDispatcher = new PostEventDispatcher();
postEventDispatcher.addObserver(new LoggerObserver());
postEventDispatcher.addObserver(new NotificationObserver());
postEventDispatcher.addObserver(new RecomputeObserver());
