# Esferas Microtonal — prototipo de fuente propia

## Cambio de referencia G1 — GNU LilyPond / Emmentaler

Por instrucción posterior del autor, **las tres matrices madre se tomarán
directamente de los contornos reales de GNU LilyPond** (Emmentaler/Feta):
bemol, becuadro y sostenido. El primer estudio independiente de G1 se
preserva solamente como antecedente y **no es la referencia tipográfica
vigente**.

- [Decisión, genealogía y licencia GPL con excepción de fuentes](docs/EM-G1-002-LILYPOND_REFERENCIA.md).
- [Generador derivado del OTF original de LilyPond](v02/build_lilypond_mothers.py).
- [Pruebas de correspondencia geométrica y avisos](v02/test_lilypond_mothers.py).
- [Avisos y licencias originales de LilyPond](v02/upstream/LICENSE).

Para probar el nuevo G1 con LilyPond instalado y un OTF legítimo,
usa un archivo original llamado **emmentaler-20.otf**:

```bash
cd aplicaciones/monocordio/fuente-propia/v02
python3 build_lilypond_mothers.py --source /ruta/al/emmentaler-20.otf --out build/EsferasMicrotonal-LilyPond-G1.ttf
python3 preview_mothers.py --origin lilypond --font build/EsferasMicrotonal-LilyPond-G1.ttf --out build/LilyPond-G1.png
open build/LilyPond-G1.png
```

**Importante:** las madres obtenidas constituyen una **obra tipográfica
derivada** con atribución a LilyPond; sus contornos NO deben describirse
como originales independientes. No cambia la semántica matemática,
ni el código del monocordio, ni la fuente oficial Leland actualmente en uso.

## G1-001 — Bocetos independientes anteriores (histórico, sustituido)

**El estudio siguiente se conserva para rastreabilidad, pero fue reemplazado
como referencia por EM-G1-002.**

## G1 — Primeras matrices redibujadas (autorizado G0, 10-10-2026)

**Los principios y la gramática documental v0.2 fueron aprobados por el autor.**
Se han generado desde cero **solamente los tres signos madre**:
`flat` (E260), `natural` (E261) y `sharp` (E262).

Los archivos v0.2 están aislados en `v02/`:

- [Informe G1 y alcance](docs/EM-G1-001-MATRICES_v0.2.md)
- [Generador original de las tres matrices](v02/build_mothers.py)
- [Especímen a tamaños reales de pentagrama](v02/preview_mothers.py)
- [Pruebas de contornos, pesos y códigos](v02/test_mothers.py)

Para reproducir el primer espécimen en Mac:

```sh
cd aplicaciones/monocordio/fuente-propia/v02
python3 build_mothers.py --out build/EsferasMicrotonal-Mothers-v02.ttf
python3 -m unittest -v test_mothers.py
python3 preview_mothers.py --font build/EsferasMicrotonal-Mothers-v02.ttf --out build/matrices-v02.png
open build/matrices-v02.png
```

**Estado:** `G1_BOCETOS_GENERADOS_PENDIENTES_DE_REVISION_VISUAL`.
Esta etapa no incluye derivaciones microtonales ni modifica el generador
`build_font.py` de v0.1, el monocordio publicado ni las ramas PR #4/#6.
No se distribuyen archivos de fuente como producto terminado.

## Diseño v0.2 — Documentación formalizada

La revisión del autor de la **muestra de v0.1** identifica exceso de
grosor, dimensión y superficies negras y exige corregir el becuadro.
La v0.2 se plantea como una **gramática derivativa de signos** a partir
de sostenido, bemol y becuadro, no como una colección de pictogramas.

**Documentos de referencia para iniciar el redibujo (todos en estado
BORRADOR y sin adopción automática):**

1. [Manifiesto de diseño v0.2](docs/MANIFIESTO_DE_DISENO_v0.2.md)
   — criterios estéticos, matrices madre y límites de interpretación.
2. [Gramática de trazos v0.2](docs/GRAMATICA_DE_TRAZOS_v0.2.md)
   — operaciones, retícula del sostenido, valores exactos y separación
   entre morfología y semántica.
3. [Protocolo QA v0.2](docs/PROTOCOLO_QA_v0.2.md)
   — tamaños de pauta, tinta, legibilidad y puertas de aceptación.
4. [Registro de decisiones v0.2](docs/REGISTRO_DECISIONES_v0.2.md)
   — criterios expresos del autor, propuestas y cuestiones abiertas.
5. [Registro morfológico v0.2 (JSON)](docs/REGISTRO_MORFOLOGICO_v0.2.json)
   — 14 entradas exactas, con estados y primitivas auditables.

La familia ascendente propuesta es:

`+⅛ = V_L + H_S`; `+¼ = V_L + H_S + H_I`;
`+⅜ = V_L + V_R + H_S`;
`+½ = V_L + V_R + H_S + H_I`;
`+¾ = +½ + V_X`.

**Esta estructura es una retícula de formas, NO una fórmula de
conversión de número de trazos a cents.** En el perfil de tono de
200 cents, cada fracción tiene su valor exacto
`200 × numerador / denominador` en cents.

El **becuadro** debe rediseñarse con dos astas desfasadas y dos
travesaños, evitando la figura defectuosa de v0.1. Su función real es
**cancelación contextual** de una alteración, no una frecuencia cero.

Para realizar solamente las **pruebas de consistencia documental**:

```bash
python3 -m unittest -v test_design_v02.py
```

El generador `build_font.py` sigue siendo **la v0.1**; estos documentos
**no han modificado los contornos del TTF ni el grabado del monocordio**.
Los signos fraccionarios negativos y la familia de sextos/doceavos
todavía no tienen una gramática gráfica aprobada.

**Relación con NMA:** la propuesta matemática abierta [Notación Microtonal
Abierta](https://github.com/lachenmann/webdealevi/pull/6) proporciona
un modelo de perfiles y exactitud; los contornos de esta fuente son una
implementación tipográfica independiente.

## Objetivo y procedencia

Construir una tipografía TTF original para el laboratorio **La música de las esferas**, basada en **conceptos musicales generales** y no en los contornos tipográficos ajenos.

Referencia histórica de terminología: Christian Texier, *MIDIDESI* (1993–2002), familia **Tempera**, catálogo de fracciones de tono, pp. 18–19. El documento contiene una tabla de modificaciones de tono y una aproximación de pitch-bend MIDI de 0 a 127 (centro 64). **Las curvas y archivos de MIDIDESI no se han extraído ni transformado**, y su mapa de teclado no se ha reutilizado.

Esta fuente se genera exclusivamente mediante polígonos, rectas, trazos engrosados y contornos calculados originalmente por `build_font.py`. No mezcla código fuente o font data de otras familias.

## Cobertura del prototipo técnico v0.1 (no aprobada como tipografía final)

| Fracción | Desviación exacta | Código |
|---|---:|---|
| Bemol (−1/2 tono) | −100 cents | SMuFL U+E260 |
| Becuadro | Cancelación contextual (en el prototipo v0.1: indicador 0) | SMuFL U+E261 |
| Sostenido (+1/2 tono) | +100 cents | SMuFL U+E262 |
| Bemol inverso abierto Stein–Zimmermann (−1/4) | −50 cents | SMuFL U+E280 |
| Medio sostenido Stein–Zimmermann (+1/4) | +50 cents | SMuFL U+E282 |
| Sextos ±1/6 | ±100/3 cents | U+F0001 y U+F0002 |
| Octavos ±1/8 | ±25 cents | U+F0003 y U+F0004 |
| Doceavos ±1/12 | ±50/3 cents | U+F0005 y U+F0006 |

**Los códigos U+F0001–U+F0006 son personalizados, no símbolos SMuFL ni correspondencias de MIDIDESI.** El uso de valores suplementarios de la Private Use Area minimiza la posibilidad de colisión con los códigos SMuFL (que están en el BMP). Algunas aplicaciones de partituras antiguas no soportan directamente estos códigos; están dirigidos inicialmente al navegador web.

Las formas de cuarto de tono Stein–Zimmermann son convencionales: el bemol inverso mantiene la panza abierta y el asta a la derecha. Los diseños de sextos, octavos y doceavos son **extensiones geométricas originales** con semántica explícita en el manifiesto JSON.

## Construcción local

Requisitos: Python 3.10+ y `fonttools`; opcionalmente `pillow` para una imagen.

```sh
python3 -m pip install fonttools pillow
cd aplicaciones/monocordio/fuente-propia
python3 build_font.py --out build/EsferasMicrotonal-Prototype.ttf
python3 -m unittest -v test_font.py
python3 preview_font.py --font build/EsferasMicrotonal-Prototype.ttf --out build/vista.png
```

Esto genera localmente **el TTF y un manifiesto JSON**; el TTF no se incorpora a Git. Las pruebas de CI generan el TTF de forma transitoria y publican **solo la previsualización PNG y el manifiesto**, nunca un archivo tipográfico binario.

## Límites editoriales

- El TTF es una primera prueba de ingeniería tipográfica, **no es todavía la tipografía oficial del proyecto**.
- No reemplaza la actual elección Leland/Ekmelos ni modifica el módulo `notacion-glyphs.mjs`.
- La orientación del usuario es software libre **GNU**. Se propone GPL-3.0-or-later
  con la excepción oficial de incrustación de fuentes cuando la titularidad
  y el aviso de copyright se hayan revisado; el nombre definitivo y la
  publicación tipográfica todavía no están aprobados.
- Para extender el catálogo de fracciones de MIDIDESI, deben diseñarse nuevas reglas de construcción independientes; no debe importarse ni calcarse su tipografía ni reproducirse su arreglo gráfico protegido.

Fuentes públicas de control: SMuFL (W3C Music Notation Community Group); fuentes originales del catálogo de Tempera disponibles en la documentación histórica del autor del proyecto.
