import { legacyModerationApi } from "@/posts/legacy-moderation.client"

export class ModerationAdapter {
    static review(content: string): { isBlocked: boolean; rawResult: any } {
        const rawResult = legacyModerationApi.review(content)
        let isBlocked = false

        if (rawResult === "BLOCK") {
            isBlocked = true
        } else if (typeof rawResult === "number") {
            isBlocked = rawResult < 1
        } else if (typeof rawResult === "object" && rawResult !== null) {
            isBlocked = !("pass" in rawResult && rawResult.pass)
        } else if (rawResult === "OK") {
            isBlocked = false
        }

        return { isBlocked, rawResult }
    }
}
