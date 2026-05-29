# Refactorizacion de patrones de diseno

Este documento describe la arquitectura aplicada en el modulo `posts` despues de la refactorizacion. La idea central es mantener el controlador delgado y mover la logica de negocio a servicios, adaptadores, factories y estrategias especializadas.

## Flujo principal

- [PostsController](../src/posts/posts.controller.ts) recibe las solicitudes HTTP y delega en `PostsService`.
- [PostsService](../src/posts/posts.service.ts) orquesta la logica de negocio: validacion, persistencia, moderacion, factories, ranking y eventos.
- Prisma queda encapsulado en el service como mecanismo de persistencia.

## Patrones aplicados

### Service Layer

Archivo principal: [posts.service.ts](../src/posts/posts.service.ts)

El controller ya no calcula rankings, no instancia entidades, no llama a Prisma directamente y no ejecuta efectos secundarios. Esa responsabilidad queda centralizada en `PostsService`, lo que reduce acoplamiento y deja los endpoints como una capa HTTP simple.

### Factory

Archivos:

- [post.factory.ts](../src/posts/factories/post.factory.ts)
- [comment.factory.ts](../src/posts/factories/comment.factory.ts)
- [like.factory.ts](../src/posts/factories/like.factory.ts)

Las factories crean entidades enriquecidas a partir de datos crudos de Prisma. `PostFactory` calcula campos derivados como `likesCount`, `commentsCount`, `relevanceScore`, `isFeatured`, `tags` y `metadata`. `CommentFactory` y `LikeFactory` concentran el mapeo de comentarios y reacciones.

Nota tecnica: la implementacion usa factories estaticas simples. Para este caso es suficiente y evita agregar herencia innecesaria.

### Adapter

Archivo principal: [adapters/moderation.adapter.ts](../src/posts/adapters/moderation.adapter.ts)

`ModerationAdapter` envuelve el cliente legacy [legacy-moderation.client.ts](../src/posts/legacy-moderation.client.ts), que retorna formatos inconsistentes. El adapter normaliza esas respuestas a un contrato estable:

```ts
{
    action: "allow" | "block" | "review",
    score?: number,
    reason?: string,
}
```

El resto de la aplicacion no depende de strings, numeros u objetos legacy; solo consume el resultado normalizado.

### Strategy

Archivos:

- [ranking.service.ts](../src/posts/ranking/ranking.service.ts)
- [ranking.interface.ts](../src/posts/ranking/ranking.interface.ts)
- [strategies](../src/posts/ranking/strategies)

El ranking del feed se resuelve con estrategias intercambiables. `RankingService` selecciona la estrategia segun el modo recibido:

- `latest`
- `mostLiked`
- `mostCommented`
- `hot`
- `relevance`

Esto permite agregar nuevos criterios de ordenamiento sin modificar el controller ni mezclar switches dentro del flujo principal.

### Observer

Archivo principal: [post-events.observer.ts](../src/posts/post-events.observer.ts)

Los efectos secundarios al crear posts, comentarios o likes se disparan mediante `postEventDispatcher`. Actualmente hay observadores para logging, notificaciones simuladas y recomputo. Esto evita que el service tenga que conocer los detalles de cada efecto.

## Problemas corregidos

- Se elimino logica duplicada entre controller y service.
- Se removieron implementaciones paralelas de Adapter y Strategy.
- El controller quedo alineado con Service Layer.
- La creacion de entities quedo centralizada en factories.
- El ranking del feed usa un unico `RankingService`.
- La moderacion usa un unico `ModerationAdapter` inyectado por NestJS.
- Los eventos de dominio usan un unico dispatcher Observer.

## Estado esperado

La arquitectura final queda con una sola fuente oficial por responsabilidad:

- HTTP: `PostsController`
- Orquestacion de negocio: `PostsService`
- Creacion de entities: `factories/*`
- Moderacion legacy: `adapters/moderation.adapter.ts`
- Ranking: `ranking/*`
- Eventos: `post-events.observer.ts`
