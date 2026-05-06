import { IPostEventObserver, PostEvent } from "@/posts/observers/interfaces/post-events.interface";

export class PostEventEmitter {
    private observers: IPostEventObserver[] = []

    subscribe(observer: IPostEventObserver): void {
        this.observers.push(observer)
    }

    emit(event: PostEvent): void {
        for (const observer of this.observers) {
            observer.handle(event)
        }
    }
}