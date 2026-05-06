import { IsNotEmpty, IsString, Length, Matches, IsUrl, MaxLength } from "class-validator"
import { NO_HTML_MESSAGE, NO_HTML_PATTERN } from "@/posts/dto/constants"

export class CreatePostDto {
    @IsString()
    @IsNotEmpty()
    @Length(3, 120)
    @Matches(NO_HTML_PATTERN, { message: NO_HTML_MESSAGE })
    title!: string

    @IsString()
    @IsNotEmpty()
    @Length(10, 1000)
    @Matches(NO_HTML_PATTERN, { message: NO_HTML_MESSAGE })
    description!: string

    @IsString()
    @IsNotEmpty()
    @IsUrl({ protocols: ["http", "https"], require_protocol: true })
    @MaxLength(2048)
    @Matches(NO_HTML_PATTERN, { message: NO_HTML_MESSAGE })
    imageUrl!: string
}