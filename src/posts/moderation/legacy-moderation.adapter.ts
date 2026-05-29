import { Injectable } from "@nestjs/common"
import { legacyModerationApi } from "@/posts/legacy-moderation.client"
import { ModerationService } from "@/posts/moderation/moderation.interface"

/**
 * Adapter que traduce la interfaz incompatible de `legacyModerationApi`
 * (retorna string | number | object) a la interfaz uniforme `ModerationService`.
 *
 * De esta forma el controller solo invoca `isBlocked(content)` sin necesidad
 * de conocer los detalles del cliente legacy.
 */
@Injectable()
export class LegacyModerationAdapter implements ModerationService {
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

        // result === "OK"
        return false
    }
}
