import { ModerationAdapter } from "@/posts/adapters/moderation.adapter"

describe("ModerationAdapter", () => {
    const adapter = new ModerationAdapter()

    it("blocks legacy spam results", async () => {
        const result = await adapter.moderate("esto es spam")

        expect(result.action).toBe("block")
        expect(result.reason).toBe("Contenido bloqueado: BLOCK")
    })

    it("accepts normal content with OK result", async () => {
        const result = await adapter.moderate("abcd")

        expect(result.action).toBe("allow")
    })

    it("marks legacy numeric review values above threshold as blocked", async () => {
        const result = await adapter.moderate("12345")

        expect(result.action).toBe("block")
        expect(result.score).toBe(1)
    })
})
