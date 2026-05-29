import { Injectable } from "@nestjs/common"
import { legacyModerationApi } from "@/posts/legacy-moderation.client"
import { ContentModerator } from "@/posts/moderation/content-moderator.interface"

/**
 * Patrón Adapter: adapta el cliente legacy `legacyModerationApi` —que devuelve
 * tipos mixtos (string | number | object)— a la interfaz uniforme
 * ContentModerator. Toda la inspección de tipos queda encapsulada aquí, de modo
 * que el controller solo trabaja con un boolean y nunca conoce el formato legacy.
 */
@Injectable()
export class LegacyModerationAdapter implements ContentModerator {
    isBlocked(content: string): boolean {
        const result = legacyModerationApi.review(content)

        if (result === "BLOCK") {
            return true
        }

        if (typeof result === "number") {
            return result < 1
        }

        if (typeof result === "object") {
            return !("pass" in result && result.pass)
        }

        // "OK" o cualquier otra respuesta de texto: no se bloquea.
        return false
    }
}
