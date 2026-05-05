export interface ModerationResult {
    isBlocked: boolean
    reason?: string
}

export interface ModerationProvider {
    review(content: string): ModerationResult
}
