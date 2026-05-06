import { IsNotEmpty, IsString, Length, Matches } from "class-validator"
import { NO_HTML_MESSAGE, NO_HTML_PATTERN } from "@/posts/dto/constants"

export class CreateCommentDto {
    @IsString()
    @IsNotEmpty()
    @Length(2, 400)
    @Matches(NO_HTML_PATTERN, { message: NO_HTML_MESSAGE })
    content!: string
}