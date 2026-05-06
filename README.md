# Feed de Publicaciones

Este proyecto implementa un feed social sencillo, sin usuarios ni autenticación, centrado en la interacción entre publicaciones, likes y comentarios. La aplicación está pensada para simular una plataforma de contenido visual con lógica de negocio realista pero acotada.

## Requerimientos

- Docker

## Resumen funcional

El sistema permite crear publicaciones con imagen, texto y descripción, y mostrarlas en un feed central. Cada publicación puede recibir likes y comentarios, y esas interacciones modifican cómo se percibe su importancia dentro del feed.

El comportamiento general del producto gira alrededor de tres ideas:

- **contenido**: las publicaciones son la unidad principal del sistema,
- **interacción**: likes y comentarios enriquecen cada publicación,
- **priorización**: el feed puede cambiar de orden según distintos criterios de relevancia.

## Lógica de negocio principal

La lógica del sistema no solo guarda datos, también construye una vista enriquecida del feed. Para cada publicación se calcula información derivada, como la cantidad de interacciones y una puntuación de relevancia que combina actividad reciente con volumen de participación.

Además, antes de persistir comentarios se aplica una validación/moderación para filtrar contenido problemático. El sistema también ejecuta efectos operativos cuando se crean interacciones (por ejemplo trazas y procesos internos de recálculo), reflejando un flujo típico de aplicaciones de contenido.

## Contexto técnico

La solución está construida con NestJS en backend, Prisma ORM y SQLite como almacenamiento local.

La base de datos es fija en `sqlite.db`

## Ejecución:

Para levantar todo el sistema con Docker:

1. `make setup`
2. `make run`

Este comando construye la imagen, instala dependencias dentro del contenedor, aplica migraciones Prisma, genera el cliente y arranca NestJS en modo watch.

En este flujo, los artefactos de compilación y cache de paquetes se mantienen dentro de volúmenes Docker para no ensuciar el directorio del proyecto.

La aplicación queda disponible en:

- `http://localhost:3000`
- `http://localhost:3000/docs`
- `http://localhost:5555` (Prisma Studio - Database Manager)

Comandos útiles:

- `make stop` para detener el contenedor
- `make logs` para ver logs en tiempo real

----

## 1. Patrón Estructural: Adapter (Adaptador)

**Implementado por:** Martin 
**Archivos:** `posts.controller.ts`, `moderation.adapter.ts` (Nuevo), `posts.module.ts`

**Problema:**
El método `createComment` en `PostsController`[cite: 2] estaba fuertemente acoplado a `legacy-moderation.client.ts`[cite: 1]. Como la API legacy devuelve tipos mixtos 
(`string`, `number` u  `object`)[cite: 1], el controlador requería un bloque `if/else` gigante para traducir la respuesta, violando el Principio de Responsabilidad Única.

**Solución:**
Se creó el servicio inyectable `ModerationAdapter` para envolver la llamada al cliente externo. Este adaptador aisla la lógica condicional y 
le expone al controlador una interfaz limpia y tipada (solo devuelve un `isBlocked: boolean` y la `metadata`).

**Beneficios:**
- **Desacoplamiento:** El controlador ya no sabe cómo funciona el sistema legacy.
- **Código Limpio:** Se eliminó la complejidad ciclomática (`if/else`) del controlador[cite: 2].
- **Mantenibilidad:** Si cambia el proveedor de moderación, solo se modifica el adaptador.

## 2. Patrón de Comportamiento: Strategy

**Implementado por:** Gerlac  
**Archivos:** `posts.controller.ts`, `posts.module.ts`, `strategies/feed-sort.strategy.ts` (Nuevo), `strategies/feed-sort.context.ts` (Nuevo)

**Problema:**  
El método `getFeed` en `PostsController` contenía un bloque `switch` con múltiples criterios de ordenamiento (`latest`, `mostLiked`, `mostCommented`, `relevance`).  
Esto generaba alto acoplamiento y hacía que el controlador concentrara demasiada lógica de negocio, dificultando agregar nuevos modos de ranking sin modificar directamente el código existente.

**Solución:**  
Se implementó el patrón de diseño **Strategy**, separando cada algoritmo de ordenamiento en estrategias independientes:

- `LatestFeedSortStrategy`
- `MostLikedFeedSortStrategy`
- `MostCommentedFeedSortStrategy`
- `RelevanceFeedSortStrategy`

Además, se creó `FeedSortContext` para delegar dinámicamente el algoritmo de ordenamiento según el modo solicitado por el feed.

**Beneficios:**
- **Menor acoplamiento:** El controlador ya no contiene lógica de ordenamiento.
- **Mayor mantenibilidad:** Cada estrategia tiene una única responsabilidad.
- **Extensibilidad:** Se pueden agregar nuevos criterios de ranking sin modificar el controlador.
- **Código más limpio:** Se eliminó el `switch` gigante dentro de `getFeed`.

## 3. Patrón de Comportamiento: Observer

**Implementado por:** Cristoper 
**Archivos:** `posts.controller.ts`, `posts.module.ts`, `observers/post-event.interface.ts` (Nuevo), `observers/post-events.emitter.ts` (Nuevo), `observers/domain-logger.observer.ts` (Nuevo), `observers/notification.observer.ts` (Nuevo), `observers/recompute.observer.ts` (Nuevo)

**Problema:**  
El controlador `PostsController` contenía tres funciones sueltas (`logDomainEvent`, `fakeSendNotification`, `fakeRecomputeSomething`) que se repetían en cada endpoint (`create`, `createComment`, `addLike`).  
Esto generaba código duplicado, alto acoplamiento y violaba el Principio de Responsabilidad Única, ya que el controlador no debería encargarse de notificaciones ni trazas internas.

**Solución:**  
Se implementó el patrón **Observer**, donde el controlador solo emite un evento a través de `PostEventsEmitter`, y cada observer reacciona de forma independiente:

- `DomainLoggerObserver` → registra el evento en consola
- `NotificationObserver` → simula el envío de notificaciones
- `RecomputeObserver` → simula el recálculo de métricas

**Beneficios:**
- **Desacoplamiento:** El controlador no sabe quién reacciona a los eventos, solo los emite.
- **Código Limpio:** Se eliminaron las funciones sueltas y el código duplicado en cada endpoint.
- **Extensibilidad:** Se pueden agregar nuevos observers sin modificar el controlador.
- **Responsabilidad Única:** Cada observer tiene una única tarea definida.


## 4. Patrón Creacional: Factory (Fábrica) y Principios SOLID

| Responsable | Patrones / Principios Aplicados | Archivos Modificados / Creados |
| :--- | :--- | :--- |
| **Martin** | **Factory** (Creacional), **SRP** (SOLID) | `posts.controller.ts`, `factories/comment.factory.ts`, `factories/post.factory.ts` |

### Resumen de la implementación

| El Problema |  La Solución |  Beneficios |
| :--- | :--- | :--- |
| El controlador (`PostsController`) instanciaba entidades directamente, mezclando lógica HTTP, reglas de negocio matemáticas y creación de objetos (Violación del SRP). | Se implementó el patrón **Factory** para encapsular la creación. Además, se separó la lógica de negocio en una clase experta (`FeedMetricsCalculator`), respetando el **Principio de Responsabilidad Única (SRP)**. | **1. Desacoplamiento:** Las reglas de negocio pueden cambiar sin afectar a la fábrica ni al controlador.<br>**2. Código Limpio:** El controlador delegó las responsabilidades y redujo su complejidad. |
