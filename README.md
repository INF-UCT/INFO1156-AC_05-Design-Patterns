# Feed de Publicaciones

Este proyecto implementa un feed social sencillo, sin usuarios ni autenticación, centrado en la interacción entre publicaciones, likes y comentarios. La aplicación está pensada para simular una plataforma de contenido visual con lógica de negocio realista pero acotada.

## Requerimientos

- Docker

## Resumen funcional

El sistema permite crear publicaciones con imagen, texto y descripción, y mostrarlas en un feed central. Cada publicación puede recibir likes y comentarios, y esas interacciones modifican cómo se percibe su importancia dentro del feed.

El comportamiento general del producto gira alrededor de tres ideas:

- **contenido**: las publicaciones son la unidad principal del sistema,
- **interacción**: likes y comentarios enriquecen cada publicación,
- **priorización**: el feed puede cambiar de orden según distintos criterios de relevancia.

## Lógica de negocio principal

La lógica del sistema no solo guarda datos, también construye una vista enriquecida del feed. Para cada publicación se calcula información derivada, como la cantidad de interacciones y una puntuación de relevancia que combina actividad reciente con volumen de participación.

Además, antes de persistir comentarios se aplica una validación/moderación para filtrar contenido problemático. El sistema también ejecuta efectos operativos cuando se crean interacciones (por ejemplo trazas y procesos internos de recálculo), reflejando un flujo típico de aplicaciones de contenido.

## Contexto técnico

La solución está construida con NestJS en backend, Prisma ORM y SQLite como almacenamiento local.

La base de datos es fija en `sqlite.db`

## Ejecución:

Para levantar todo el sistema con Docker:

1. `make setup`
2. `make run`

Este comando construye la imagen, instala dependencias dentro del contenedor, aplica migraciones Prisma, genera el cliente y arranca NestJS en modo watch.

En este flujo, los artefactos de compilación y cache de paquetes se mantienen dentro de volúmenes Docker para no ensuciar el directorio del proyecto.

La aplicación queda disponible en:

- `http://localhost:3000`
- `http://localhost:3000/docs`
- `http://localhost:5555` (Prisma Studio - Database Manager)

Comandos útiles:

- `make stop` para detener el contenedor
- `make logs` para ver logs en tiempo real

---

# Refactorización de Arquitectura y Patrones de Diseño

Este documento detalla las decisiones arquitectónicas y la implementación de patrones de diseño aplicadas durante la refactorización del proyecto. El objetivo principal de estos cambios es mejorar la mantenibilidad, escalabilidad y legibilidad del código.

## Patrones de Diseño Aplicados (Implementados)

### 1. Patrón Adapter (Adaptador) para `Legacy Moderation Client`

- **Por qué es la decisión adecuada:** En sistemas en evolución, es común tener que interactuar con servicios heredados (legacy) o librerías de terceros que tienen interfaces incompatibles con nuestro nuevo estándar de código. El patrón Adapter nos permite envolver el `Legacy Moderation Client` para que cumpla con una interfaz moderna y limpia que nuestro dominio sí entiende, aislando el código antiguo del resto del sistema.
- **Cómo se implementa / Cómo funciona:**
  Se define una interfaz en nuestro dominio (`IModerationService` con un método `review()`). Luego, se crea una clase `LegacyModerationAdapter` que implementa esta interfaz y se la inyecta al controlador mediante Inyección de Dependencias. Internamente, el adaptador recibe la llamada, la traduce al formato que el `Legacy Moderation Client` requiere y mapea la respuesta de vuelta a un formato predecible (`{ isBlocked, rawResult }`) para devolverlo a nuestra aplicación. El controlador ahora solo depende de la abstracción.

### 2. Patrón Builder (Constructor) para las Entities

- **Por qué es la decisión adecuada:** Las entidades principales de la aplicación (como `PostEntity`) pueden crecer en complejidad, adquiriendo múltiples parámetros opcionales y reglas de validación en su creación. Usar constructores tradicionales genera el "anti-patrón de constructor telescópico" (constructores enormes difíciles de leer, como el de 14 parámetros). El patrón Builder permite construir objetos complejos paso a paso, haciendo el código de instanciación extremadamente legible.
- **Cómo se implementa / Cómo funciona:**
  Se crea una clase `PostBuilder` que expone métodos fluidos (chaining) para cada atributo, como `.withTitle(title)`, `.withContent(content)` y `.withLikesCount(count)`. Cada uno de estos métodos retorna la instancia actual del builder (`this`). Finalmente, un método `.build()` se encarga de instanciar la Entidad final con todos los parámetros configurados previamente.

### 3. Patrón Strategy (Estrategia) para el Ordenamiento del Feed

- **Por qué es la decisión adecuada:** El ordenamiento del feed (latest, mostLiked, mostCommented, relevance) variaba dependiendo del parámetro `mode` solicitado por el usuario. Si manejamos esto con múltiples `if/else` o un bloque `switch` en el controlador, violamos el principio Open/Closed, haciendo que el código sea frágil y difícil de extender si se requieren nuevos métodos de ordenamiento en el futuro. Strategy nos permite encapsular estas lógicas de ordenación en familias de algoritmos intercambiables.
- **Cómo se implementa / Cómo funciona:**
  Se define una interfaz común `FeedOrderingStrategy` con un método `sort()`. Se crean clases concretas que implementan esta interfaz (ej. `LatestOrderingStrategy`, `MostLikedOrderingStrategy`). En el `Post Controller`, en lugar de tener lógica condicional, se delega a un `FeedOrderingContext` que devuelve la estrategia adecuada basándose en el parámetro `mode` del Request, y finalmente se ejecuta la ordenación de los posts. Esto deja al controlador limpio y con una única responsabilidad.

---

## Patrones Evaluados pero NO Aplicados

Durante la fase de diseño, se consideraron los siguientes patrones, pero fueron descartados en favor de otras soluciones arquitectónicas por las razones que se detallan a continuación.

### 1. Patrón Observer (Observador) para `Post Controller`

- **Cómo se implementaría:** Se utilizaría para emitir eventos cada vez que un Post o Interacción (Like/Comentario) fuera creado, notificando a múltiples observadores (sistemas de logging, notificaciones, procesos de recálculo) para que reaccionen al evento.
- **Por qué no se usó (y por qué Strategy fue mejor elección prioritaria):** El patrón Observer es excelente para aislar efectos secundarios asíncronos (`fakeSendNotification`, `logDomainEvent`). Sin embargo, el problema arquitectónico de mayor peso en el `Post Controller` en este refactor era **gestionar la variabilidad del comportamiento principal** (el ordenamiento). El patrón _Strategy_ atacó directamente la alta complejidad ciclomática del flujo central, aportando mucho más valor inmediato a la extensibilidad. Observer habría añadido una capa de eventos pub/sub que, aunque útil a futuro, no resolvía los `switch` gigantes del feed.

### 2. Patrón Facade (Fachada) para `Post Controller` y `Post Service`

- **Cómo se implementaría:** Se crearía una clase `PostFacade` que agruparía llamadas al `PostService` y a la moderación, proporcionando una única función simplificada (`createAndModeratePost()`) para el controlador.
- **Por qué no se usó:** En nuestra arquitectura por capas (Controller -> Service -> Repository), el Service _ya actúa inherentemente_ como una fachada para la lógica de negocio. Introducir un Facade adicional entre el Controller y el Service hubiese agregado una capa de abstracción redundante. Se prefirió usar el **Adapter** para domar la complejidad externa (el servicio de moderación heredado) aislando la toxicidad del sistema viejo, en lugar de intentar ocultarla detrás de un Facade genérico.

### 3. Patrón Factory (Fábrica) para `PrismaService`

- **Cómo se implementaría:** Se crearía una clase `PrismaFactory` encargada de instanciar la conexión a la base de datos, configurando diferentes parámetros de conexión dinámica según contextos de ejecución.
- **Por qué no se usó:** La herramienta Prisma ORM y NestJS manejan el cliente de base de datos como un **Singleton** inyectable. No necesitamos crear dinámicamente _múltiples familias_ de clientes ni instanciarlos repetidamente. Requerimos un único pool de conexiones compartido gestionado por el ciclo de vida del framework. Por lo tanto, usar el patrón Factory aquí aportaba una complejidad innecesaria a un problema que NestJS ya resuelve nativamente.

---

## Conclusión Arquitectónica

La elección de **Adapter**, **Builder** y **Strategy** en detrimento de Observer, Facade y Factory se fundamenta en atacar los verdaderos cuellos de botella del dominio:

1. **Adapter** elimina el acoplamiento directo con el sistema de moderación heredado (algo que un Facade no soluciona a nivel de interfaces).
2. **Builder** resuelve la dificultad e ilegibilidad de crear instancias de entidades masivas.
3. **Strategy** aplica polimorfismo para eliminar la complejidad ciclomática de las reglas de ordenamiento del feed, priorizando la estructura central sobre los side-effects del Observer.
