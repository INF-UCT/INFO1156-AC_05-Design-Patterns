export interface PostEvent {
    eventName: string
    postId: number
    payload: Record<string, unknown>
}

export interface IPostObserver {
    handle(event: PostEvent): void
}
