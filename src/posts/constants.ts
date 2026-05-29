/**
 * Constantes para el módulo de posts
 */
export const RANKING_CONSTANTS = {
    // Tiempo en milisegundos (1 hora)
    HOUR_IN_MS: 3_600_000,

    // Pesos para la fórmula de relevancia
    LIKE_WEIGHT: 2,
    COMMENT_WEIGHT: 3,

    // Umbral para considerar un post como "featured"
    FEATURED_THRESHOLD: 20,

    // Validación de título
    TITLE_MIN_LENGTH: 3,
    TITLE_MAX_LENGTH: 120,
} as const

/**
 * Constantes de validación
 */
export const VALIDATION_CONSTANTS = {
    IMAGE_URL_PROTOCOLS: ["http://", "https://"],
} as const
