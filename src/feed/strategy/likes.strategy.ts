import { FeedStrategy } from "./feed.strategy";

export class LikesStrategy implements FeedStrategy {
  ordenar(posts: any[]) {
    return posts.sort((a, b) => b.likes - a.likes);
  }
}