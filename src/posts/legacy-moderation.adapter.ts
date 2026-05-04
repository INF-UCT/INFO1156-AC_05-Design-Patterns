import { legacyModerationApi } from "./legacy-moderation.client"

export class LegacyModerationAdapter {
    review(content: string) {
        const rawResult = legacyModerationApi.review(content)

        let blocked = false

        if (rawResult === "BLOCK") {
            blocked = true
        } else if (typeof rawResult === "number") {
            blocked = rawResult < 1
        } else if (typeof rawResult === "object") {
            blocked = !("pass" in rawResult && rawResult.pass)
        } else if (rawResult === "OK") {
            blocked = false
        }

        return {
            isBlocked: blocked,
            rawResult: rawResult,
        }
    }
}
