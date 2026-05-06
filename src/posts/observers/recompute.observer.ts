import { Injectable, OnModuleInit } from "@nestjs/common"
import { PostEventsEmitter } from "./post-events.emitter"
import { IPostObserver, PostEvent } from "./post-event.interface"

@Injectable()
export class RecomputeObserver implements IPostObserver, OnModuleInit {
    constructor(private readonly emitter: PostEventsEmitter) {}

    onModuleInit() {
        this.emitter.register(this)
    }

    handle(event: PostEvent): void {
        console.log(`[recompute] postId=${event.postId}`)
    }
}
