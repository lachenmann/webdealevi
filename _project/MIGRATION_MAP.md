# Migration Map

## Baseline

- Repositorio: `lachenmann/webdealevi`
- Rama pública actual: `main`
- Baseline: `780d9fcac3d4ae5aa1941a755299b8d13fa45428`
- Rama de migración: `quarto-v2`

## Recursos preservados

- `partituras/*.pdf` → recursos estáticos y URLs históricas conservadas.
- `audio/cienaga.mp3` → recurso estático asociado a *Ciénaga*.
- `cuentos/muertenicanor.html` → preservado como ruta histórica de compatibilidad; su fuente editorial canónica pasa a Markdown en ALEVI-WEB-0005.
- `programas/imaginacionactiva.html` → preservado como ruta histórica de compatibilidad; su fuente editorial canónica pasa a Markdown en ALEVI-WEB-0006.
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

Estado: cerrado en `c189b266785c7546154358b7879ed411d39698d2` tras gate técnico y QA visual.

- `styles.css` pasa de bootstrap mínimo a sistema visual v1.
- La portada deja de mostrar lenguaje interno de migración y pasa a funcionar como archivo autoral.
- Navbar global: Inicio, Música, Literatura, Investigación, Talleres y Aplicaciones.
- Se crean landings mínimas para las cuatro áreas todavía no migradas editorialmente.
- Se incorpora footer común sin declaración global de licencia.
- `_project/VISUAL_SYSTEM.md` documenta principios, tokens y componentes.

## ALEVI-WEB-0005 — Literatura

Estado: cerrado en `10d66547a59e05137099b605aaae01e5243a732c` tras gate técnico y QA visual.

- `literatura/narrativa/la-muerte-de-nicanor.md` → fuente editorial Markdown del cuento ya público.
- `literatura/index.md` → catálogo literario basado en listing Quarto.
- `short-story` v1 queda fijado en `_project/CONTENT_SCHEMA.md`.
- Se conservan `year: 2014` y `revision-year: 2017` según la pieza histórica.
- La declaración específica `Todos los derechos reservados` de la página del cuento se conserva como licencia de la pieza; no se hereda la antigua declaración global contradictoria del sitio.
- `/cuentos/muertenicanor.html` permanece intacto como URL histórica de compatibilidad.
- Poesía, ensayo y teatro continúan pendientes; no se crean piezas ficticias ni placeholders editoriales individuales.

## ALEVI-WEB-0006 — Talleres

Estado: implementado en `quarto-v2`, pendiente de gate local y QA visual.

- `talleres/imaginacion-activa-2026.md` → fuente editorial Markdown de la edición realizada los días 14 y 21 de marzo de 2026.
- `talleres/index.md` → catálogo de talleres basado en listing Quarto.
- `workshop` v1 queda fijado en `_project/CONTENT_SCHEMA.md`.
- La ficha separa `status: published` de `event-status: completed` para distinguir publicación editorial de vigencia del evento.
- Se preservan modalidad online/en vivo, dos sesiones de 90–120 minutos y el encuadre ético del programa histórico.
- La nueva ficha no presenta una llamada a inscripción porque la edición ya concluyó.
- `/programas/imaginacionactiva.html` se conserva como URL histórica de compatibilidad.

## Arquitectura objetivo

- `musica/` — colección editorial activa.
- `literatura/` — colección editorial activa; Narrativa iniciada.
- `talleres/` — colección editorial activa; primera edición archivada.
- `investigacion/` — landing activa; colección editorial pendiente.
- `aplicaciones/` — landing activa y aplicación autónoma preservada.
- `_project/` — activa.

## Restricción de publicación

No modificar Pages, DNS, dominio ni `main` durante esta fase. Todo trabajo continúa en `quarto-v2` hasta superar QA editorial, render, enlaces y recursos.
