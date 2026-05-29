import { Injectable } from "@nestjs/common"
import { legacyModerationApi } from "@/posts/legacy-moderation.client"

export interface ModerationResult {
    blocked: boolean
    reason: string
}

export interface ModerationAdapter {
    review(content: string): ModerationResult
}

@Injectable()
export class LegacyModerationAdapter implements ModerationAdapter {
    review(content: string): ModerationResult {
        const raw = legacyModerationApi.review(content)

        if (raw === "BLOCK") {
            return { blocked: true, reason: "blocked-by-legacy" }
        }

        if (typeof raw === "number") {
            return {
                blocked: raw < 1,
                reason: raw < 1 ? "numeric-rejection" : "numeric-approval",
            }
        }

        if (typeof raw === "object" && raw !== null) {
            const passed = "pass" in raw && raw.pass === true
            return {
                blocked: !passed,
                reason: passed
                    ? (raw as { reason?: string }).reason ?? "object-approval"
                    : "object-rejection",
            }
        }

        // raw === "OK" or any other truthy string
        return { blocked: false, reason: "ok" }
    }
}
