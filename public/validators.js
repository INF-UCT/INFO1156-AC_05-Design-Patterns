/**
 * Validation Strategies — Strategy Pattern (Behavioral)
 *
 * Problem: Validation rules were scattered inline across multiple handlers.
 * `handleCreatePost` validated post fields directly; the comment form's
 * submit listener validated comment length directly. Both shared the same
 * `isValidHttpUrl` utility but in isolation, and adding a new form meant
 * duplicating the same if/throw pattern again.
 *
 * Solution: Each form type has its own Strategy object with a uniform
 * `validate(payload)` interface. The calling code (the Context) only invokes
 * `validate()` and lets the strategy throw on failure. Swapping or extending
 * rules requires changing only the relevant strategy, not every handler.
 */

const isValidHttpUrl = (candidate) => {
    try {
        const url = new URL(candidate)
        return url.protocol === "http:" || url.protocol === "https:"
    } catch {
        return false
    }
}

export const PostValidationStrategy = {
    validate(payload) {
        if (!payload.title || !payload.description || !payload.imageUrl) {
            throw new Error("Completa todos los campos")
        }
        if (!isValidHttpUrl(payload.imageUrl)) {
            throw new Error("La URL de imagen debe ser valida")
        }
    },
}

export const CommentValidationStrategy = {
    validate(payload) {
        if (!payload.content || payload.content.length < 2) {
            throw new Error("Comment too short")
        }
    },
}
