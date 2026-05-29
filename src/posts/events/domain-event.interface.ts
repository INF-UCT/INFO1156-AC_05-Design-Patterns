/**
 * Patrón Observer: contrato de un evento de dominio y de quien lo observa.
 *
 * El controller (Subject, vía DomainEventPublisher) publica un DomainEvent y
 * cada DomainEventObserver reacciona por su cuenta, sin que el emisor conozca
 * a los observadores ni qué hacen. Agregar una reacción nueva (ej. enviar un
 * email) es crear un observador y suscribirlo, sin tocar el controller.
 */
export interface DomainEvent {
    name: string
    payload: Record<string, unknown>
}

export interface DomainEventObserver {
    handle(event: DomainEvent): void
}
