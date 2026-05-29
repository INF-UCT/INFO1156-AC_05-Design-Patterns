import { IEventHandler } from "@/core/events/IEventHandler"

export class EventBus {
    private static instance: EventBus
    private handlers: Map<string, IEventHandler[]> = new Map()

    private constructor() {}

    public static getInstance(): EventBus {
        if (!EventBus.instance) {
            EventBus.instance = new EventBus()
        }
        return EventBus.instance
    }

    public subscribe(eventName: string, handler: IEventHandler): void {
        const currentHandlers = this.handlers.get(eventName) || []
        currentHandlers.push(handler)
        this.handlers.set(eventName, currentHandlers)
    }

    public emit(eventName: string, data: any): void {
        const eventHandlers = this.handlers.get(eventName)
        if (eventHandlers) {
            // Lo hacemos síncrono para evitar problemas con los tests de Jest
            eventHandlers.forEach((handler) => {
                handler.handle(data)
            })
        }
    }
}
