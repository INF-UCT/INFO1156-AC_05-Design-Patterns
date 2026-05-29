# Análisis de estructura y recomendaciones de diseño

Este documento resume problemas estructurales detectados en el código y propone patrones de diseño (creacional, estructural y de comportamiento) para mejorar mantenibilidad, testabilidad y extensibilidad.

**Resumen rápido:** el módulo `posts` contiene lógica de negocio mezclada en controladores, acoplamiento directo a un cliente de moderación legacy con tipos inconsistentes, y cálculo de ranking embebido. Recomendaciones: extraer responsabilidades al `service`, introducir adaptadores y estrategias, y usar fábricas para creación de entidades.

**Archivos clave analizados:**
- [src/posts/posts.controller.ts](src/posts/posts.controller.ts#L1-L999)
- [src/posts/posts.service.ts](src/posts/posts.service.ts#L1-L999)
- [src/posts/legacy-moderation.client.ts](src/posts/legacy-moderation.client.ts#L1-L999)
- [src/posts/posts.dtos.ts](src/posts/posts.dtos.ts#L1-L999)
- [src/posts/entities](src/posts/entities)

**Problemas estructurales identificados**
- **Controlador con responsabilidades múltiples:** `getFeed`, `createComment`, y endpoints relacionados combinan: acceso a BD, enriquecimiento de datos, ranking, validación adicional y llamadas a APIs externas. Ver [getFeed](src/posts/posts.controller.ts#L84-L170).
- **Acoplamiento a cliente legacy de moderación:** `legacy-moderation.client.ts` devuelve tipos inconsistentes (strings, objetos, números). El controlador maneja la lógica de normalización. Ver [createComment](src/posts/posts.controller.ts#L217-L232) y [legacy-moderation.client.ts](src/posts/legacy-moderation.client.ts#L1-L999).
- **Lógica de ranking y pipeline inline:** la fórmula de relevancia y el switch de ordenación están embebidos en el controlador, dificultando pruebas y extensiones. Ver [cálculo de relevancia](src/posts/posts.controller.ts#L112-L118).
- **Entities con lógica de negocio:** las entidades mezclan datos crudos y reglas derivadas (p. ej. `relevanceScore`, `strengthLabel`) en vez de ser DTOs simples o POJOs.
- **Validación duplicada:** existen validaciones en DTOs (decoradores) y validaciones manuales en controladores — duplicación de reglas.

**Consecuencias**
- Dificultad para probar componentes aislados.
- Alto coste al cambiar la estrategia de moderación o ranking.
- Riesgo de errores por tipos inconsistentes del cliente legacy.

**Patrones de diseño recomendados (implementación propuesta)**

1) **Creacional — Factory Method (`PostFactory`)**
- Propósito: centralizar la creación de `PostEntity`/`CommentEntity` desde datos crudos (resultados de Prisma, payloads externos) y calcular campos derivados (`relevanceScore`, `isFeatured`, `tags`) en un único lugar.
- Beneficios: elimina duplicación de mapeo, facilita pruebas unitarias de creación y encapsula la lógica de derivación.
- Implementación sugerida: crear `src/posts/factories/post.factory.ts` con `class PostFactory { static fromDb(row): PostEntity { ... } }`. Reemplazar todos los mapeos inline en `posts.controller.ts` por `PostFactory.fromDb(...)`.

2) **Estructural — Adapter (`ModerationAdapter`)**
- Propósito: normalizar la interfaz del cliente de moderación legacy para exponer un contrato consistente (`IModerationService.moderate(text): Promise<ModerationResult>`).
- Beneficios: desacopla el resto de la aplicación de las inconsistencias del cliente legacy y permite sustituir la implementación (mock, 3rd-party nuevo) fácilmente.
- Implementación sugerida: crear `src/posts/adapters/moderation.adapter.ts` que envuelva `legacy-moderation.client.ts` y convierta cualquier respuesta en `{ action: 'allow'|'block'|'review', score?: number }`.
- Integración: inyectar `ModerationAdapter` en `PostsService` o en un nuevo `ModerationService` y mover la lógica de decisión fuera del controlador.

3) **Comportamiento — Strategy (`RankingStrategy`)**
- Propósito: extraer algoritmos de ordenación/ranking (`hot`, `latest`, `trending`) detrás de una interfaz común `IRankingStrategy.rank(posts): Post[]`.
- Beneficios: añadir nuevas estrategias o ajustar fórmulas sin tocar el controlador; facilita pruebas de cada estrategia por separado.
- Implementación sugerida: carpeta `src/posts/ranking/strategies/` con `HotStrategy`, `LatestStrategy`, `TrendingStrategy`; un `RankingContext` o `RankingService` selecciona la estrategia según query param o configuración.

Extras y cambios de arquitectura sugeridos
- Mover la orquestación del flujo feed al `PostsService` (fetch → enrich con `PostFactory` → moderate via `ModerationAdapter` (si aplica) → rank via `RankingStrategy` → map a DTO). El controlador debe convertirse en una capa delgada que sólo valida y delega.
- Normalizar constantes y fórmulas en `src/posts/constants.ts` para evitar magic numbers.
- Unificar la nomenclatura `source` y añadir un campo opcional `provenance` en las entidades para trazabilidad.
- Simplificar `entities/*` para que sean POJOs/DTOs sin lógica; dejar la lógica derivada en `factories` o en servicios de dominio.

Propuesta de archivos a crear (esqueleto)
- `src/posts/factories/post.factory.ts`
- `src/posts/adapters/moderation.adapter.ts`
- `src/posts/ranking/strategies/hot.strategy.ts`
- `src/posts/ranking/strategies/latest.strategy.ts`
- `src/posts/ranking/ranking.service.ts` (selección de estrategia)
