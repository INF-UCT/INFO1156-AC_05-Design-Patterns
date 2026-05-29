export interface IEventHandler<T = any> {
    handle(eventData: T): void | Promise<void>
}
