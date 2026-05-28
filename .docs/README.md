# AC_05 — Design Patterns: Problemas Identificados y Soluciones

## Integrantes y división del trabajo

| Integrante | Capa | Archivos |
|---|---|---|
| Integrante 1 (Frontend) | Lógica UI | `public/index.js`, `public/store.js`, `public/post-card.factory.js`, `public/validators.js` |
| Integrante 2 (Frontend) | Capa API | `public/posts-api.js` |
| Integrante 3 (Backend) | — | `src/posts/**` |
| Integrante 4 (Backend) | — | `src/posts/**` |

---

## Frontend — Integrante 1

### Problema 1: Construcción imperativa de tarjetas (God Function)

**Descripción:**  
`renderFeed` concentraba más de 100 líneas construyendo el DOM de cada tarjeta de post de forma completamente inline. Incluía la creación de imagen, título, descripción, estadísticas, lista de comentarios y formulario de comentario, todo mezclado. Cualquier cambio estructural en una tarjeta requería navegar y modificar esa función gigante.

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

Se extrae toda la construcción al `PostCardFactory`. El factory expone un único punto de entrada público (`create`) y oculta los detalles de construcción en métodos privados. `renderFeed` solo declara _qué_ renderizar; el factory decide _cómo_.

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
    └── (todos los métodos internos son privados)
```

---

### Problema 2: Estado mutable acoplado al render manual

**Descripción:**  
`state` era un objeto plano mutado directamente desde múltiples lugares. Cada función que cambiaba datos debía acordarse de llamar `renderFeed()` después. Si se agregaba un nuevo flujo que modificara el estado sin llamar a render, la UI quedaba desactualizada de forma silenciosa.

**Antes:**
```js
const state = { posts: [], commentsByPost: {}, mode: "latest" }

state.posts = feedRows
state.commentsByPost = {}
renderFeed() // hay que acordarse de este llamado en cada lugar
```

**Patrón aplicado: Observer (Comportamiento)**

`Store` es el Sujeto. Mantiene el estado y notifica a los Observadores suscritos automáticamente en cada `setState`. `renderFeed` se suscribe una sola vez al inicio; después nunca necesita ser llamada directamente.

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
    ├── subscribe(fn)
    ├── setState(updater)
    │       └── notifica #listeners
    └── getState()
                        ▼
                renderFeed (Observador)
                recibe el estado completo
                y reconstruye el DOM
```

---

### Problema 3: Validación inline y dispersa

**Descripción:**  
Las reglas de validación estaban incrustadas directamente en los handlers. `handleCreatePost` validaba campos inline y el listener del comentario validaba el largo inline. Agregar un tercer formulario implicaba duplicar el mismo patrón.

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

Cada tipo de formulario tiene su propia Estrategia con interfaz uniforme `validate(payload)`. El handler solo invoca `validate()` y la estrategia lanza el error si corresponde.

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
    ┌─────────┴──────────────────────────┐
    │                                    │
PostValidationStrategy       CommentValidationStrategy
    ├── verifica campos presentes            └── verifica largo mínimo
    └── verifica URL http/https
```

---

## Frontend — Integrante 2

> _Pendiente de completar por el integrante 2._

---

## Backend — Integrante 3

> _Pendiente de completar por el integrante 3._

---

## Backend — Integrante 4

> _Pendiente de completar por el integrante 4._

---

## Resumen general

| Patrón | Categoría | Ubicación | Integrante | Estado |
|---|---|---|---|---|
| **Factory** | Creacional | `PostCardFactory` — construcción de tarjetas DOM | 1 | ✅ |
| **Observer** | Comportamiento | `Store` — sincronización estado → UI | 1 | ✅ |
| **Strategy** | Comportamiento | `PostValidationStrategy`, `CommentValidationStrategy` | 1 | ✅ |
| — | — | — | 2 | 🔲 |
| — | — | — | 3 | 🔲 |
| — | — | — | 4 | 🔲 |
