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
- `aplicaciones/ruedabruniana/rueda_luliana_bruniana_simplificada.html` → aplicación autónoma preservada como HTML/JS estático; su documentación editorial se integra en `aplicaciones/index.md` en ALEVI-WEB-0007.
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
- La página histórica declaraba originalmente `Todos los derechos reservados`; por instrucción autoral expresa posterior, desde ALEVI-WEB-0008 *La Muerte de Nicanor* pasa a `CC BY-NC-ND 4.0` tanto en su fuente Markdown como en la ruta histórica.
- `/cuentos/muertenicanor.html` permanece como URL histórica de compatibilidad.
- Poesía, ensayo y teatro continúan pendientes en este checkpoint.

## ALEVI-WEB-0006 — Talleres

Estado: cerrado en `48b15ab2e7ba58db851864f6ce7770c2ef364f03` tras gate técnico y QA visual.

- `talleres/imaginacion-activa-2026.md` → fuente editorial Markdown de la edición realizada los días 14 y 21 de marzo de 2026.
- `talleres/index.md` → catálogo de talleres basado en listing Quarto.
- `workshop` v1 queda fijado en `_project/CONTENT_SCHEMA.md`.
- La ficha separa `status: published` de `event-status: completed` para distinguir publicación editorial de vigencia del evento.
- Se preservan modalidad online/en vivo, dos sesiones de 90–120 minutos y el encuadre ético del programa histórico.
- La nueva ficha no presenta una llamada a inscripción porque la edición ya concluyó.
- `/programas/imaginacionactiva.html` se conserva como URL histórica de compatibilidad.

## ALEVI-WEB-0007 — Aplicaciones

Estado: cerrado en `5f12b2da20bcc35cde310b9b6e29d5fffb9e0630` tras gate técnico y QA visual/funcional.

- `aplicaciones/index.md` integra en una sola página el catálogo y la documentación editorial de la Rueda Bruniana.
- La arquitectura final no conserva una ficha pública separada, evitando una capa de navegación innecesaria y problemas de retorno observados durante `quarto preview`.
- La aplicación ejecutable permanece intacta en `/aplicaciones/ruedabruniana/rueda_luliana_bruniana_simplificada.html`.
- `application` v1 queda fijado en `_project/CONTENT_SCHEMA.md`.
- Se documentan Tailwind CSS CDN y Google Fonts como dependencias externas visibles en el HTML.
- No se fija año, versión ni licencia sin una declaración inequívoca de la aplicación.

## ALEVI-WEB-0008 — Expansión de Literatura

Estado: implementado en `quarto-v2`; pendiente de gate local, render y QA visual.

- `67e3c3581b492815d9763f20a6682ff3abee5dd3` fija la política literaria `CC BY-NC-ND 4.0` y actualiza *La Muerte de Nicanor*.
- El flujo de ingestión se hace primero en la bóveda canónica de Obsidian y sólo después se deriva al repositorio público.
- Fuente canónica de *Business Hotel*: `Obsidian/Vault/Escritura/01 - Obras/Narrativa/Business Hotel/00 - Business Hotel.md`.
- Fuente canónica de *Sobre la ficción y la invención*: `Obsidian/Vault/Escritura/01 - Obras/Ensayo y no ficción/Sobre la ficción y la invención/00 - Sobre la ficción y la invención.md`.
- `literatura/narrativa/business-hotel.md` → nuevo cuento público derivado del Markdown canónico.
- `literatura/ensayo/sobre-la-ficcion-y-la-invencion.md` → primer ensayo público, con 14 notas al pie conservadas.
- *Business Hotel* registra el rango `2012–2018` como `year: 2012` + `year-end: 2018`; no se interpreta como `revision-year`.
- *Sobre la ficción y la invención* no recibe año porque la fuente canónica no documenta una fecha.
- `essay` v1 queda fijado en `_project/CONTENT_SCHEMA.md`.
- `literatura/index.md` incorpora dos cuentos y un ensayo.
- `_quarto.yml` incorpora `literatura/ensayo/*.md` al render.
- Las tres piezas literarias públicas actuales usan `CC BY-NC-ND 4.0`.
- Los PDFs privados de origen no se incorporan al repositorio público; la derivación pública es textual y editorial.
- No se modifica `main`, Pages, DNS ni dominio.

## Arquitectura objetivo

- `musica/` — colección editorial activa.
- `literatura/` — colección editorial activa; Narrativa: dos cuentos; Ensayo: un ensayo.
- `talleres/` — colección editorial activa; primera edición archivada.
- `investigacion/` — landing activa; colección editorial pendiente.
- `aplicaciones/` — colección editorial activa; primera aplicación catalogada y ejecutable autónomo preservado.
- `_project/` — activa.

## Restricción de publicación

No modificar Pages, DNS, dominio ni `main` durante esta fase. Todo trabajo continúa en `quarto-v2` hasta superar QA editorial, render, enlaces y recursos.
