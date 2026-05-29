import { Injectable } from "@nestjs/common"
import { legacyModerationApi } from "@/posts/legacy-moderation.client"

/**
 * Resultado normalizado de la API de moderación
 */
export interface IModerationResult {
    action: "allow" | "block" | "review"
    score?: number
    reason?: string
}

/**
 * Adapter para normalizar la interfaz del cliente legacy de moderación.
 * Convierte respuestas inconsistentes en un contrato consistente.
 *
 * Este es un ejemplo del patrón Adapter (Wrapper).
 */
@Injectable()
export class ModerationAdapter {
    /**
     * Moderación de contenido de texto
     * @param text - Texto a moderar
     * @returns Resultado normalizado
     */
    async moderate(text: string): Promise<IModerationResult> {
        try {
            // El cliente legacy usa el método 'review'
            const legacyResult = await Promise.resolve(
                legacyModerationApi.review(text),
            )

            // Normalizar respuesta legacy que devuelve tipos inconsistentes
            return this.normalizeLegacyResponse(legacyResult)
        } catch (error) {
            console.error("Error en moderación:", error)
            // Fallback: permitir pero marcar como review
            return {
                action: "review",
                reason: "Error en el servicio de moderación",
            }
        }
    }

    /**
     * Normaliza las respuestas inconsistentes del cliente legacy
     * Legacy API puede devolver: strings, objetos, números
     */
    private normalizeLegacyResponse(legacyResult: any): IModerationResult {
        // Si es un string
        if (typeof legacyResult === "string") {
            const lower = legacyResult.toLowerCase()
            if (lower === "spam" || lower === "block" || lower === "blocked") {
                return {
                    action: "block",
                    reason: `Contenido bloqueado: ${legacyResult}`,
                }
            }
            if (lower === "review" || lower === "flagged") {
                return {
                    action: "review",
                    reason: `Requiere revisión: ${legacyResult}`,
                }
            }
            return { action: "allow" }
        }

        // Si es un objeto
        if (typeof legacyResult === "object" && legacyResult !== null) {
            const score = legacyResult.score ?? legacyResult.spam_score ?? 0
            const status = legacyResult.status ?? legacyResult.action ?? "ok"

            if (score > 0.7 || status === "blocked") {
                return {
                    action: "block",
                    score,
                    reason: legacyResult.reason,
                }
            }
            if (score > 0.4 || status === "review") {
                return {
                    action: "review",
                    score,
                    reason: legacyResult.reason,
                }
            }
            return { action: "allow", score }
        }

        // Si es un número
        if (typeof legacyResult === "number") {
            if (legacyResult > 0.7) {
                return { action: "block", score: legacyResult }
            }
            if (legacyResult > 0.4) {
                return { action: "review", score: legacyResult }
            }
            return { action: "allow", score: legacyResult }
        }

        // Fallback
        return { action: "allow" }
    }

    /**
     * Moderación de comentarios
     * @param commentText - Texto del comentario
     * @returns Resultado normalizado
     */
    async moderateComment(commentText: string): Promise<IModerationResult> {
        return this.moderate(commentText)
    }
}
