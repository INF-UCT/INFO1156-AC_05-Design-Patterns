import { FeedStrategy } from "./feed.strategy";

export class CommentsStrategy implements FeedStrategy {
  ordenar(posts: any[]) {
    return posts.sort((a, b) => b.comments - a.comments);
  }
}