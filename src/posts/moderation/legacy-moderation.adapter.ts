import { Injectable } from "@nestjs/common"
import { legacyModerationApi } from "@/posts/legacy-moderation.client"
import {
    ModerationPort,
    ModerationReview,
} from "@/posts/moderation/moderation.port"

/**
 * Patron Adapter: adapta el cliente legacy `legacyModerationApi`, que devuelve
 * tipos mixtos, a una respuesta estable para el resto de la aplicacion.
 */
@Injectable()
export class LegacyModerationAdapter implements ModerationPort {
    reviewComment(content: string): ModerationReview {
        const rawResult = legacyModerationApi.review(content)

        return {
            blocked: this.isBlocked(rawResult),
            rawResult,
        }
    }

    private isBlocked(result: unknown): boolean {
        if (result === "BLOCK") {
            return true
        }

        if (typeof result === "object") {
            const objectResult = result as { pass?: unknown } | null

            return objectResult?.pass !== true
        }

        if (typeof result === "number") {
            return result < 1
        }

        return false
    }
}
