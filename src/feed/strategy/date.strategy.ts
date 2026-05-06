import { FeedStrategy } from "./feed.strategy";

export class DateStrategy implements FeedStrategy {
  ordenar(posts: any[]) {
    return posts.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
}