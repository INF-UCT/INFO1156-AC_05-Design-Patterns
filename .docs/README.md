USO DE ADAPTER

el roblema es que El legacyModerationApi devuelve tipos mixtos: "OK", "BLOCK", un numero y un booleano y el controller tiene unos if/else if/else complejos para interpretar las respuestas. Esa lógica está mezclada con la lógica de negocio.
la solución fue crear una interfaz ModerationService con un método isBlocked que absorbe toda esa lógica de traducción y expone un método simple. también se implementó un LegacyModerationAdapter que envuelve al legacyModerationApi y traduce todos sus tipos a ese booleano simple. El controller solo llama moderationService.isBlocked.

USO DE PATRON BUILDER

Las entidades tenían constructores con muchos parámetros:
PostEntity: 14 parámetros
CommentEntity: 11 parámetros
LikeEntity: 9 parámetros
Esto hacía que sea fácil confundir el orden de los argumentos.

La solución Implementada fué Patrón Builder: Se crearon tres builders (uno por entidad) con una interfaz fluida encadenable:
un PostEntityBuilder, CommentEntityBuilder y LikeEntityBuilder, cada uno con métodos encadenables tipo withId(), withLikesCount(), withRelevanceScore(), build(). Los campos derivados (como isFeatured, strengthLabel, tags) se pueden calcular automáticamente dentro del builder en build().

