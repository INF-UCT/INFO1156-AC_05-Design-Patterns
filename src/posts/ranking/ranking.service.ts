import { Injectable } from "@nestjs/common"
import { PostEntity } from "@/posts/entities/post.entity"
import { RankingStrategy } from "@/posts/ranking/ranking-strategy.interface"
import { LatestRankingStrategy } from "@/posts/ranking/strategies/latest-ranking.strategy"
import { MostCommentedRankingStrategy } from "@/posts/ranking/strategies/most-commented-ranking.strategy"
import { MostLikedRankingStrategy } from "@/posts/ranking/strategies/most-liked-ranking.strategy"
import { RelevanceRankingStrategy } from "@/posts/ranking/strategies/relevance-ranking.strategy"

/**
 * Contexto del patrón Strategy: mantiene el registro de estrategias de ranking
 * y delega el ordenamiento en la que corresponda al modo solicitado.
 *
 * Para agregar un nuevo modo basta con crear una estrategia que implemente
 * RankingStrategy y registrarla aquí; el controller no cambia.
 */
@Injectable()
export class RankingService {
    private readonly strategies: Record<string, RankingStrategy> = {
        latest: new LatestRankingStrategy(),
        mostLiked: new MostLikedRankingStrategy(),
        mostCommented: new MostCommentedRankingStrategy(),
        relevance: new RelevanceRankingStrategy(),
    }

    private readonly defaultStrategy: RankingStrategy = this.strategies.latest

    rank(mode: string, posts: PostEntity[]): PostEntity[] {
        const strategy = this.strategies[mode] ?? this.defaultStrategy
        return strategy.sort(posts)
    }
}
