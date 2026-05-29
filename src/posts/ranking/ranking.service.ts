import { Injectable } from "@nestjs/common"
import { PostEntity } from "@/posts/entities/post.entity"
import { IRankingStrategy } from "@/posts/ranking/ranking.interface"
import { HotStrategy } from "@/posts/ranking/strategies/hot.strategy"
import { LatestStrategy } from "@/posts/ranking/strategies/latest.strategy"
import { MostLikedStrategy } from "@/posts/ranking/strategies/most-liked.strategy"
import { MostCommentedStrategy } from "@/posts/ranking/strategies/most-commented.strategy"

/**
 * Servicio de ranking que selecciona la estrategia apropiada
 * y aplica el ordenamiento a los posts.
 *
 * Este es un ejemplo del patrón Strategy.
 */
@Injectable()
export class RankingService {
    private strategies: Map<string, IRankingStrategy> = new Map()

    constructor() {
        // Registrar estrategias disponibles
        this.strategies.set("hot", new HotStrategy())
        this.strategies.set("relevance", new HotStrategy())
        this.strategies.set("latest", new LatestStrategy())
        this.strategies.set("mostLiked", new MostLikedStrategy())
        this.strategies.set("mostCommented", new MostCommentedStrategy())
    }

    /**
     * Aplica la estrategia de ranking especificada
     * @param posts - Posts a rankear
     * @param mode - Modo de ranking (hot, relevance, latest, mostLiked, mostCommented)
     * @returns Posts ordenados según la estrategia
     */
    rank(posts: PostEntity[], mode: string = "latest"): PostEntity[] {
        const strategy = this.strategies.get(mode)

        if (!strategy) {
            console.warn(
                `Modo de ranking desconocido: ${mode}. Usando 'latest'`,
            )
            return this.strategies.get("latest")!.rank(posts)
        }

        return strategy.rank(posts)
    }

    /**
     * Obtiene todos los modos de ranking disponibles
     */
    getAvailableModes(): string[] {
        return Array.from(this.strategies.keys())
    }
}
