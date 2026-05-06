import { legacyModerationApi } from "@/posts/legacy-moderation.client"

export type ModerationResult = {
    blocked: boolean
    raw: string | number | Record<string, unknown>
    normalized: "OK" | "BLOCK" | "LEGACY"
}

export class ModerationAdapter {
    static review(content: string): ModerationResult {
        const raw = legacyModerationApi.review(content)

        const blocked =
            raw === "BLOCK" ||
            (typeof raw === "number" && raw < 1) ||
            (typeof raw === "object" &&
                (!("pass" in raw) || !(raw as { pass?: unknown }).pass))

        const normalized =
            raw === "OK"
                ? "OK"
                : raw === "BLOCK"
                ? "BLOCK"
                : "LEGACY"

        return {
            blocked,
            raw,
            normalized,
        }
    }
}
