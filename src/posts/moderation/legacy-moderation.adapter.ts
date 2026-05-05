import { Injectable } from "@nestjs/common"
import { legacyModerationApi } from "@/posts/legacy-moderation.client"
import {
    ModerationProvider,
    ModerationResult,
} from "@/posts/moderation/moderation.provider"

@Injectable()
export class LegacyModerationAdapter implements ModerationProvider {
    review(content: string): ModerationResult {
        const raw = legacyModerationApi.review(content)

        if (raw === "BLOCK") {
            return { isBlocked: true, reason: "legacy-block" }
        }

        if (raw === "OK") {
            return { isBlocked: false }
        }

        if (typeof raw === "number") {
            return { isBlocked: raw < 1, reason: "legacy-score" }
        }

        if (typeof raw === "object" && "pass" in raw) {
            return { isBlocked: !raw.pass, reason: raw.reason }
        }

        return { isBlocked: false }
    }
}
