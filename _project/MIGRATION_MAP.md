# Migration Map

## Baseline

- Repositorio: `lachenmann/webdealevi`
- Rama pública actual: `main`
- Baseline: `780d9fcac3d4ae5aa1941a755299b8d13fa45428`
- Rama de migración: `quarto-v2`

## Recursos preservados

- `partituras/*.pdf` → recursos estáticos y URLs históricas conservadas.
- `audio/cienaga.mp3` → recurso estático asociado a *Ciénaga*.
- `cuentos/muertenicanor.html` → preservado durante la transición; pendiente de migración editorial.
- `programas/imaginacionactiva.html` → preservado durante la transición; pendiente de migración editorial.
- `aplicaciones/ruedabruniana/rueda_luliana_bruniana_simplificada.html` → aplicación autónoma preservada como HTML/JS estático.
- `_legacy/index.html` → copia exacta de la antigua portada, fuera de la raíz de render de Quarto.

## ALEVI-WEB-0003 — Música

Estado: cerrado técnicamente en `162a011924d039a659f78017d43163a720842eb6`.

- `musica/index.md` → landing y listing automático.
- `musica/obras/*.md` → nueve fichas editoriales de obras ya públicas.
- PDFs → no se mueven ni se renombran.
- La navegación Quarto incorpora `Música`.
- El catálogo se ordena explícitamente de obra más reciente a más antigua sin inventar fechas completas.
- *Ciénaga* enlaza además el MP3 local y el registro audiovisual ya existente.

## ALEVI-WEB-0004 — Sistema visual y navegación

Estado: implementado en `quarto-v2`, pendiente de gate local.

- `styles.css` pasa de bootstrap mínimo a sistema visual v1.
- La portada deja de mostrar lenguaje interno de migración y pasa a funcionar como archivo autoral.
- Navbar global: Inicio, Música, Literatura, Investigación, Talleres y Aplicaciones.
- Se crean landings mínimas para las cuatro áreas todavía no migradas editorialmente.
- Se incorpora footer común sin declaración global de licencia.
- `_project/VISUAL_SYSTEM.md` documenta principios, tokens y componentes.

## Arquitectura objetivo

- `musica/` — colección editorial activa.
- `literatura/` — landing activa; colección editorial pendiente.
- `talleres/` — landing activa; colección editorial pendiente.
- `investigacion/` — landing activa; colección editorial pendiente.
- `aplicaciones/` — landing activa y aplicación autónoma preservada.
- `_project/` — activa.

## Restricción de publicación

No modificar Pages, DNS, dominio ni `main` durante esta fase. Todo trabajo continúa en `quarto-v2` hasta superar QA editorial, render, enlaces y recursos.
