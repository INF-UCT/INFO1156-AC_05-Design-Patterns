/**
 * PATRÓN: ADAPTER (Estructural)
 *
 * Problema: legacyModerationApi.review() devuelve tipos inconsistentes:
 *   - "BLOCK" | "OK"  (string)
 *   - 1               (number)
 *   - { pass: true, reason: string } (object)
 *
 * Solución: ModerationAdapter normaliza cualquier respuesta legacy a una
 * interfaz uniforme { allowed: boolean, reason: string }.
 * El controlador ya no necesita manejar múltiples tipos.
 */

import { legacyModerationApi } from "@/posts/legacy-moderation.client"
import { ModerationResult } from "@/posts/adapters/interfaces/moderation-result.interface"

export class ModerationAdapter {
    review(content: string): ModerationResult {
        const raw = legacyModerationApi.review(content)

        if (raw === "BLOCK") {
            return { allowed: false, reason: "blocked-by-legacy" }
        }

        if (raw === "OK") {
            return { allowed: true, reason: "ok" }
        }

        if (typeof raw === "number") {
            return {
                allowed: raw >= 1,
                reason: raw >= 1 ? "numeric-pass" : "numeric-block",
            }
        }

        if (typeof raw === "object" && "pass" in raw) {
            return {
                allowed: raw.pass === true,
                reason: raw.reason ?? "legacy-object",
            }
        }

        return { allowed: false, reason: "unknown-response" }
    }
}
