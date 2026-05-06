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

# Refactorización de arquitectura y patrones de diseño

Este documento detalla las decisiones arquitectónicas y la implementación de patrones de diseño aplicadas durante la refactorización del proyecto. El objetivo principal de estos cambios es mejorar la mantenibilidad, escalabilidad y legibilidad del código.

## Patrones de diseño aplicados

### 1. Patrón Adapter (Adaptador) para `Legacy Moderation Client`

- **Fundamento:** En sistemas que evolucionan constantemente, es muy común tener que interactuar con servicios heredados (legacy) o librerías de terceros que manejan interfaces incompatibles con nuestros nuevos estándares. El patrón Adapter nos permite envolver el `Legacy Moderation Client` para que cumpla con una interfaz moderna y limpia que nuestro dominio comprende a la perfección, aislando así el código antiguo del resto del ecosistema.
- **Implementación:**
  Definimos una interfaz propia en nuestro dominio (`IModerationService` con un método `review()`). Luego, creamos la clase `LegacyModerationAdapter`, la cual implementa esta interfaz y se inyecta directamente al controlador mediante Inyección de Dependencias. Internamente, el adaptador recibe la llamada, la traduce al formato que el cliente heredado exige, y finalmente mapea la respuesta a un formato estructurado y predecible (`{ isBlocked, rawResult }`). De esta manera, el controlador queda limpio y dependiendo únicamente de la abstracción.

### 2. Patrón Builder (Constructor) para las entidades

- **Fundamento:** Las entidades principales de la aplicación (como `PostEntity`) tienden a crecer en complejidad, requiriendo cada vez más parámetros opcionales y reglas de validación durante su creación. Si utilizamos constructores tradicionales, caemos rápidamente en el "anti-patrón de constructor telescópico", dando como resultado inicializaciones enormes y muy difíciles de leer (como ocurre al tener constructores con 14 parámetros). El patrón Builder nos permite ensamblar estos objetos complejos paso a paso, volviendo el código mucho más declarativo y limpio.
- **Implementación:**
  Creamos las clases `PostEntityBuilder`, `CommentEntityBuilder` y `LikeEntityBuilder` que exponen métodos fluidos (chaining) para cada uno de los atributos de las entidades, por ejemplo: `.setId(id)`, `.setTitle(title)`, `.calculateCounts(likes, comments)`. Cada método devuelve la instancia actual del builder (`this`), permitiendo encadenar llamadas de forma continua. Al final, un método `.build()` se encarga de instanciar la entidad definitiva reuniendo toda la configuración provista, encapsulando además la lógica de cálculo de campos derivados.

### 3. Patrón Strategy (Estrategia) para el ordenamiento del feed

- **Fundamento:** El ordenamiento del feed (recientes, más votados, más comentados, relevancia) varía dinámicamente según el parámetro `mode` que solicite el usuario en la petición. Si intentamos resolver esto apilando múltiples bloques `if/else` o un gran `switch` dentro del controlador, estaríamos rompiendo el principio Open/Closed. Esto hace que el código se vuelva frágil y muy tedioso de modificar si el día de mañana surgen nuevas formas de ordenamiento. Strategy nos permite extraer y encapsular estas distintas lógicas en familias de algoritmos independientes e intercambiables.
- **Implementación:**
  Definimos una interfaz común `FeedOrderingStrategy` que cuenta con el método `sort()`. A partir de ella, creamos las distintas clases concretas (ej. `LatestOrderingStrategy`, `MostLikedOrderingStrategy`). En el controlador, en lugar de evaluar condiciones con un `switch`, instanciamos un `FeedOrderingContext` que nos devuelve la estrategia correcta en base al parámetro `mode` recibido. El controlador simplemente delega el ordenamiento a `strategy.sort(sorted)`. Así, el controlador mantiene una única responsabilidad y su lectura es lineal.

### 4. Patrón Observer (Observador) para eventos de dominio

- **Fundamento:** En el flujo original, el controlador debía invocar manualmente múltiples funciones secuenciales (`logDomainEvent`, `fakeSendNotification`, `fakeRecomputeSomething`) cada vez que ocurría una acción (crear post, comentario o like). Esto generaba duplicación de código y obligaba a modificar múltiples lugares si se añadía un nuevo efecto secundario. El patrón Observer permite desacoplar el evento de sus manejadores, permitiendo que el controlador solo emita un evento y los observadores reaccionen automáticamente.
- **Implementación:**
  Creamos una interfaz `DomainEvent` y `EventObserver`. Luego, implementamos observadores concretos (`LoggerObserver`, `NotificationObserver`, `RecomputeObserver`) que reaccionan a los eventos. El `DomainEventPublisher` actúa como el sujeto (Subject), manteniendo una lista de observadores y notificándoles cuando se publica un evento mediante el método `publish()`. En el controlador, simplemente se inyecta el Publisher y se llama a `publish()` con el tipo de evento y el payload, eliminando la lógica de invocación manual.

### 5. Patrón Factory (Fábrica) para la instanciación de PrismaService
Fundamento: A pesar de que NestJS maneja instancias en forma de Singleton de manera excelente, la configuración de la conexión a la base de datos a menudo requiere una lógica condicional basada en el entorno (como cambiar entre la base de datos de testing y la de desarrollo/producción). Si dejamos esta lógica de selección embebida directamente dentro de la clase de servicio, ensuciamos su propósito y violamos el principio de Responsabilidad Única.
Implementación: Creamos una clase PrismaClientFactory con un método estático create(environment). Esta fábrica evalúa el entorno de ejecución actual, selecciona qué archivo de base de datos usar (test.db o sqlite.db), construye las opciones del adaptador PrismaLibSql y retorna la instancia del PrismaService lista para ser usada. Finalmente, en el módulo de NestJS (PrismaModule), utilizamos un useFactory para registrar este servicio. Así extraemos toda la lógica compleja de creación y selección fuera del cliente en sí.



---

## Patrones evaluados pero no aplicados

Durante la fase de diseño consideramos otras alternativas, pero decidimos descartarlas a favor de soluciones más alineadas a las necesidades inmediatas del proyecto. A continuación detallamos los motivos:

### 1. Patrón Facade (Fachada) para `Post Controller` y `Post Service`

- **Posible implementación:** Consistiría en crear una clase `PostFacade` que agrupara las llamadas hacia el `PostService` y hacia el servicio de moderación, ofreciendo una única función de alto nivel (como `createAndModeratePost()`) lista para ser consumida por el controlador.
- **Motivo de descarte:** Al utilizar una arquitectura dividida por capas (Controlador -> Servicio -> Repositorio), el Servicio _ya actúa de forma inherente_ como una fachada para nuestra lógica de negocio. Introducir otra Fachada adicional entre el controlador y el servicio solo hubiese sumado una capa de abstracción redundante. Decidimos emplear el patrón **Adapter** para controlar la complejidad externa (el servicio heredado de moderación), aislando esa "toxicidad" específica en lugar de intentar esconderla burdamente detrás de un Facade genérico.

---

## Conclusión de la arquitectura

La decisión de implementar **Adapter**, **Builder**, **Strategy** y **Observer** se basó completamente en atacar los verdaderos cuellos de botella de nuestro dominio:

1. **Adapter** elimina de raíz el fuerte acoplamiento que teníamos con el sistema de moderación heredado, estandarizando la respuesta en una interfaz limpia.
2. **Builder** nos da una solución elegante a la dificultad (y pésima legibilidad) que supone instanciar entidades masivas atestadas de parámetros, encapsulando la lógica de cálculo de campos derivados.
3. **Strategy** exprime el polimorfismo para destruir la complejidad ciclomática y los bloques condicionales pesados asociados al ordenamiento del feed mediante el uso de `FeedOrderingContext`.
4. **Observer** desacopla los efectos secundarios (logging, notificaciones, recálculos) del controlador mediante el `DomainEventPublisher`, eliminando la duplicación de funciones manuales.

El único patrón descartado fue **Facade**, ya que el `PostsService` ya actúa como fachada natural de la lógica de negocio, haciendo redundante una capa adicional.
