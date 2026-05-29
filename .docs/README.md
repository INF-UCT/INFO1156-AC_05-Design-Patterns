# Reporte de Proyecto: Identificación de Problemas y Soluciones

Este documento detalla el análisis del sistema, los problemas de diseño o implementación identificados en la arquitectura inicial y las soluciones técnicas aplicadas para resolverlos.



## Problemas Identificados

En esta sección se describen las deficiencias, bugs o limitaciones técnicas encontradas en el sistema original.

### ❗️ Problema 1: [Lógica de Ordenamiento y Ranking Inline]
* **Descripción:** [El controlador principal **(posts.controller.ts)** tenía la responsabilidad directa de decidir y ejecutar los algoritmos de ordenamiento para el "feed" de publicaciones a través de una extensa estructura de codigo "switch(mode)"].
* **Impacto:** [El problema violaba fuertemente el Principio de Responsabilidad Única (SRP) y el Principio de Abierto/Cerrado (OCP) de SOLID. Esto provocaba que el controlador estuviera sobrecargado y fuera difícil de leer].

---
### ❗️ Problema 2: [Lógica de Moderación "Legacy" con múltiples tipos]
* **Descripción:** [El controlador principal interactuaba de forma directa con un cliente de moderación externo (legacy) cuyo método de revisión para estos, era inconsistente y terminaba en retornar múltiples tipos de datos distintos (string, number u object), haciendo que obligaba al controlador a implementar múltiples bloques de condicionales encadenados (if / elseif) utilizando el operador "typeof" para descifrar arduamente si un comentario debía ser bloqueado o no].
* **Impacto:** [Esta situación violaba el Principio de Responsabilidad Única (SRP) y generaba un alto nivel de acoplamiento entre estos. La capa de controladores, cuya unica responsabilidad era manejar peticiones y respuestas HTTP, estaba estrechamente ligada a las particularidades y defectos de una librería externa. Si la API legacy llegaba a cambiar sus reglas de retorno, el controlador facilmente se rompería, haciendo que el código fuera muy frágil a la hora del minimo cambio].

---
### ❗️ Problema 3: [Side-effects y notificaciones repetidas]
* **Descripción:** [El controlador principal ejecutaba directamente efectos secundarios cada vez que se creaba una publicación, un comentario o un like. En distintos métodos se repetían llamadas como registro de eventos, envío de notificaciones simuladas y procesos de recálculo interno. Esta lógica no pertenecía al controlador, ya que su responsabilidad principal debería limitarse a recibir peticiones HTTP, coordinar el flujo y devolver respuestas].

* **Impacto:** [El problema generaba duplicación de código y alto acoplamiento entre el controlador y acciones operativas secundarias. Si en el futuro se necesitaba agregar otro efecto, como enviar un correo, guardar una auditoría o actualizar métricas, habría que modificar varios métodos del controlador. Esto violaba el Principio de Responsabilidad Única (SRP) y hacía que el código fuera más difícil de mantener, probar y extender].

---
### ❗️ Problema 4: [Mapeo complejo de entidades dentro del controlador]
* **Descripción:** [El controlador construía directamente objetos de respuesta como PostEntity, CommentEntity y LikeEntity. Además, calculaba manualmente datos derivados como cantidad de likes, cantidad de comentarios, puntaje de relevancia, etiquetas, metadata, estado destacado y otros valores necesarios para presentar el feed. Esto hacía que el controlador mezclara lógica HTTP con lógica de transformación de datos].

* **Impacto:** [El problema aumentaba demasiado la responsabilidad del controlador y hacía que el código fuera más extenso, rígido y difícil de leer. Cualquier cambio en la forma de construir una entidad o en los datos derivados obligaba a modificar el controlador. Esto afectaba el Principio de Responsabilidad Única (SRP), reducía la reutilización del mapeo y dificultaba mantener una estructura clara entre capas].
---
## Solución Implementada

A continuación se detallan las decisiones de diseño y arquitectura de software tomadas para mitigar los problemas anteriores.

### 🛠 Solución a [Problema 1]
* **Estrategia:** [Se implementó el patrón de diseño Strategy. Para ello, se definió una interfaz común a la que se llamo PostSortStrategy y se extrajo cada algoritmo de ordenamiento del codigo en su propia clase independiente (LatestSortStrategy, MostLikedSortStrategy, MostCommentedSortStrategy, RelevanceSortStrategy). Posteriormente, se creó una clase contexto llamada PostSortContext, encargada de instanciar dinámicamente la estrategia correcta basándose en el filtro (parámetro mode pasado en la petición). Finalmente, en el controlador se reemplazó todo el bloque switch por la simple instanciación del contexto y el llamado a un método genérico .sort()].
* **Justificación:** Se planteo usar este patron porque desacopla completamente la definicion de los algoritmos de ordenamiento del lugar donde se ejecutan (el controlador). Gracias a esto, se cumple el Principio Abierto/Cerrado (OCP): la aplicación ahora está "abierta" a la extensión de nuevas clases, pero "cerrada" a la modificación  Además, se restaura el Principio de Responsabilidad Única (SRP), limpiando el controlador de multiples responsabilidades que podrian hacer fallar el codigo.

<p align="center">
  <img src="images/problema1.png" alt="Patron Strategy PB 1" width="1000"/>
</p>

---
### 🛠 Solución a [Problema 2]
* **Estrategia:** [Se aplicó el patrón de diseño estructural Adapter. Para esto, se creó una nueva clase independiente llamada "ModerationAdapter". Esta clase actúa como un "traductor" o intermediario: envuelve la llamada a la API defectuosa, procesa internamente toda la compleja red de validaciones de "typeof" y expone hacia el exterior una interfaz estandarizada, predecible y fuertemente tipada retornando asi un simple booleano y el resultado original].
* **Justificación:** El patrón Adapter es ideal en esta situacion porque su propósito es permitir que clases o sistemas con interfaces incompatibles trabajen juntos de forma "universal" por asi decirlo. Al usarlo, se logra proteger nuestro controlador "limpio" de la lógica "sucia" del mundo exterior. Además, se cumple con el Principio de Inversión de Dependencias y el Principio de Abierto/Cerrado (OCP) ya que si en un par de meses la API de moderación se actualiza o se llega a cambiar de proveedor, únicamente se deberia de modificar la clase "ModerationAdapter".

<p align="center">
  <img src="images/problema2.png" alt="Patron Adapter PB 2." width="1000"/>
</p>

---
### 🛠 Solución a [Problema 3]
* **Estrategia:** [Se implementó el patrón de diseño Observer. Para esto, se creó un publicador de eventos llamado PostEventPublisher, encargado de emitir eventos de dominio como "post.created", "comment.created" y "like.created". Además, se definieron observadores separados: DomainEventLogger para registrar eventos, NotificationObserver para simular notificaciones y RelevanceRecomputeObserver para ejecutar el recálculo asociado al post. De esta manera, el controlador dejó de llamar directamente a cada efecto secundario y ahora solo publica un evento cuando ocurre una acción importante].

* **Justificación:** El patrón Observer fue elegido porque permite desacoplar el objeto que genera un evento de los objetos que reaccionan ante él. Gracias a esto, el controlador ya no necesita conocer todos los efectos secundarios asociados a una acción. Si en el futuro se requiere agregar otro comportamiento, como enviar correos o guardar auditorías, basta con crear un nuevo observador sin modificar la lógica principal del controlador. Esto mejora la mantenibilidad, reduce duplicación y cumple mejor con el Principio de Responsabilidad Única (SRP).


---
### 🛠 Solución a [Problema 4]
* **Estrategia:** [Se implementó el patrón de diseño Factory. Para esto, se creó la clase PostEntityFactory, responsable de centralizar la creación de las entidades de salida del sistema. Esta fábrica contiene métodos para construir PostEntity, CommentEntity y LikeEntity, encapsulando los cálculos y transformaciones necesarios, como likesCount, commentsCount, relevanceScore, tags, metadata y rankingMode. Con esto, el controlador dejó de instanciar manualmente entidades complejas y delegó esa responsabilidad a una clase especializada].

* **Justificación:** El patrón Factory fue utilizado porque permite encapsular la lógica de creación de objetos complejos en un único lugar. Esto evita que el controlador conozca todos los detalles internos necesarios para construir las entidades de respuesta. Además, facilita reutilizar el mapeo en otros servicios o controladores, reduce duplicación y permite modificar la estructura de las entidades sin alterar directamente la capa HTTP. Con esta solución, el controlador queda más limpio y enfocado en coordinar la petición, mientras la fábrica se encarga de transformar los datos del dominio en objetos de salida.


---
### 🛠 Solución a [Problema 5]
* **Estrategia:** [Indique su solución/estrategia para solucionar el problema...].
* **Justificación:** Indique la razón de esa estrategia como solución al problema...

<p align="center">
  <img src="ruta/ejemplo..." alt="indicar tipo de patron..." width="80"/>
</p>

---
