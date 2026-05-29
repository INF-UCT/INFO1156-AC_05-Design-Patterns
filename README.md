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

## Refactorización: Patrón Strategy (Módulo de Posts)

Se identificó que el endpoint `/api/posts/feed` violaba el principio **Open/Closed (OCP)** de SOLID, ya que utilizaba una estructura `switch(mode)` para ordenar las publicaciones. Añadir un nuevo tipo de ordenamiento obligaba a modificar directamente el controlador.

### Solución Aplicada
Se implementó el patrón de diseño **Strategy** junto con un **Factory** para desacoplar los algoritmos de ordenamiento del flujo del controlador:

1. **`FeedSortStrategy` (Interfaz):** Define el contrato unificado para todas las estrategias mediante el método `sort(posts)`.
2. **Estrategias Concretas (`LatestStrategy`, `MostLikedStrategy`, `MostCommentedStrategy`, `RelevanceStrategy`):** Encapsulan de forma aislada la lógica matemática y de negocio de ordenación de arrays.
3. **`FeedSortFactory` (Creador):** Centraliza el mapeo entre los strings de la query (`mode`) y sus respectivas instancias de estrategia.

### Beneficios obtenidos
- **Extensibilidad:** Para añadir un nuevo tipo de ordenamiento en el futuro, solo se debe crear una nueva clase que implemente `FeedSortStrategy` y registrarla en el Factory. El código de `PostsController` permanece intacto.
- **Mantenibilidad:** Cada algoritmo de ordenamiento se testea y modifica en su propio archivo dedicado de forma aislada.
- **Coexistencia:** Es 100% compatible con los `Builders` de entidades recientemente integrados por el equipo.

## Refactorización: Patrón Observer (Eventos de Dominio)

Se identificó que en los endpoints de mutación (`create`, `createComment`, `addLike`) del `PostsController` se repetían llamadas a efectos secundarios (side-effects) como registros de logs, envío de notificaciones y recálculo de métricas. Esto generaba código duplicado y violaba el **Principio de Responsabilidad Única (SRP)**.

### Solución Aplicada
Se implementó el patrón de diseño **Observer** mediante un bus de eventos de dominio para desacoplar las acciones principales de sus efectos secundarios:

1. **`EventBus` (Sujeto/Publicador):** Un mediador centralizado (Singleton) que permite emitir eventos y registrar suscriptores.
2. **`IEventHandler` (Interfaz):** Define el contrato estándar para cualquier observador que desee reaccionar a un evento.
3. **Handlers Concretos (`LoggingHandler`, `NotificationHandler`, `RecomputeHandler`):** Clases independientes que actúan como observadores. Cada una tiene una única responsabilidad y reacciona de forma autónoma cuando el controlador emite eventos como `post.created`, `comment.created` o `like.created`.

### Beneficios obtenidos
- **Desacoplamiento (SRP):** El controlador ahora tiene una única responsabilidad: persistir los datos y avisar que algo ocurrió (`emit`). Ya no conoce los detalles de qué sucede después.
- **Extensibilidad (OCP):** Para agregar un nuevo efecto secundario (por ejemplo, enviar un email), solo se necesita crear un nuevo handler y suscribirlo al bus de eventos, sin tocar ni una sola línea del controlador.
- **Eliminación de duplicidad (DRY):** Se centralizó la lógica de los side-effects, limpiando significativamente el código de los endpoints.