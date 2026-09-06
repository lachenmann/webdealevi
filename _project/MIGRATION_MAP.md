# Migration Map

## Baseline

- Repositorio: `lachenmann/webdealevi`
- Rama pública actual: `main`
- Baseline: `780d9fcac3d4ae5aa1941a755299b8d13fa45428`
- Rama de migración: `quarto-v2`

## Recursos actuales preservados

- `partituras/*.pdf` → recursos estáticos; posteriormente referenciados desde páginas de obras musicales.
- `audio/cienaga.mp3` → recurso estático asociado a *Ciénaga*.
- `cuentos/muertenicanor.html` → se conserva durante la transición; después se migrará editorialmente a Markdown manteniendo compatibilidad de URL o redirección.
- `programas/imaginacionactiva.html` → se conserva durante la transición; después se migrará a Markdown.
- `aplicaciones/ruedabruniana/rueda_luliana_bruniana_simplificada.html` → aplicación autónoma preservada como HTML/JS estático.

## Arquitectura objetivo

- `musica/`
- `literatura/`
- `talleres/`
- `investigacion/`
- `aplicaciones/`
- `_project/`

## Restricción de ALEVI-WEB-0002

Sólo se crea el esqueleto Quarto y documentación de migración. No se sustituye todavía el contenido editorial del sitio actual ni se publica la rama.
