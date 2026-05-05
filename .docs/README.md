# Patrones de Diseño Aplicados

## Problemas Identificados

### 1. God Controller (Violación SRP)
El `PostsController` tenía 325 líneas y manejaba:
- Validación de datos (duplicada con los DTOs)
- Lógica de negocio (moderación, cálculo de scores)
- Creación de entidades con lógica derivada
- Efectos secundarios (logging, notificaciones, recomputación)
- Lógica de ranking del feed inline

### 2. Código Duplicado
- La construcción de entidades (`PostEntity`, `CommentEntity`, `LikeEntity`) se repetía en cada endpoint del controller con lógica de cálculo inline.
- Las funciones `logDomainEvent`, `fakeSendNotification`, `fakeRecomputeSomething` estaban como funciones sueltas en el controller.

### 3. Acoplamiento Fuerte
- El controller accedía directamente a `PrismaService` bypassando el service layer en varios endpoints.
- La lógica de moderación legacy retornaba tipos inconsistentes (`string | number | object`) que requerían múltiples `if/else` en el controller.

### 4. Violación OCP
- El `switch` de modos del feed requería modificar el controller para agregar nuevos modos de ordenamiento.

### 5. Violación DIP
- El controller dependía de implementaciones concretas (`PrismaService`, `legacyModerationApi`) en lugar de abstracciones.

---

## Patrones Aplicados

### Patrones Creacionales

#### Builder Pattern
**Archivos:** `post-entity.builder.ts`, `comment-entity.builder.ts`, `like-entity.builder.ts`

**Problema:** La creación de entidades con 10+ parámetros era propensa a errores y se duplicaba en múltiples lugares del controller.

**Solución:** Se implementó el patrón Builder para cada entidad, permitiendo construcción fluida y legible:

```typescript
return new PostEntityBuilder()
    .withId(post.id)
    .withTitle(post.title)
    .withLikesCount(likesCount)
    .withRelevanceScore(relevanceScore)
    .build()
```

#### Factory Pattern
**Archivo:** `entity.factory.ts`

**Problema:** La lógica para calcular campos derivados (likesCount, relevanceScore, tags, etc.) estaba dispersa en el controller.

**Solución:** Se centralizó toda la lógica de creación de entidades con sus campos calculados en una fábrica:

```typescript
createPostEntity(post, mode): PostEntity {
    const likesCount = post.likes.reduce((sum, l) => sum + l.weight, 0)
    const relevanceScore = likesCount * 2 + commentsCount * 3 - hoursSinceCreated
    return new PostEntityBuilder()
        .withId(post.id)
        .withLikesCount(likesCount)
        .withRelevanceScore(relevanceScore)
        .build()
}
```

---

### Patrones Estructurales

#### Adapter Pattern
**Archivos:** `moderation.provider.ts`, `legacy-moderation.adapter.ts`, `moderation.token.ts`

**Problema:** El `legacyModerationApi` retornaba tipos inconsistentes:
```typescript
// Antes en el controller:
if (moderation === "BLOCK") { blocked = true }
else if (typeof moderation === "number") { blocked = moderation < 1 }
else if (typeof moderation === "object") { blocked = !("pass" in moderation) }
```

**Solución:** Se creó una interfaz `ModerationProvider` con retorno consistente y un adapter que encapsula la lógica legacy:

```typescript
interface ModerationProvider {
    review(content: string): ModerationResult // { isBlocked: boolean; reason?: string }
}

class LegacyModerationAdapter implements ModerationProvider {
    review(content: string): ModerationResult {
        const raw = legacyModerationApi.review(content)
        // Normaliza todos los tipos de retorno a ModerationResult
    }
}
```

#### Facade Pattern
**Archivo:** `feed.service.ts`

**Problema:** El endpoint `/feed` tenía toda la lógica de fetch, mapeo de entidades, cálculo de scores y sorting inline en el controller (~90 líneas).

**Solución:** Se creó un `FeedService` que encapsula toda la complejidad del feed:

```typescript
class FeedService {
    async getFeed(query: FeedQueryDto) {
        const posts = await this.prisma.post.findMany({ include: { comments: true, likes: true } })
        const mappedPosts = posts.map(post => this.entityFactory.createPostEntity(post, mode))
        const strategy = this.feedSortContext.resolve(mode)
        const sorted = strategy.sort(mappedPosts)
        return { mode, count: sorted.length, rows: sorted }
    }
}
```

---

### Patrones de Comportamiento

#### Strategy Pattern
**Archivos:** `feed-sort.strategy.ts`, `latest-sort.strategy.ts`, `most-liked-sort.strategy.ts`, `most-commented-sort.strategy.ts`, `relevance-sort.strategy.ts`, `feed-sort.context.ts`

**Problema:** El `switch` statement en el controller para los modos de sorting violaba OCP - cada nuevo modo requería modificar el controller.

**Solución:** Cada modo de sorting es ahora una estrategia independiente:

```typescript
interface FeedSortStrategy {
    sort(posts: PostEntity[]): PostEntity[]
}

class MostLikedSortStrategy implements FeedSortStrategy {
    sort(posts: PostEntity[]): PostEntity[] {
        return [...posts].sort((a, b) => b.likesCount - a.likesCount)
    }
}

// Contexto que resuelve la estrategia por modo
class FeedSortContext {
    resolve(mode: string): FeedSortStrategy {
        const Strategy = STRATEGY_MAP[mode] || LatestSortStrategy
        return new Strategy()
    }
}
```

**Agregar un nuevo modo ahora solo requiere:**
1. Crear una nueva clase que implemente `FeedSortStrategy`
2. Registrarla en `STRATEGY_MAP`

#### Observer Pattern
**Archivos:** `event-bus.ts`, `logger.subscriber.ts`, `notification.subscriber.ts`, `recompute.subscriber.ts`

**Problema:** Las llamadas a `logDomainEvent`, `fakeSendNotification`, `fakeRecomputeSomething` estaban hardcodeadas en el controller después de cada operación:

```typescript
// Antes en el controller:
logDomainEvent("post.created", { postId: created.id, title: created.title })
fakeSendNotification("post", { postId: created.id })
fakeRecomputeSomething(created.id)
```

**Solución:** Se implementó un EventBus con suscriptores:

```typescript
class EventBus {
    subscribe(eventName: string, subscriber: EventSubscriber): void
    publish(event: DomainEvent): void
}

// En el service:
this.eventBus.publish({
    name: "post.created",
    payload: { postId: created.id, title: created.title },
    timestamp: new Date(),
})
```

Los subscribers (`LoggerSubscriber`, `NotificationSubscriber`, `RecomputeSubscriber`) se registran en el `PostsModule.onModuleInit()`.

---

## Principios SOLID Aplicados

| Principio | Antes | Después |
|-----------|-------|---------|
| **SRP** | Controller de 325 líneas con todas las responsabilidades | Controller delgado, services especializados, subscribers separados |
| **OCP** | Switch para sorting que requería modificación | Nuevas estrategias sin modificar código existente |
| **LSP** | N/A | Todas las estrategias son intercambiables |
| **ISP** | Controller con interfaces implícitas complejas | Interfaces específicas (`ModerationProvider`, `FeedSortStrategy`, `EventSubscriber`) |
| **DIP** | Dependencia directa de Prisma y API legacy | Inyección de abstracciones (`ModerationProvider`, `EventBus`) |

---

## Arquitectura Limpia

### Capas del Servidor

```
src/posts/
├── controller/          (Capa de presentación)
│   └── posts.controller.ts     - Solo routing y respuesta HTTP
├── service/             (Capa de aplicación)
│   ├── posts.service.ts        - Orquestación de casos de uso
│   └── feed.service.ts         - Facade para operaciones de feed
├── domain/              (Reglas de negocio)
│   ├── event-bus.ts            - Observer pattern
│   ├── logger.subscriber.ts
│   ├── notification.subscriber.ts
│   └── recompute.subscriber.ts
├── entities/            (Objetos de dominio)
│   ├── post.entity.ts
│   ├── comment.entity.ts
│   ├── like.entity.ts
│   ├── post-entity.builder.ts   - Builder pattern
│   ├── comment-entity.builder.ts
│   ├── like-entity.builder.ts
│   └── entity.factory.ts        - Factory pattern
├── feed/                (Estrategias de sorting)
│   ├── feed-sort.strategy.ts
│   ├── latest-sort.strategy.ts
│   ├── most-liked-sort.strategy.ts
│   ├── most-commented-sort.strategy.ts
│   ├── relevance-sort.strategy.ts
│   └── feed-sort.context.ts     - Strategy context
├── moderation/          (Adaptadores)
│   ├── moderation.provider.ts   - Interfaz
│   ├── legacy-moderation.adapter.ts
│   └── moderation.token.ts
└── posts.dtos.ts        - DTOs de validación
```

---

## Diagrama de Clases (Resumido)

```
┌─────────────────────────┐
│    PostsController      │
│  - postsService         │──────┐
│  - feedService          │      │
└─────────────────────────┘      │
                                 │ usa
                                 ▼
┌─────────────────────────┐   ┌─────────────────────────┐
│     PostsService        │   │     FeedService         │
│  - prisma               │   │  - prisma               │
│  - eventBus             │   │  - entityFactory        │
│  - moderationProvider   │   │  - feedSortContext      │
│  - entityFactory        │   └─────────────────────────┘
└─────────────────────────┘
           │                           │
           │ usa                       │ usa
           ▼                           ▼
┌──────────────────────┐    ┌──────────────────────────┐
│     EventBus         │    │    FeedSortContext       │
│  + subscribe()       │    │  + resolve(mode)         │──► FeedSortStrategy
│  + publish()         │    └──────────────────────────┘
└──────────────────────┘
           │
           │ notifica a
           ▼
┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
│ LoggerSubscriber     │  │ NotificationSub.     │  │ RecomputeSubscriber  │
│ (EventSubscriber)    │  │ (EventSubscriber)    │  │ (EventSubscriber)    │
└──────────────────────┘  └──────────────────────┘  └──────────────────────┘

┌─────────────────────────┐    ┌─────────────────────────┐
│  EntityFactory          │    │ LegacyModerationAdapter │
│  + createPostEntity()   │    │ (ModerationProvider)    │
│  + createCommentEntity()│    │  + review()             │
│  + createLikeEntity()   │    └─────────────────────────┘
└─────────────────────────┘
           │
           │ usa
           ▼
┌─────────────────────────┐
│   PostEntityBuilder     │
│   CommentEntityBuilder  │
│   LikeEntityBuilder     │
└─────────────────────────┘
```
