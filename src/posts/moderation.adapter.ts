import { legacyModerationApi } from "./legacy-moderation.client";

/**
 * Adapter Pattern:
 * Adapts the legacy moderation API, which returns varying and inconsistent types
 * (string, number, object), into a clean and predictable boolean interface (`isBlocked`).
 * This protects the core business logic from the legacy API's implementation details.
 * (SOLID: Dependency Inversion / Single Responsibility Principle).
 */
export class ModerationAdapter {
    static isBlocked(content: string): boolean {
        const moderation = legacyModerationApi.review(content);

        if (moderation === "BLOCK") {
            return true;
        } else if (typeof moderation === "number") {
            return moderation < 1;
        } else if (typeof moderation === "object" && moderation !== null) {
            return !("pass" in moderation && moderation.pass);
        } else if (moderation === "OK") {
            return false;
        }
        
        return true; // Predeterminado a bloqueado si el formato es desconocido
    }

    static getRawModeration(content: string) {
        return legacyModerationApi.review(content);
    }
}
