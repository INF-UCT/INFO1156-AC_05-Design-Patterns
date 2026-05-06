// Esta interfaz define que sucedió contiene la información necesaria
// para que los observadores reaccionen a un cambio de estado.
export interface DomainEvent {
    type: string
    payload: Record<string, unknown>
}
