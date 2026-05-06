/**
 * PATRÓN: BUILDER (Creacional)
 *
 * Problema: PostEntity, CommentEntity y LikeEntity se construyen con
 * constructores de hasta 14 parámetros posicionales. Esto es frágil:
 * un parámetro en el lugar equivocado no genera error en TypeScript
 * si los tipos coinciden, y es difícil de leer.
 *
 * Solución: Un Builder por entidad que permite construir el objeto
 * paso a paso con métodos nombrados, haciendo el código legible y
 * evitando errores de orden de parámetros.
 */