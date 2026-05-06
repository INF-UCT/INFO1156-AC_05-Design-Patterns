export class LikeEntity {
    constructor(
        public id: number,
        public postId: number,
        public reactionType: string,
        public weight: number,
        public source: string,
        public createdAt: Date,
        public strengthLabel: string,
        public shouldAffectRelevanceScore: boolean,
        public metadata: Record<string, unknown>,
    ) {}
}

export class LikeBuilder {
    private id!: number;
    private postId!: number;
    private reactionType!: string;
    private weight!: number;
    private source!: string;
    private createdAt!: Date;
    private strengthLabel!: string;
    private shouldAffectRelevanceScore!: boolean;
    private metadata!: Record<string, unknown>;

    setId(id: number): this { this.id = id; return this; }
    setPostId(postId: number): this { this.postId = postId; return this; }
    setReactionType(reactionType: string): this { this.reactionType = reactionType; return this; }
    setWeight(weight: number): this { this.weight = weight; return this; }
    setSource(source: string): this { this.source = source; return this; }
    setCreatedAt(createdAt: Date): this { this.createdAt = createdAt; return this; }
    setStrengthLabel(strengthLabel: string): this { this.strengthLabel = strengthLabel; return this; }
    setShouldAffectRelevanceScore(shouldAffectRelevanceScore: boolean): this { this.shouldAffectRelevanceScore = shouldAffectRelevanceScore; return this; }
    setMetadata(metadata: Record<string, unknown>): this { this.metadata = metadata; return this; }

    build(): LikeEntity {
        if (this.id === undefined || this.postId === undefined) {
            throw new Error("LikeEntity requires at least id and postId")
        }
        return new LikeEntity(
            this.id,
            this.postId,
            this.reactionType,
            this.weight,
            this.source,
            this.createdAt,
            this.strengthLabel,
            this.shouldAffectRelevanceScore,
            this.metadata,
        );
    }
}
