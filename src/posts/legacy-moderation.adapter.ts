import { legacyModerationApi } from "@/posts/legacy-moderation.client"

export type LegacyModerationRawResult =
    | "BLOCK"
    | "OK"
    | number
    | { pass: boolean; reason: string }

export type ModerationReview = {
    blocked: boolean
    reason: string
    raw: LegacyModerationRawResult
}

export interface ModerationService {
    review(content: string): ModerationReview
}

export class LegacyModerationAdapter implements ModerationService {
    constructor(private readonly legacyClient = legacyModerationApi) {}

    review(content: string): ModerationReview {
        const raw = this.legacyClient.review(content)
        const blocked = this.isBlocked(raw)
        const reason = this.getReason(raw)

        return {
            blocked,
            reason,
            raw,
        }
    }

    private isBlocked(raw: LegacyModerationRawResult): boolean {
        if (raw === "BLOCK") {
            return true
        }

        if (typeof raw === "number") {
            return raw < 1
        }

        if (typeof raw === "object") {
            return !raw.pass
        }

        return false
    }

    private getReason(raw: LegacyModerationRawResult): string {
        if (raw === "BLOCK") {
            return "legacy-block"
        }

        if (raw === "OK") {
            return "legacy-ok"
        }

        if (typeof raw === "number") {
            return `legacy-score-${raw}`
        }

        if (typeof raw === "object") {
            return raw.reason
        }

        return "legacy-unknown"
    }
}
