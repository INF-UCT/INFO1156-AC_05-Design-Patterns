import { LikesStrategy } from "./likes.strategy";
import { CommentsStrategy } from "./comments.strategy";
import { DateStrategy } from "./date.strategy";

export function getStrategy(tipo: string) {
  switch (tipo) {
    case "likes":
      return new LikesStrategy();
    case "comments":
      return new CommentsStrategy();
    default:
      return new DateStrategy();
  }
}