---
title: "Rueda Bruniana: De Umbris Idearum"
type: application
status: published
author: "Alevi Peña"
application-url: "/aplicaciones/ruedabruniana/rueda_luliana_bruniana_simplificada.html"
runtime: "Navegador web"
description: "Instrumento interactivo de ruedas concéntricas y correspondencias simbólicas inspirado en De Umbris Idearum de Giordano Bruno."
historical-basis: "Giordano Bruno — De Umbris Idearum (1582)"
external-dependencies:
  - "Tailwind CSS CDN"
  - "Google Fonts"
categories: [aplicaciones, memoria, hermetismo, combinatoria]
---

::: {.application-summary}
**Aplicación interactiva autónoma.** La Rueda Bruniana funciona como una herramienta de experimentación combinatoria y mnemotécnica inspirada en *De Umbris Idearum* de Giordano Bruno. La ficha que estás leyendo pertenece al catálogo Quarto; la aplicación continúa ejecutándose como un HTML/JS independiente.

[Abrir la aplicación](/aplicaciones/ruedabruniana/rueda_luliana_bruniana_simplificada.html){.btn-alevi target="_blank"}
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

La separación entre ficha y ejecutable es deliberada:

- Quarto gestiona título, descripción, catálogo, navegación y contexto editorial;
- el HTML/JS preserva la experiencia interactiva sin depender del layout del sitio;
- futuras revisiones del catálogo no requieren reescribir la aplicación.

## Requisitos técnicos

La aplicación se ejecuta en un navegador web moderno. El HTML carga **Tailwind CSS** desde CDN y tipografías de **Google Fonts**, por lo que parte de su presentación depende de recursos externos disponibles en red.

::: {.application-note}
**Preservación.** La ruta ejecutable se mantiene estable en `/aplicaciones/ruedabruniana/rueda_luliana_bruniana_simplificada.html`. En ALEVI-WEB-0007 no se modifica el código de la aplicación.
:::
