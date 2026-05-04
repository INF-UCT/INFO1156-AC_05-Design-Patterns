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

Con esto, `PostsController` queda menos acoplado a las reglas de ranking. Si en
el futuro se agrega un nuevo modo de feed, se puede crear una nueva estrategia y
registrarla en el modulo sin reescribir la logica del endpoint.