# Actividad 05 - Patrones de Diseño

## Strategy para ranking del feed

### Problema identificado

El endpoint `GET /api/posts/feed` tenia la logica de ordenamiento directamente
en el controlador mediante un `switch`. Esto hacia que `PostsController`
conociera todos los modos de ranking disponibles:

- `latest`
- `mostLiked`
- `mostCommented`
- `relevance`

El problema de este diseño es que cada nuevo criterio de ordenamiento obligaba
a modificar el controlador, mezclando responsabilidades de capa HTTP con reglas
de negocio del feed.

### Patron aplicado

Se aplico el patron **Strategy**, de tipo comportamiento. Cada modo de ranking
se encapsulo en una clase con una misma interfaz:

```ts
export interface FeedRankingStrategy {
    readonly mode: FeedRankingMode
    sort(posts: PostEntity[]): PostEntity[]
}
```

Las estrategias implementadas son:

- `LatestFeedRankingStrategy`
- `MostLikedFeedRankingStrategy`
- `MostCommentedFeedRankingStrategy`
- `RelevanceFeedRankingStrategy`

Ademas, se agrego `FeedRankingStrategyResolver`, responsable de seleccionar la
estrategia correspondiente segun el modo solicitado.

### Resultado

El controlador ya no contiene el `switch` de ordenamiento. Ahora delega esa
decision al resolver de estrategias:

```ts
const sorted =
    this.feedRankingStrategyResolver.resolve(mode).sort(mappedPosts)
```

## Abstract Factory para Creación de Contenido

### Problema identificado

El servicio principal de posts (`PostsService`) estaba creando las diferentes entidades, que conforman el contenido de las publicaciones (posts, comentarios y likes), interactuando directamente con el ORM de persistencia (`PrismaService`). Esto acoplaba al servicio con la implementación de base de datos y dificultaba extender el comportamiento a futuro.

### Patron aplicado

Se aplicó el patron **Abstract Factory** (patrón creacional), bajo la máxima simplicidad para facilitar la lectura. Se generó una familia de creación en `src/posts/factories/content.factory.ts`:

- Una clase abstracta `ContentFactory` (define el contrato de creación).
- Una implementación concreta `PrismaContentFactory` (contiene la lógica usando Prima).

### Resultado

Se inyecta la fábrica abstracta en el `PostsService` reemplazando los llamados directos y centralizando la lógica de creación sin modificar el exterior:

```ts
create(data: CreatePostDto) {
    return this.contentFactory.createPost(data)
}
```

Con esto, `PostsController` queda menos acoplado a las reglas de ranking. Si en
el futuro se agrega un nuevo modo de feed, se puede crear una nueva estrategia y
registrarla en el modulo sin reescribir la logica del endpoint.-