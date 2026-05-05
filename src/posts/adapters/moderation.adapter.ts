export interface ModerationResult {
    approved: boolean
    reason?: string
}

export class ModerationAdapter {
    adapt(raw: string | number | object): ModerationResult {
        if (raw === "BLOCK") {
            return { approved: false, reason: "legacy-block" }
        }

        if (raw === "OK") {
            return { approved: true }
        }

        if (typeof raw === "number") {
            return { approved: raw >= 1 }
        }

        if (typeof raw === "object" && raw !== null) {
            const obj = raw as Record<string, unknown>
            const pass = obj.pass as boolean | undefined
            return { approved: pass === true, reason: obj.reason as string }
        }

        return { approved: true }
    }
}