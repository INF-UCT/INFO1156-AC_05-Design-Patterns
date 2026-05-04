export abstract class IModerationService {
    abstract review(content: string): { isBlocked: boolean; rawResult: any }
}
