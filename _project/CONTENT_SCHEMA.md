# Content Schema

Estado: esquema incremental. El subesquema `musical-work` queda fijado en ALEVI-WEB-0003; las demás familias siguen provisionales hasta su primera migración real.

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
