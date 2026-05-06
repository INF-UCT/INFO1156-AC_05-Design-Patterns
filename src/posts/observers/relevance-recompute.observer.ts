import { IPostEventObserver, PostEvent } from "@/posts/observers/interfaces/post-events.interface";

export class RelevanceRecomputeObserver implements IPostEventObserver {
    handle(event: PostEvent): void {
        console.log(`[recompute] postId=${event.postId}`)
    }
}