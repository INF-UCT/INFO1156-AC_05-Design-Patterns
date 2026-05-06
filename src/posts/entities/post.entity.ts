export class PostEntity {
    // Entidad de salida enriquecida para feed (incluye campos derivados y metadata).
    constructor(
        public id: number,
        public title: string,
        public description: string,
        public imageUrl: string,
        public createdAt: Date,
        public updatedAt: Date,
        public likesCount: number,
        public commentsCount: number,
        public relevanceScore: number,
        public isFeatured: boolean,
        public source: string,
        public tags: string[],
        public metadata: Record<string, unknown>,
        public rankingMode: string,
    ) {}
}

export class PostBuilder {
    private id!: number;
    private title!: string;
    private description!: string;
    private imageUrl!: string;
    private createdAt!: Date;
    private updatedAt!: Date;
    private likesCount!: number;
    private commentsCount!: number;
    private relevanceScore!: number;
    private isFeatured!: boolean;
    private source!: string;
    private tags!: string[];
    private metadata!: Record<string, unknown>;
    private rankingMode!: string;

    setId(id: number): this { this.id = id; return this; }
    setTitle(title: string): this { this.title = title; return this; }
    setDescription(description: string): this { this.description = description; return this; }
    setImageUrl(imageUrl: string): this { this.imageUrl = imageUrl; return this; }
    setCreatedAt(createdAt: Date): this { this.createdAt = createdAt; return this; }
    setUpdatedAt(updatedAt: Date): this { this.updatedAt = updatedAt; return this; }
    setLikesCount(likesCount: number): this { this.likesCount = likesCount; return this; }
    setCommentsCount(commentsCount: number): this { this.commentsCount = commentsCount; return this; }
    setRelevanceScore(relevanceScore: number): this { this.relevanceScore = relevanceScore; return this; }
    setIsFeatured(isFeatured: boolean): this { this.isFeatured = isFeatured; return this; }
    setSource(source: string): this { this.source = source; return this; }
    setTags(tags: string[]): this { this.tags = tags; return this; }
    setMetadata(metadata: Record<string, unknown>): this { this.metadata = metadata; return this; }
    setRankingMode(rankingMode: string): this { this.rankingMode = rankingMode; return this; }

    build(): PostEntity {
        if (this.id === undefined || !this.title) {
            throw new Error("PostEntity requires at least id and title")
        }
        
        return new PostEntity(
            this.id,
            this.title,
            this.description,
            this.imageUrl,
            this.createdAt,
            this.updatedAt,
            this.likesCount,
            this.commentsCount,
            this.relevanceScore,
            this.isFeatured,
            this.source,
            this.tags,
            this.metadata,
            this.rankingMode,
        );
    }
}
