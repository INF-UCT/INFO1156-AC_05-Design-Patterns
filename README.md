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
  Creamos una clase `PostBuilder` que expone métodos fluidos (chaining) para cada uno de los atributos de la entidad, por ejemplo: `.withTitle(title)`, `.withContent(content)` y `.withLikesCount(count)`. Cada método devuelve la instancia actual del builder (`this`), permitiendo encadenar llamadas de forma continua. Al final, un método `.build()` se encarga de instanciar la entidad definitiva reuniendo toda la configuración provista.

### 3. Patrón Strategy (Estrategia) para el ordenamiento del feed

- **Fundamento:** El ordenamiento del feed (recientes, más votados, más comentados, relevancia) varía dinámicamente según el parámetro `mode` que solicite el usuario en la petición. Si intentamos resolver esto apilando múltiples bloques `if/else` o un gran `switch` dentro del controlador, estaríamos rompiendo el principio Open/Closed. Esto hace que el código se vuelva frágil y muy tedioso de modificar si el día de mañana surgen nuevas formas de ordenamiento. Strategy nos permite extraer y encapsular estas distintas lógicas en familias de algoritmos independientes e intercambiables.
- **Implementación:**
  Definimos una interfaz común `FeedOrderingStrategy` que cuenta con el método `sort()`. A partir de ella, creamos las distintas clases concretas (ej. `LatestOrderingStrategy`, `MostLikedOrderingStrategy`). En el controlador, en lugar de evaluar condiciones, simplemente delegamos la decisión a un contexto (`FeedOrderingContext`). Este contexto es el encargado de devolvernos la estrategia correcta en base al parámetro recibido, para luego ejecutar la ordenación. Así, el controlador mantiene una única responsabilidad y su lectura es lineal.

### 4. Patrón Factory (Fábrica) para la instanciación de `PrismaService`

- **Fundamento:** A pesar de que NestJS maneja instancias en forma de Singleton de manera excelente, la configuración de la conexión a la base de datos a menudo requiere una lógica condicional basada en el entorno (como cambiar entre la base de datos de testing y la de desarrollo/producción). Si dejamos esta lógica de selección embebida directamente dentro de la clase de servicio, ensuciamos su propósito y violamos el principio de Responsabilidad Única.
- **Implementación:**
  Creamos una clase `PrismaClientFactory` con un método estático `create(environment)`. Esta fábrica evalúa el entorno de ejecución actual, selecciona qué archivo de base de datos usar (`test.db` o `sqlite.db`), construye las opciones del adaptador `PrismaLibSql` y retorna la instancia del `PrismaService` lista para ser usada. Finalmente, en el módulo de NestJS (`PrismaModule`), utilizamos un `useFactory` para registrar este servicio. Así extraemos toda la lógica compleja de creación y selección fuera del cliente en sí.

---

## Patrones evaluados pero no aplicados

Durante la fase de diseño consideramos otras alternativas, pero decidimos descartarlas a favor de soluciones más alineadas a las necesidades inmediatas del proyecto. A continuación detallamos los motivos:

### 1. Patrón Observer (Observador) para `Post Controller`

- **Posible implementación:** Podríamos haberlo utilizado para emitir un evento cada vez que se creara una publicación o una interacción (likes, comentarios), notificando así a múltiples observadores (sistemas de logging, envío de notificaciones o tareas en segundo plano) para que reaccionen a dicho evento.
- **Motivo de descarte:** Si bien Observer es un patrón excelente para aislar efectos secundarios asíncronos (como `fakeSendNotification` o `logDomainEvent`), el problema estructural de mayor urgencia en nuestro controlador era **gestionar la variabilidad del comportamiento principal** (es decir, el ordenamiento). El patrón _Strategy_ atacó de lleno la alta complejidad ciclomática del flujo central, aportando un valor inmediato a la mantenibilidad del código. Implementar Observer habría añadido una capa extra de eventos (pub/sub) que, aunque interesante a futuro, no iba a solucionar los gigantescos bloques lógicos del feed.

### 2. Patrón Facade (Fachada) para `Post Controller` y `Post Service`

- **Posible implementación:** Consistiría en crear una clase `PostFacade` que agrupara las llamadas hacia el `PostService` y hacia el servicio de moderación, ofreciendo una única función de alto nivel (como `createAndModeratePost()`) lista para ser consumida por el controlador.
- **Motivo de descarte:** Al utilizar una arquitectura dividida por capas (Controlador -> Servicio -> Repositorio), el Servicio _ya actúa de forma inherente_ como una fachada para nuestra lógica de negocio. Introducir otra Fachada adicional entre el controlador y el servicio solo hubiese sumado una capa de abstracción redundante. Decidimos emplear el patrón **Adapter** para controlar la complejidad externa (el servicio heredado de moderación), aislando esa "toxicidad" específica en lugar de intentar esconderla burdamente detrás de un Facade genérico.

---

## Conclusión de la arquitectura

La decisión de implementar **Adapter**, **Builder**, **Strategy** y **Factory** por sobre Observer o Facade se basó completamente en atacar los verdaderos cuellos de botella de nuestro dominio:

1. **Adapter** elimina de raíz el fuerte acoplamiento que teníamos con el sistema de moderación heredado (un problema de incompatibilidad que un Facade no llega a solucionar a nivel estricto de interfaces).
2. **Builder** viene a darnos una solución elegante a la dificultad (y pésima legibilidad) que supone instanciar entidades masivas atestadas de parámetros.
3. **Strategy** exprime el polimorfismo para destruir la complejidad ciclomática y los bloques condicionales pesados asociados al ordenamiento del feed, priorizando la solidez de la lógica principal por encima de la gestión de efectos secundarios que nos ofrecía Observer.
4. **Factory** encapsula la complejidad de instanciar un servicio de base de datos multi-entorno, separando inteligentemente la lógica de _creación_ de la lógica de _uso_ y permitiendo mantener nuestro código modular frente a múltiples configuraciones.
