# Content Schema

Estado: esquema incremental. Los subesquemas `musical-work`, `short-story`, `workshop` y `application` quedan fijados respectivamente en ALEVI-WEB-0003, ALEVI-WEB-0005, ALEVI-WEB-0006 y ALEVI-WEB-0007; las demás familias siguen provisionales hasta su primera migración real.

## Tipos editoriales

- `musical-work`
- `recording`
- `short-story`
- `poem`
- `essay`
- `theatre`
- `workshop`
- `research`
- `application`

## Estados editoriales

- `draft`
- `review`
- `published`
- `archived`

`published` significa que la pieza ya pertenece al catálogo público autoral. No implica por sí mismo que una rama de trabajo o un build de staging haya sido publicado.

## Campos comunes

Todo documento editorial debe declarar al menos:

- `title`
- `type`
- `status`
- `description`

Cuando corresponda, también puede declarar:

- `author`
- `categories`
- `license`

La licencia se declara por pieza o colección y no se infiere de un footer global.

# `musical-work` v1

Campos obligatorios:

- `title`
- `type: musical-work`
- `status`
- `author`
- `year`
- `instrumentation`
- `score`
- `description`
- `license`

Campos opcionales:

- `year-end`: último año de un período de composición.
- `revision-year`: año de una revisión posterior.
- `dedication`: persona o conjunto destinatario de la dedicatoria.
- `commission`: entidad o contexto de encargo.
- `premiere-year`: año del estreno.
- `premiere-performer`: intérprete o conjunto del estreno.
- `premiere-status: unpremiered`: para obras sin estreno registrado.
- `source-text`: texto o fuente literaria explícitamente asociada.
- `audio`: recurso sonoro local asociado.
- `video`: registro audiovisual externo asociado.

## Convenciones

- `year` registra el año inicial o único de composición.
- No se inventan día ni mes cuando la fuente sólo proporciona un año.
- `score` conserva las rutas históricas `/partituras/*.pdf` mientras exista compatibilidad con el sitio anterior.
- El cuerpo Markdown puede ampliar los metadatos con contexto, dedicatorias, estrenos y enlaces a registros.
- El contenido público nuevo se escribe preferentemente en Markdown estándar compatible con Obsidian y Quarto.

# `short-story` v1

Campos obligatorios:

- `title`
- `type: short-story`
- `status`
- `author`
- `year`
- `description`
- `license`

Campos opcionales:

- `revision-year`: año de una revisión posterior.
- `legacy-url`: ruta pública histórica que se conserva por compatibilidad.
- `categories`: clasificación editorial para navegación y búsqueda.

## Convenciones

- La migración desde HTML legado conserva el texto literario sin reescritura ni corrección silenciosa.
- `year` registra el año declarado por la pieza; `revision-year` registra una revisión explícita posterior.
- Si una página histórica contiene una declaración de derechos específica, ésta prevalece sobre declaraciones globales contradictorias del sitio antiguo salvo que una instrucción autoral posterior y explícita la sustituya.
- Para nuevas obras literarias públicas, la licencia editorial por defecto es `CC BY-NC-ND 4.0`, conforme a `_project/EDITORIAL_POLICY.md`.
- La ruta histórica puede seguir disponible como recurso estático aunque el Markdown pase a ser la fuente editorial canónica.
- El contenido público nuevo se escribe preferentemente en Markdown estándar compatible con Obsidian y Quarto.

# `workshop` v1

Campos obligatorios:

- `title`
- `type: workshop`
- `status`
- `event-status`
- `author`
- `year`
- `start-date`
- `end-date`
- `sessions`
- `session-duration`
- `modality`
- `description`

Campos opcionales:

- `categories`: clasificación editorial para navegación y búsqueda.
- `legacy-url`: ruta pública histórica preservada por compatibilidad.
- `license`: sólo cuando la pieza o colección tenga una declaración explícita de licencia.

Valores iniciales de `event-status`:

- `upcoming`
- `open`
- `completed`
- `cancelled`

## Convenciones

- `status` describe el estado editorial de la ficha; `event-status` describe el estado temporal de la edición del taller.
- Cada edición fechada se conserva como documento propio para no sobrescribir el registro histórico cuando exista una nueva convocatoria.
- Las fechas se registran en formato ISO `YYYY-MM-DD` y sólo cuando están documentadas por una fuente pública o registro editorial confiable.
- Una edición completada no debe presentar una llamada a inscripción como si siguiera abierta.
- `legacy-url` puede conservar una página histórica aunque la ficha Markdown pase a ser la fuente editorial canónica.
- Los encuadres éticos y límites declarados en la fuente original se preservan de manera visible en la migración.

# `application` v1

Campos obligatorios:

- `title`
- `type: application`
- `status`
- `author`
- `application-url`
- `runtime`
- `description`

Campos opcionales:

- `year`: año de creación o publicación sólo cuando esté documentado inequívocamente.
- `version`: versión explícita de la aplicación.
- `categories`: clasificación editorial para navegación y búsqueda.
- `license`: declaración de licencia específica de la aplicación, cuando exista.
- `historical-basis`: obra, autor o tradición que sirve de base o inspiración documentada.
- `external-dependencies`: recursos externos que la aplicación carga en tiempo de ejecución.

## Convenciones

- La ficha Markdown documenta y cataloga la aplicación, pero no sustituye al ejecutable autónomo.
- `application-url` conserva la ruta estable del recurso ejecutable cuando éste ya forma parte del sitio público.
- No se infieren `year`, `version` ni licencia a partir de un footer ambiguo, una fecha de copyright compuesta o una convención visual.
- Las dependencias externas relevantes se registran para QA y preservación futura.
- Una aplicación inspirada en una fuente histórica no se describe como reconstrucción fiel o edición digital crítica salvo que exista documentación que lo sostenga.
- Los HTML/JS autónomos pueden permanecer como recursos estáticos aunque Quarto gestione su capa editorial.
