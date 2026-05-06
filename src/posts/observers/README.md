/**
 * PATRÓN: OBSERVER (Comportamental)
 *
 * Problema: Después de crear un post, comentario o like, el controlador
 * llama manualmente a logDomainEvent, fakeSendNotification y
 * fakeRecomputeSomething en cada acción (código duplicado, acoplado).
 *
 * Solución: PostEventEmitter actúa como Subject. Cada efecto secundario
 * (logger, notifier, recompute) es un Observer independiente que se
 * suscribe a los eventos que le interesan. El controlador solo emite
 * el evento; los observers reaccionan automáticamente.
 */