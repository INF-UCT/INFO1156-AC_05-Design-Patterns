import { IEventHandler } from "@/core/events/IEventHandler"

export class RecomputeHandler implements IEventHandler {
    handle(data: any): void {
        console.log(`[recompute] postId=${data.postId}`)
    }
}
