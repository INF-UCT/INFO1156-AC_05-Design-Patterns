import { LegacyModerationAdapter } from "@/posts/legacy-moderation.adapter"

describe("LegacyModerationAdapter", () => {
    const adapter = new LegacyModerationAdapter()

    it("blocks legacy spam results", () => {
        const result = adapter.review("esto es spam")

        expect(result.blocked).toBe(true)
        expect(result.reason).toBe("legacy-block")
        expect(result.raw).toBe("BLOCK")
    })

    it("accepts normal content with OK result", () => {
        const result = adapter.review("abcd")

        expect(result.blocked).toBe(false)
        expect(result.reason).toBe("legacy-ok")
        expect(result.raw).toBe("OK")
    })

    it("accepts legacy numeric review values above threshold", () => {
        const result = adapter.review("12345")

        expect(result.blocked).toBe(false)
        expect(result.reason).toBe("legacy-score-1")
        expect(result.raw).toBe(1)
    })
})
