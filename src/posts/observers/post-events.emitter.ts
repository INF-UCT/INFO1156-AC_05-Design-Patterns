import { Injectable } from "@nestjs/common"
import { IPostObserver, PostEvent } from "./post-event.interface"

@Injectable()
export class PostEventsEmitter {
    private observers: IPostObserver[] = []

    register(observer: IPostObserver): void {
        this.observers.push(observer)
    }

    emit(event: PostEvent): void {
        for (const observer of this.observers) {
            observer.handle(event)
        }
    }
}
