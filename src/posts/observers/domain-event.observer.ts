export interface DomainObserver {
    onEvent(event: string, data: Record<string, unknown>): void
}

export class LoggingObserver implements DomainObserver {
    onEvent(event: string, data: Record<string, unknown>): void {
        console.log(`[event:${event}]`, data)
    }
}

export class NotificationObserver implements DomainObserver {
    onEvent(event: string, data: Record<string, unknown>): void {
        console.log(`[notify:${event}]`, data)
    }
}

export class RecomputeObserver implements DomainObserver {
    onEvent(event: string, data: Record<string, unknown>): void {
        const postId = data.postId
        if (postId) {
            console.log(`[recompute] postId=${postId}`)
        }
    }
}