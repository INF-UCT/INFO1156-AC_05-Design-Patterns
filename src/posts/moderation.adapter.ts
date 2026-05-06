import { Injectable } from "@nestjs/common"
import { legacyModerationApi } from "./legacy-moderation.client"

export interface ModerationResult {
    isBlocked: boolean
    metadata: any
}

@Injectable()
export class ModerationAdapter {
    reviewContent(content: string): ModerationResult {
        // Aquí encapsulamos la lógica fea del if/else para que no ensucie el controlador
        const rawResult = legacyModerationApi.review(content)
        let blocked = false

        if (rawResult === "BLOCK") {
            blocked = true
        } else if (typeof rawResult === "number") {
            blocked = rawResult < 1
        } else if (typeof rawResult === "object" && rawResult !== null) {
            blocked = !("pass" in rawResult && (rawResult as any).pass)
        }

        return {
            isBlocked: blocked,
            metadata: rawResult,
        }
    }
}
