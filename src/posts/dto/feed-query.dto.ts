import { IsIn, IsOptional, IsString } from "class-validator"

export class FeedQueryDto {
    @IsOptional()
    @IsString()
    @IsIn(["latest", "mostLiked", "mostCommented", "relevance"])
    mode?: string
}