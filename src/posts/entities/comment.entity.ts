export class CommentEntity {
    constructor(
        public id: number,
        public postId: number,
        public content: string,
        public createdAt: Date,
        public updatedAt: Date,
        public source: string,
        public moderationState: string,
        public sentimentScore: number,
        public isPinned: boolean,
        public language: string,
        public metadata: Record<string, unknown>,
    ) {}
}

export class CommentBuilder {
    private id!: number;
    private postId!: number;
    private content!: string;
    private createdAt!: Date;
    private updatedAt!: Date;
    private source!: string;
    private moderationState!: string;
    private sentimentScore!: number;
    private isPinned!: boolean;
    private language!: string;
    private metadata!: Record<string, unknown>;

    setId(id: number): this { this.id = id; return this; }
    setPostId(postId: number): this { this.postId = postId; return this; }
    setContent(content: string): this { this.content = content; return this; }
    setCreatedAt(createdAt: Date): this { this.createdAt = createdAt; return this; }
    setUpdatedAt(updatedAt: Date): this { this.updatedAt = updatedAt; return this; }
    setSource(source: string): this { this.source = source; return this; }
    setModerationState(moderationState: string): this { this.moderationState = moderationState; return this; }
    setSentimentScore(sentimentScore: number): this { this.sentimentScore = sentimentScore; return this; }
    setIsPinned(isPinned: boolean): this { this.isPinned = isPinned; return this; }
    setLanguage(language: string): this { this.language = language; return this; }
    setMetadata(metadata: Record<string, unknown>): this { this.metadata = metadata; return this; }

    build(): CommentEntity {
        if (this.id === undefined || this.postId === undefined) {
            throw new Error(
                "CommentEntity requires at least id and postId",
            )
        }
        return new CommentEntity(
            this.id,
            this.postId,
            this.content,
            this.createdAt,
            this.updatedAt,
            this.source,
            this.moderationState,
            this.sentimentScore,
            this.isPinned,
            this.language,
            this.metadata,
        );
    }
}
