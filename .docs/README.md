# AC_05 — Design Patterns: Problemas Identificados y Soluciones

Se identificaron falencias en la arquitectura del proyecto y se resolvieron aplicando patrones de diseño de los tres tipos (Creacional, Estructural y Comportamiento) en ambas capas (frontend y backend), respetando los principios SOLID y mejorando la mantenibilidad del código.

## Integrantes y contribuciones

| Integrante | Capa | Patrones aplicados |
|---|---|---|
| **LizardoFSA** | Frontend — Lógica UI | Factory · Observer · Strategy |
| **BenjaminAliagaMardones** | Backend | Strategy · Adapter · Observer · Builder |
| **BenDLF** | Backend | Builder · Facade |
| **juan-xp** | Backend | Factory |

---

## Integrante 1 — LizardoFSA (Frontend)

Archivos: `public/index.js`, `public/store.js`, `public/post-card.factory.js`, `public/validators.js`

---

### Problema 1: Construcción imperativa de tarjetas (God Function)

**Descripción:**  
`renderFeed` concentraba más de 100 líneas construyendo el DOM de cada tarjeta de post de forma completamente inline: imagen, título, descripción, estadísticas, lista de comentarios y formulario, todo mezclado en un solo bloque. Cualquier cambio estructural requería navegar y modificar esa función gigante.

**Antes:**
```js
state.posts.forEach((post) => {
    const card = document.createElement("article")
    const image = document.createElement("img")
    image.className = "h-72 w-full object-cover bg-zinc-200"
    image.src = post.imageUrl
    // ... ~80 líneas más de construcción DOM ...
    feedElement.appendChild(card)
})
```

**Patrón aplicado: Factory (Creacional)**

`PostCardFactory` centraliza toda la construcción. Expone un único punto de entrada público (`create`) y oculta los detalles en métodos privados con `#`. `renderFeed` solo declara _qué_ renderizar; el factory decide _cómo_.

**Después:**
```js
posts.forEach((post) => {
    const card = PostCardFactory.create(post, {
        comments: commentsByPost[post.id] || [],
        onLike: handleLike,
        onComment: handleComment,
    })
    feedElement.appendChild(card)
})
```

**Diagrama:**
```
PostCardFactory
    ├── create(post, opts): HTMLElement     ← único punto de entrada público
    ├── #buildImage(post)
    ├── #buildBody(post, comments, ...)
    │       ├── #buildTitle(title)
    │       ├── #buildDescription(description)
    │       ├── #buildStats(post, onLike)
    │       └── #buildCommentsSection(postId, comments, onComment)
    │               └── #buildCommentForm(postId, onComment)
    └── (todos los métodos internos son privados con #)
```

---

### Problema 2: Estado mutable acoplado al render manual

**Descripción:**  
`state` era un objeto plano mutado directamente desde múltiples lugares. Cada función que cambiaba datos debía acordarse de llamar `renderFeed()` después. Si algún flujo lo olvidaba, la UI quedaba desactualizada de forma silenciosa.

**Antes:**
```js
const state = { posts: [], commentsByPost: {}, mode: "latest" }

state.posts = feedRows
state.commentsByPost = {}
renderFeed() // había que recordar este llamado en cada lugar
```

**Patrón aplicado: Observer (Comportamiento)**

`Store` es el Sujeto. Mantiene el estado con campos privados (`#state`, `#listeners`) y notifica a todos los Observadores en cada `setState`. `renderFeed` se suscribe una sola vez al inicio y nunca necesita ser llamada directamente.

**Después:**
```js
const store = new Store({ posts: [], commentsByPost: {}, mode: "latest" })

store.subscribe(renderFeed) // suscripción única al inicio

store.setState(() => ({ posts: feedRows, commentsByPost }))
// ↑ renderFeed se invoca automáticamente
```

**Diagrama:**
```
Store (Sujeto)
    ├── #state: { posts, commentsByPost, mode }
    ├── #listeners: Function[]
    ├── subscribe(fn) → devuelve función de desuscripción
    ├── setState(updater) → notifica #listeners
    └── getState() → copia inmutable del estado
                        ▼
                renderFeed (Observador)
                recibe el estado completo
                y reconstruye el DOM
```

---

### Problema 3: Validación inline y dispersa

**Descripción:**  
Las reglas de validación estaban incrustadas directamente en los handlers. `handleCreatePost` validaba campos y URL inline; el listener del comentario validaba el largo inline. Cada nuevo formulario implicaba duplicar el mismo patrón `if/throw`.

**Antes:**
```js
// En handleCreatePost:
if (!payload.title || !payload.description || !payload.imageUrl) {
    throw new Error("Completa todos los campos")
}
if (!isValidHttpUrl(payload.imageUrl)) {
    throw new Error("La URL de imagen debe ser valida")
}

// En el listener del comentario:
if (content.length < 2) {
    renderError("Comment too short")
    return
}
```

**Patrón aplicado: Strategy (Comportamiento)**

Cada tipo de formulario tiene su propia Estrategia con interfaz uniforme `validate(payload)`. El handler solo invoca `validate()` y la estrategia lanza el error si corresponde. Cambiar o extender reglas no toca los handlers.

**Después:**
```js
PostValidationStrategy.validate(payload)       // en handleCreatePost
CommentValidationStrategy.validate({ content }) // en handleComment
```

**Diagrama:**
```
«interfaz implícita»
ValidationStrategy
    └── validate(payload: object): void | throws Error
              │
    ┌─────────┴──────────────────────────────┐
    │                                        │
PostValidationStrategy           CommentValidationStrategy
    ├── verifica campos presentes                └── verifica largo mínimo
    └── verifica URL http/https
```

---

## Integrante 2 — BenjaminAliagaMardones (Backend)

Archivos: `src/posts/ranking/`, `src/posts/moderation/`, `src/posts/events/`, `src/posts/entities/builders/`

---

### Problema 1: Lógica de ordenamiento acoplada al controller

**Descripción:**  
El feed soporta múltiples modos de ordenamiento. Sin un patrón, cada modo nuevo implicaría un `if/else` adicional en el controller, violando el principio Open/Closed y dificultando agregar nuevos órdenes.

**Antes (hipotético sin patrón):**
```ts
if (mode === "latest") {
    posts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
} else if (mode === "mostLiked") {
    posts.sort((a, b) => b.likesCount - a.likesCount)
} else if (mode === "mostCommented") {
    // ...
}
```

**Patrón aplicado: Strategy (Comportamiento)**

`RankingStrategy` define el contrato. Cada modo es una clase independiente. `RankingService` actúa como Contexto: selecciona la estrategia por nombre y delega el ordenamiento. Agregar un nuevo modo requiere solo una clase nueva.

**Después:**
```ts
// ranking.service.ts
rank(mode: string, posts: PostEntity[]): PostEntity[] {
    const strategy = this.strategies[mode] ?? this.defaultStrategy
    return strategy.sort(posts)
}
```

**Diagrama:**
```
«interface»
RankingStrategy
    └── sort(posts: PostEntity[]): PostEntity[]
              │
    ┌─────────┼───────────────────────────┐
    │         │                           │
Latest    MostLiked  MostCommented    Relevance

                    ▲
           RankingService (Contexto)
           strategies: Record<string, RankingStrategy>
           rank(mode, posts) → delega a la estrategia
```

---

### Problema 2: Cliente legacy de moderación con tipos de retorno mixtos

**Descripción:**  
`legacyModerationApi.review()` retorna tres tipos distintos según el contenido: `"BLOCK"` / `"OK"` (string), `1` / `0` (number), o `{ pass: boolean }` (object). Cualquier consumidor de esa API debía conocer y manejar esos tres formatos, dispersando la lógica de inspección de tipos.

**Antes:**
```ts
const result = legacyModerationApi.review(content)
// result puede ser: "BLOCK" | "OK" | number | { pass: boolean, reason: string }
// el consumidor debe resolver qué significa cada tipo
```

**Patrón aplicado: Adapter (Estructural)**

`ContentModerator` define la interfaz objetivo con `isBlocked(content): boolean`. `LegacyModerationAdapter` implementa esa interfaz y encapsula toda la inspección de tipos. El resto de la aplicación solo ve un `boolean`.

**Después:**
```ts
// content-moderator.interface.ts — interfaz objetivo
export interface ContentModerator {
    isBlocked(content: string): boolean
}

// legacy-moderation.adapter.ts — Adaptador
isBlocked(content: string): boolean {
    const result = legacyModerationApi.review(content)
    if (result === "BLOCK")               return true
    if (typeof result === "number")       return result < 1
    if (typeof result === "object")       return !("pass" in result && result.pass)
    return false
}
```

**Diagrama:**
```
Controller / PostsService
    │  depende de la abstracción
    ▼
«interface»
ContentModerator
    └── isBlocked(content): boolean
              │
              │ implementa
              ▼
LegacyModerationAdapter
    └── isBlocked(content)
            └── legacyModerationApi.review(content) ← Adaptado
                    retorna: "BLOCK" | "OK" | number | { pass: boolean }
```

---

### Problema 3: Efectos secundarios duplicados en cada mutación

**Descripción:**  
En `create`, `createComment` y `addLike` del controller se repetían las mismas tres líneas: `logDomainEvent(...)`, `fakeSendNotification(...)`, `fakeRecomputeSomething(...)`. El controller conocía exactamente qué acciones secundarias debía disparar, rompiendo SRP y haciendo que cualquier cambio en los efectos requiriera tocar tres métodos.

**Antes:**
```ts
const created = await this.postsService.create(body)
logDomainEvent("post.created", { postId: created.id, title: created.title })
fakeSendNotification("post", { postId: created.id })
fakeRecomputeSomething(created.id)
// mismas 3 líneas repetidas en createComment y addLike
```

**Patrón aplicado: Observer (Comportamiento)**

`DomainEventPublisher` es el Sujeto. Mantiene una lista de `DomainEventObserver[]` y notifica a todos al publicar un evento. Cada observador (`LoggingObserver`, `NotificationObserver`, `RecomputeObserver`) reacciona de forma independiente.

**Después:**
```ts
// domain-event.publisher.ts
publish(event: DomainEvent): void {
    for (const observer of this.observers) {
        observer.handle(event)
    }
}

// En el controller:
this.publisher.publish({ name: "post.created", payload: { postId: created.id } })
```

**Diagrama:**
```
«interface»
DomainEventObserver
    └── handle(event: DomainEvent): void
              │
    ┌─────────┼──────────────┐
    │         │              │
Logging  Notification   Recompute

              ▲
   DomainEventPublisher (Sujeto)
       observers: DomainEventObserver[]
       subscribe(observer)
       publish(event) → notifica a todos
```

---

### Problema 4: Constructores posicionales con 14 parámetros

**Descripción:**  
`PostEntity`, `CommentEntity` y `LikeEntity` tenían constructores con hasta 14 parámetros posicionales. En el controller, instanciarlos producía llamadas de 14 argumentos seguidos, extremadamente ilegibles y propensas a error de orden.

**Antes:**
```ts
return new PostEntity(
    post.id, post.title, post.description, post.imageUrl,
    post.createdAt, post.updatedAt, likesCount, commentsCount,
    relevanceScore, relevanceScore > 20, "feed-controller",
    tags, metadata, mode,
)
```

**Patrón aplicado: Builder (Creacional)**

Se implementaron Builders fluidos (`PostEntityBuilder`, `CommentEntityBuilder`, `LikeEntityBuilder`) en `src/posts/entities/builders/`. Cada método setter retorna `this` para encadenamiento; `build()` construye la entidad al final.

**Después:**
```ts
return new PostEntityBuilder()
    .setId(post.id)
    .setTitle(post.title)
    .setDescription(post.description)
    .setMetrics(likesCount, commentsCount)
    .setRelevance(relevanceScore)
    .build()
```

**Diagrama:**
```
PostEntityBuilder
    ├── setId(id): this
    ├── setTitle(title): this
    ├── setDescription(description): this
    ├── setMetrics(likes, comments): this
    ├── setRelevance(score): this
    ├── ... (setters encadenables)
    └── build(): PostEntity
```

---

## Integrante 3 — BenDLF (Backend)

Archivos: `src/posts/entities/post.builder.ts`, `comment.builder.ts`, `like.builder.ts`, `src/posts/events.facade.ts`

---

### Problema 1: Refinamiento del Builder — interface fluida uniforme

**Descripción:**  
Los builders de entidades necesitaban una interfaz coherente y completamente encadenable que también fuera reutilizable desde los factories de respuesta. Se consolidó la implementación con setters de responsabilidad acotada (ej. `setTimestamps`, `setMetrics`, `setRelevance`) en lugar de setters 1:1 por campo.

**Patrón aplicado: Builder (Creacional) — refinamiento**

Los builders de `src/posts/entities/` (`PostBuilder`, `CommentBuilder`, `LikeBuilder`) agrupan setters lógicamente relacionados y son los que consume `PostEntityFactory`.

```ts
// post.builder.ts
setMetrics(likesCount: number, commentsCount: number): this {
    this.likesCount = likesCount
    this.commentsCount = commentsCount
    return this
}

setRelevance(relevanceScore: number, isFeatured: boolean): this {
    this.relevanceScore = relevanceScore
    this.isFeatured = isFeatured
    return this
}

build(): PostEntity {
    return new PostEntity(
        this.id, this.title, this.description, this.imageUrl,
        this.createdAt, this.updatedAt, this.likesCount, this.commentsCount,
        this.relevanceScore, this.isFeatured, this.source,
        this.tags, this.metadata, this.rankingMode,
    )
}
```

---

### Problema 2: Lógica transversal duplicada en las mutaciones

**Descripción:**  
Las tres operaciones de mutación (`create`, `createComment`, `addLike`) repetían exactamente las mismas llamadas a subsistemas secundarios (logging, notificaciones, recomputo). El controller tenía que conocer y coordinar esos tres subsistemas manualmente, violando SRP.

**Patrón aplicado: Facade (Estructural)**

`PostEventsFacade` encapsula los tres subsistemas detrás de una interfaz de alto nivel. El controller llama un único método por evento sin saber nada de los detalles internos.

**Antes:**
```ts
const created = await this.postsService.create(body)

logDomainEvent("post.created", { postId: created.id, title: created.title })
fakeSendNotification("post", { postId: created.id })
fakeRecomputeSomething(created.id)

return { ok: true, payload: created }
```

**Después:**
```ts
const created = await this.postsService.create(body)

this.eventsFacade.dispatchPostCreated(created.id, created.title)

return { ok: true, payload: created }
```

**Diagrama:**
```
Controller
    │
    │  llama una sola operación
    ▼
PostEventsFacade
    ├── dispatchPostCreated(id, title)
    ├── dispatchCommentCreated(postId, commentId)
    └── dispatchLikeAdded(postId, likeId, reactionType)
              │
    ┌─────────┼──────────────┐
    │         │              │
logDomain  sendNotif    recompute
  Event     ication     Something
```

---

## Integrante 4 — juan-xp (Backend)

Archivos: `src/posts/factories/`, `src/posts/posts.service.ts`, `src/posts/moderation/moderation.port.ts`

---

### Problema 1: Lógica de construcción de respuestas acoplada al controller

**Descripción:**  
El método `getFeed` del controller calculaba inline métricas derivadas (likesCount, commentsCount, relevanceScore, tags, metadata) y luego construía directamente la `PostEntity`. Toda esa lógica de transformación de datos crudos de base de datos a entidad de respuesta vivía en el controller, que debería ser solo un coordinador.

**Antes:**
```ts
// En posts.controller.ts — getFeed
const likesCount = post.likes.reduce((sum, like) => sum + like.weight, 0)
const commentsCount = post.comments.length
const hoursSinceCreated = (Date.now() - new Date(post.createdAt).getTime()) / 36_000_00
const relevanceScore = likesCount * 2 + commentsCount * 3 - Math.floor(hoursSinceCreated)
const tags = post.title.split(" ").filter((word) => word.length > 4)
const metadata = { likesWeights: [...], commentLengths: [...], hourOfCreate: ... }

return new PostBuilder().setId(post.id)... .build()
```

**Patrón aplicado: Factory (Creacional)**

`PostEntityFactory`, `CommentEntityFactory` y `LikeEntityFactory` encapsulan toda la lógica de transformación. El controller delega la construcción al factory y recibe la entidad lista.

**Después:**
```ts
// En posts.service.ts
return this.postEntityFactory.fromFeedRecord(post, mode)

// PostEntityFactory.fromFeedRecord — calcula métricas y construye con el Builder
fromFeedRecord(post: FeedPostRecord, mode: string): PostEntity {
    const likesCount = post.likes.reduce((sum, like) => sum + like.weight, 0)
    const relevanceScore = likesCount * 2 + commentsCount * 3 - Math.floor(hours)
    // ...
    return new PostBuilder()
        .setId(post.id)
        .setMetrics(likesCount, commentsCount)
        .setRelevance(relevanceScore, relevanceScore > 20)
        .build()
}
```

**Diagrama:**
```
PostsService
    │  delega construcción
    ▼
PostEntityFactory
    └── fromFeedRecord(record, mode): PostEntity
            ├── calcula likesCount, commentsCount
            ├── calcula relevanceScore, isFeatured
            ├── extrae tags y metadata
            └── usa PostBuilder para construir la entidad

CommentEntityFactory      LikeEntityFactory
    └── fromRecord(...)       └── fromRecord(...)
```

---

## Resumen general

| Patrón | Categoría | Ubicación | Integrante |
|---|---|---|---|
| **Factory** | Creacional | `PostCardFactory` — construcción de tarjetas DOM | LizardoFSA |
| **Observer** | Comportamiento | `Store` — sincronización estado → UI | LizardoFSA |
| **Strategy** | Comportamiento | `PostValidationStrategy`, `CommentValidationStrategy` | LizardoFSA |
| **Strategy** | Comportamiento | `RankingStrategy` / `RankingService` — ordenamiento del feed | BenjaminAliagaMardones |
| **Adapter** | Estructural | `LegacyModerationAdapter` — normalización cliente legacy | BenjaminAliagaMardones |
| **Observer** | Comportamiento | `DomainEventPublisher` + observers — eventos de dominio | BenjaminAliagaMardones |
| **Builder** | Creacional | `PostEntityBuilder`, `CommentEntityBuilder`, `LikeEntityBuilder` | BenjaminAliagaMardones |
| **Builder** | Creacional | `PostBuilder`, `CommentBuilder`, `LikeBuilder` — interface fluida | BenDLF |
| **Facade** | Estructural | `PostEventsFacade` — eventos transversales del controller | BenDLF |
| **Factory** | Creacional | `PostEntityFactory`, `CommentEntityFactory`, `LikeEntityFactory` | juan-xp |
