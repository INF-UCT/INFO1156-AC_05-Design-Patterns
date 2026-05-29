# Patrones de Diseño Aplicados en la API

En esta actividad, se han identificado falencias en la arquitectura de la lógica de servidor y se han resuelto aplicando distintos Patrones de Diseño, cumpliendo con los tres tipos (Creacional, Estructural y de Comportamiento) para mejorar la calidad del código, hacerlo más mantenible y respetar principios SOLID.

## Patrones Preexistentes

El código original ya incluía dos patrones implementados:

1. **Strategy (Comportamiento):** Implementado en `RankingService` (`src/posts/ranking/ranking.service.ts`) para separar la lógica de algoritmos de ordenamiento (Latest, Top, Controversial). De este modo, la API delega el cómo ordenar el Feed sin llenar el controlador con condicionales pesados.
2. **Adapter (Estructural):** Implementado en la integración con el servicio externo `LegacyModerationAdapter` (`src/posts/moderation/legacy-moderation.adapter.ts`). Este patrón unificaba las distintas interfaces que un sistema antiguo pudiese tener detrás de un puerto limpio `ContentModerator`.

A pesar de contar con estos patrones, identificamos problemas graves en el `PostsController`. A continuación, se detallan los problemas y las soluciones implementadas mediante la inserción de nuevos patrones.

---

## 1. Problema: Constructores Telescópicos (Code Smell)

**Falla identificada:**
Las entidades devueltas en la API como `PostEntity`, `CommentEntity` y `LikeEntity` poseían constructores gigantescos (ej: `PostEntity` tenía 14 parámetros posicionales). Esto producía un "Telescoping Constructor" anti-pattern dentro de los métodos del controlador (por ejemplo en `getFeed`), resultando en código altamente ilegible, propenso a errores al inyectar valores en el orden equivocado, y forzando al controlador a conocer los detalles íntimos de construcción de cada entidad.

### Solución: Patrón Builder (Creacional)
Se implementaron constructores fluídos utilizando el patrón **Builder** para encapsular y simplificar el proceso de construcción de las entidades paso a paso. 

**Clases creadas:**
- `PostBuilder` (`src/posts/entities/post.builder.ts`)
- `CommentBuilder` (`src/posts/entities/comment.builder.ts`)
- `LikeBuilder` (`src/posts/entities/like.builder.ts`)

**Ejemplo de refactorización en `PostsController`:**

*Antes (Constructor Telescópico):*
```typescript
return new PostEntity(
    post.id,
    post.title,
    post.description,
    post.imageUrl,
    post.createdAt,
    post.updatedAt,
    likesCount,
    commentsCount,
    relevanceScore,
    relevanceScore > 20,
    "feed-controller",
    tags,
    metadata,
    mode,
)
```

*Después (Builder):*
```typescript
return new PostBuilder()
    .setId(post.id)
    .setTitle(post.title)
    .setDescription(post.description)
    .setImageUrl(post.imageUrl)
    .setTimestamps(post.createdAt, post.updatedAt)
    .setMetrics(likesCount, commentsCount)
    .setRelevance(relevanceScore, relevanceScore > 20)
    .setSourceInfo("feed-controller")
    .setTags(tags)
    .setMetadata(metadata)
    .setRankingMode(mode)
    .build()
```

---

## 2. Problema: Acoplamiento de Funcionalidades Transversales

**Falla identificada:**
Dentro de los métodos `create`, `createComment`, y `addLike` del `PostsController`, existía un fuerte acoplamiento a lógicas externas (Domain Events, Notificaciones y Re-cálculos de índices). 
Se repetían líneas idénticas en todas las funciones:
```typescript
logDomainEvent("...", { ... })
fakeSendNotification("...", { ... })
fakeRecomputeSomething(...)
```
El controlador rompía el principio de Responsabilidad Única (SRP), sabiendo exactamente qué eventos y acciones accesorias debían dispararse tras cada mutación de datos.

### Solución: Patrón Facade (Estructural) / Observer
Se encapsuló toda esta lógica de eventos transversales detrás de una única **Facade**.

**Clase creada:**
- `PostEventsFacade` (`src/posts/events.facade.ts`)

La Facade abstrae los múltiples subsistemas de notificaciones y eventos de dominio y provee una interfaz simplificada para el controlador. Ahora el controlador delega completamente estas operaciones.

**Ejemplo de refactorización:**

*Antes:*
```typescript
const created = await this.postsService.create(body)

logDomainEvent("post.created", { postId: created.id, title: created.title })
fakeSendNotification("post", { postId: created.id })
fakeRecomputeSomething(created.id)

return { ok: true, payload: created }
```

*Después:*
```typescript
const created = await this.postsService.create(body)

this.eventsFacade.dispatchPostCreated(created.id, created.title)

return { ok: true, payload: created }
```

---

## Conclusión

Mediante la implementación de estos patrones, logramos:
1. **Completar los 3 tipos de patrones** vistos en clase (Creacional: Builder, Estructural: Adapter/Facade, Comportamiento: Strategy).
2. **Reducir significativamente la carga del `PostsController`**, convirtiéndolo en un mediador limpio que coordina los servicios y builders.
3. Mejorar la extensibilidad (agregar nuevos campos a una entidad ahora es más fácil con el Builder).
4. Proveer un sistema aislado y cohesivo para manejar acciones asincrónicas secundarias a través de la Facade.
