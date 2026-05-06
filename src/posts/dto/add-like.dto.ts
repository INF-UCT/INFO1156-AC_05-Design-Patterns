import { IsIn, IsInt, IsOptional, IsString, Min } from "class-validator"

export class AddLikeDto {
    @IsOptional()
    @IsString()
    @IsIn(["like", "fire", "clap"])
    reactionType?: string

    @IsOptional()
    @IsInt()
    @Min(1)
    weight?: number
}