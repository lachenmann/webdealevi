# EM-G2-002 — Aprobación visual de las variantes históricas de LilyPond

**Fecha:** 2026-10-10  
**Proyecto:** Esferas Microtonal v0.2  
**Estado:** `G2.1_APROBADO_VISUALMENTE`  
**Fuente aprobada para el estudio:** GNU LilyPond, Emmentaler/Feta  
**Alcance:** exclusivamente las ocho formas expuestas en la lámina G2  
**PR:** [Esferas Microtonal #5](https://github.com/lachenmann/webdealevi/pull/5)

## I. Acto de aprobación

Tras recibir la lámina `esferas-lilypond-g2.png` y los vínculos a
las fuentes de trabajo, el autor manifestó: **«Apruebo las fuentes»**.

Se registra como aprobación **de las formas tipográficas presentadas**,
que proceden de Emmentaler/Feta, y autorización para conservarlas como
base visual de Esferas Microtonal. **No** constituye aprobación de nuevas
semánticas históricas no documentadas, de códigos Unicode inventados, del
estándar NMA 1.0, de los signos aún no diseñados, de un TTF comercial o
público, ni de fusionar el PR.

## II. Repertorio aprobado y su alcance

| Glifo del estudio | Fuente LilyPond | Función en el perfil explícito | Estado |
| --- | --- | --- | --- |
| `flat` | `accidentals.flat` | Bemol convencional (−100 cents) | G1, confirmado |
| `natural` | `accidentals.natural` | Cancelación contextual | G1, confirmado |
| `sharp` | `accidentals.sharp` | Sostenido convencional (+100 cents) | G1, confirmado |
| `quarter_flat_stein` | `accidentals.mirroredflat` | Bemol inverso abierto, −50 cents | Forma G2 aprobada |
| `quarter_sharp_stein` | `accidentals.sharp.slashslash.stem` | Medio sostenido, +50 cents | Forma G2 aprobada |
| `three_quarters_sharp_stein` | `accidentals.sharp.slashslash.stemstemstem` | Sostenido de ¾, +150 cents | Forma G2 aprobada |
| `three_quarters_flat_lilypond` | `accidentals.flatflat.slash` | Figura histórica de −¾ tono | **Forma de referencia aceptada**, todavía no registrada como E281 |
| `quarter_sharp_one_beam_lilypond` | `accidentals.sharp.slash.stem` | Variante histórica de medio sostenido (+50 cents) | **Forma de referencia aceptada**, **NO** octavo de tono |

Los últimos dos glifos conservan códigos provisionales de comparación
`U+F0020` y `U+F0021`. No se declaran símbolos SMuFL ni signos
definitivos del alfabeto NMA.

## III. Consecuencias para la gramática

Se mantienen como principios aprobados:

1. Emmentaler/Feta proporciona el lenguaje tipográfico de base.
2. La forma del becuadro es la original de LilyPond, sin redibujo propio.
3. Las derivaciones utilizarán una gramática explícita de trazos,
   aplicada sobre signos tipográficos con genealogía documentada.
4. Las fracciones y sus cents se conservarán racionalmente, con perfil
   de tono temperado definido expresamente como 200 cents.
5. Ningún contorno puede recibir silenciosamente un significado
   incompatible con otro ya documentado.

**Colisión histórica pendiente:** el glifo de una sola asta y un solo
travesaño de LilyPond es un medio sostenido (+¼), aunque recuerde
nuestra hipótesis para +⅛ (25 cents). No se aprueba utilizarlo como
octavo de tono. El candidato +⅛ permanece `EN_ESTUDIO`.

## IV. Próximas unidades y puertas

- **G2.1 — selección y validación visual de variantes LilyPond: APROBADA.**
- **G2.2 — inventario de vacíos** (±⅛, ±⅙, ±¹⁄₁₂, +⅜ y otros que
  se justifiquen): pendiente de diseño, prototipos y revisión.
- **G2.3 — alineación óptica, lectura a escala real e impresión:** pendiente.
- **G4/G5 — conformidad tipográfica completa y lectura a ciegas:** pendientes.
- **G6 — publicación GNU de fuente derivada con atribuciones:** pendiente.
- **G7 — sustitución de la tipografía en el monocordio:** **NO autorizada**.

## V. Integridad, licencia y preservación

El repertorio aprobado es derivado de la fuente Emmentaler 2.24.3
producida por GNU LilyPond, bajo la opción declarada por sus autores
de GPL-3.0-or-later con excepción de incrustación de fuentes.

El generador `v02/build_lilypond_g2.py` conserva:
nombre y SHA-256 del OTF original, nombres de los glifos fuente,
códigos de estudio, fracciones exactas, atribuciones y licencia.

La fuente derivada sigue siendo **un prototipo**, no un TTF publicado.
Leland continúa siendo la familia musical del monocordio. El PR #5
permanece en borrador y sin fusionar con su base; `main` no se modifica.

**Próxima acción admisible:** elaborar propuestas para los signos que
faltan con una genealogía y semántica inequívocas y presentarlas
para revisión. La presente aprobación no las ratifica de antemano.
