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

-----------------------------------------------------------------------------------------------------------

## Adapter para API de moderación heredada (legacy)

### Problema identificado

El metodo `createComment` del controlador usaba directamente una API antigua de moderacion (`legacyModerationApi`). El problema era que esta API devolvia respuestas inconsistentes (a veces un *string*, a veces un *número*, a veces un *objeto*). Esto ensucia el controlador, llenandolo de condicionales (`if/else`) para intentar adivinar si el comentario era válido o no.

### Patron aplicado

Se aplico el patron **Adapter**, que corresponde a un patron de tipo **estructural**.

Se creo la clase `ModerationAdapter` que implementa una interfaz moderna y clara (`IModerationService`). Esta clase envuelve al cliente legacy y traduce sus respuestas raras a un resultado booleano directo (`true` si el contenido es aprobado, `false` si es bloqueado).

```ts
export interface IModerationService {
    review(content: string): boolean;
}

@Injectable()
export class ModerationAdapter implements IModerationService {
    review(content: string): boolean {
        const moderation = legacyModerationApi.review(content);
        // ... Logica de parseo que devuelve true o false
    }
}
```

### Resultado

El controlador ahora solo depende del adaptador, quedando el código mucho mas limpio y facil de mantener:

```ts
const isApproved = this.moderationAdapter.review(body.content);

if (!isApproved) {
    throw new BadRequestException("Comment blocked by moderation");
}
```
De esta forma, en caso de que a futuro cambien la lógica o servicio de la moderación heredada, solo se tendrá que modificar el `ModerationAdapter` y el controlador no se verá afectado.


