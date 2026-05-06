// Esta interfaz define que sucedió
export interface DomainEvent {
    type: string
    payload: Record<string, unknown>
}
