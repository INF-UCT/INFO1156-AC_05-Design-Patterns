export interface ModerationReview {
    blocked: boolean
    rawResult: unknown
}

export interface ModerationPort {
    reviewComment(content: string): ModerationReview
}

export const MODERATION_PORT = Symbol("ModerationPort")
