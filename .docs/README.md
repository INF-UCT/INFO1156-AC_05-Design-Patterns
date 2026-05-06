# Documentación del Sistema: Refactorización y Patrones de Diseño

## 1. Problemas Detectados en el Código Original
*   **Alta Complejidad en Controladores:** El `PostsFacadeController` asumía demasiadas responsabilidades, gestionando directamente la lógica de creación y coordinación de múltiples entidades, lo que dificultaba el mantenimiento.
*   **Acoplamiento Rígido:** La lógica para crear publicaciones, comentarios y likes estaba dispersa, generando dependencias directas entre los componentes de la interfaz y las reglas de negocio.
*   **Dificultad de Extensión:** La falta de una interfaz centralizada hacía que cualquier cambio en el flujo de interacción (feed, likes, etc.) requiriera modificaciones en múltiples archivos.

## 2. Patrones de Diseño Aplicados
*   **Patrón Fachada (Facade):** Se implementó `post.facade.ts` para centralizar la lógica compleja de creación de posts, comentarios y gestión del feed. Esto permitió simplificar el `PostsFacadeController`, delegando la carga operativa a la fachada.
*   **Patrón Adaptador (Adapter):** Se creó `moderation.adapter.ts` para normalizar la comunicación con servicios externos o módulos de moderación, asegurando que el sistema sea flexible a cambios en proveedores externos.
*   **Patrón Creacional [Nombre del Patrón]:** Se estandarizó la creación de entidades (Posts, Comentarios, Likes) mediante un patrón creacional, eliminando la instanciación manual y centralizando las reglas de construcción de objetos.

## 3. Diagrama de Clases (Estructura Actual)
```mermaid
classDiagram
    class PostsFacadeController {
        -postsFacade: PostsFacade
        +createPost()
        +getFeed()
    }

    class PostsFacade {
        -moderationAdapter: ModerationAdapter
        -entityFactory: EntityFactory
        +managePostFlow()
        +manageComments()
    }

    class ModerationAdapter {
        +validateContent()
    }

    class EntityFactory {
        +createEntity(type)
    }

    class Post { }
    class Comment { }
    class Like { }

    PostsFacadeController --> PostsFacade : delega operaciones
    PostsFacade --> ModerationAdapter : usa para validar
    PostsFacade --> EntityFactory : solicita creación
    EntityFactory ..> Post : crea
    EntityFactory ..> Comment : crea
    EntityFactory ..> Like : crea
