/**
 * Patrón Adapter: interfaz objetivo (Target) que el resto de la aplicación
 * consume. Abstrae cualquier servicio de moderación tras una respuesta simple
 * y uniforme (un boolean), sin exponer los detalles del proveedor concreto.
 */
export interface ContentModerator {
    isBlocked(content: string): boolean
}

/** Token de inyección para depender de la abstracción y no de la implementación. */
export const CONTENT_MODERATOR = Symbol("ContentModerator")
