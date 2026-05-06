export type PostEvent =
    | { type: "post.created";    postId: number; title: string }
    | { type: "comment.created"; postId: number; commentId: number }
    | { type: "like.created";    postId: number; likeId: number; reactionType: string }

export interface IPostEventObserver {
    handle(event: PostEvent): void
}