---
title: "Aplicaciones"
description: "Instrumentos y aplicaciones digitales de Alevi Peña."
page-layout: full
---

::: {.section-intro}
<p class="eyebrow">Laboratorio digital</p>

Aplicaciones e instrumentos interactivos vinculados con investigación, memoria, creación y experimentación.
:::

::: {.application-summary}
## Rueda Bruniana: *De Umbris Idearum*

**Aplicación interactiva autónoma.** Instrumento de experimentación combinatoria y mnemotécnica inspirado en *De Umbris Idearum* de Giordano Bruno. La aplicación conserva su HTML/JS independiente y se abre fuera del layout de Quarto.

<a href="/aplicaciones/ruedabruniana/rueda_luliana_bruniana_simplificada.html" class="btn-alevi" target="_blank" rel="noopener">Abrir Rueda Bruniana</a>
:::

## Qué implementa

La interfaz dispone cinco ruedas concéntricas que pueden girarse de forma independiente. Los anillos trabajan con conjuntos latino, griego, hebreo, rúnico y zodiacal y se alinean bajo un indicador central para producir combinaciones.

La aplicación incorpora además:

- un panel de correspondencias asociado a la combinación activa;
- un glosario consultable de símbolos y alfabetos;
- controles para producir nuevas combinaciones y guardar resultados dentro de la propia interfaz;
- una capa sonora activable desde la aplicación;
- un panel de lectura titulado *El Tratado*.

## Alcance editorial

Esta herramienta debe entenderse como **instrumento digital inspirado en materiales brunianos y combinatorios**, no como facsímil, reconstrucción histórica exacta ni edición crítica digital de *De Umbris Idearum*.

## Requisitos técnicos

La aplicación se ejecuta en un navegador web moderno. El HTML carga **Tailwind CSS** desde CDN y tipografías de **Google Fonts**, por lo que parte de su presentación depende de recursos externos disponibles en red.

::: {.application-note}
**Preservación.** La ruta ejecutable se mantiene estable en `/aplicaciones/ruedabruniana/rueda_luliana_bruniana_simplificada.html`. ALEVI-WEB-0007 no modifica el código de la aplicación.
:::
