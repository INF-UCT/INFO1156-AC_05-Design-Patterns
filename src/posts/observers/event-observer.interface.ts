// Define quien escucha, obligando que cada extensión
// implemente la capacidad de actualizarse
import { DomainEvent } from "../events/domain-event.interface";

export interface EventObserver {
    update(event: DomainEvent): void;
}
