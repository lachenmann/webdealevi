# EM-G2-001 — Variantes microtonales tomadas de GNU LilyPond

**Fase:** G2, primer tramo / investigación tipográfica y espécimen  
**Estado:** `G2_VARIANTES_IMPLEMENTADAS_EN_ESTUDIO_PENDIENTES_DE_REVISION`  
**Fecha:** 2026-10-10  
**Fundamento:** G1 Emmentaler/Feta aprobado expresamente por el autor.  
**Alcance:** catálogo experimental de contornos auténticos; no una nueva fuente publicada.

## 1. Hipótesis de trabajo

Una fuente microtonal coherente debe aprovechar las variantes ya diseñadas
por GNU LilyPond. Nuestra aportación no es volver a inventar
el medio sostenido o el bemol inverso, sino establecer un **registro
matemáticamente exacto** y diseñar, a posteriori, las alteraciones
que no puedan identificarse inequívocamente con signos históricos.

Los signos de G2 tienen dos estados claramente distintos:

- **G1_APROBADO**: madres `flat`, `natural`, `sharp`.
- **G2_PENDIENTE**: signos históricos derivados, cuyos contornos ya están
  convertidos, pero cuya aprobación musical/visual requiere revisión.

## 2. Catálogo inicial verificado por nombre de fuente

| Nombre del estudio | Glifo original Emmentaler | Valor en perfil de tono = 200 cents | Código del estudio | Estado |
| --- | --- | ---: | --- | --- |
| Bemol | `accidentals.flat` | −100 cents | SMuFL E260 | **G1 aprobado** |
| Becuadro | `accidentals.natural` | cancelación contextual | SMuFL E261 | **G1 aprobado** |
| Sostenido | `accidentals.sharp` | +100 cents | SMuFL E262 | **G1 aprobado** |
| Bemol inverso abierto | `accidentals.mirroredflat` | −50 cents | SMuFL E280 | G2 candidato |
| Medio sostenido (dos travesaños) | `accidentals.sharp.slashslash.stem` | +50 cents | SMuFL E282 | G2 candidato |
| Tres cuartos sostenido | `accidentals.sharp.slashslash.stemstemstem` | +150 cents | SMuFL E283 | G2 candidato |
| Tres cuartos bemol de LilyPond | `accidentals.flatflat.slash` | −150 cents | PUA F0020 | **Referencia histórica**, no afirmar equivalencia con E281 |
| Medio sostenido (un travesaño) | `accidentals.sharp.slash.stem` | **+50 cents**, no +25 | PUA F0021 | **Referencia histórica**, no asignar +⅛ |

Las asignaciones SMuFL son del **TTF derivado de estudio**, no una
afirmación de que el OTF de LilyPond use internamente esos puntos Unicode.

Los códigos privados F0020 y F0021 solo existen para presentar
simultáneamente variantes en la lámina. **No están normalizados en SMuFL**
y no deben incorporarse a música publicada sin un perfil explícito.

## 3. Advertencia documental: el octavo del autor frente a LilyPond

La propuesta del autor representa el octavo ascendente mediante una
**asta vertical y un único travesaño superior**, obtenidos al
eliminar la segunda asta y uno de los travesaños del sostenido.

Al inspeccionar el código METAFONT, se encontró
`sharp.slash.stem`, definido por los autores de LilyPond como
**medio sostenido de un solo travesaño**: se utiliza para un
**cuarto de tono**, no para un octavo de tono.

Por consiguiente:

- El diseño de una sola barra **no se adoptará automáticamente** como
  +25 cents ni como signo nuevo sin marcar la diferencia de sistema.
- Escribir la figura idéntica con sentidos +25 y +50 cents dentro
  del mismo perfil sería ambiguo, aunque ambos valores sean exactos.
- Se debe estudiar una diferenciación mínima adicional o reservar
  una descripción textual explícita `+1/8 tono (25 cents)`.
- La geometría y la semántica se registran por separado en cada
  perfil: un cambio de estilo no puede alterar las frecuencias.

**Estado de octavos:** `PENDIENTE_DE_DISENO_Y_CONVENCION`. G2-001
todavía no contiene un glifo definitivo para ±1/8.

## 4. Otros valores aún abiertos

**Tres octavos (+75 cents):** construcción morfológica propuesta
`V_L + V_R + H_S`. No se ha verificado como signo histórico ni
se ha añadido al estudio G2-001.

**Sextos (±100/3 cents) y doceavos (±50/3 cents):** pertenecen a una
retícula de fracciones de tono distinta de las subdivisiones
binarias del sostenido. La construcción visual requerirá un
estudio separado, no una sustitución por figuras negras aisladas.

**Tres cuartos de tono descendentes:** el glifo `flatflat.slash`
de LilyPond se conserva como referencia con el nombre correcto.
No se asume equivalencia gráfica automática con
`accidentalThreeQuarterTonesFlatZimmermann` (E281), que es un
glifo SMuFL diferente. Hasta aprobarse se utiliza código privado.

## 5. Procedencia legal de los contornos

La fuente de origen real es **GNU LilyPond Emmentaler/Feta**.

- Opción de licencia utilizada: **GNU GPL-3.0-or-later con
  excepción de incrustación de fuentes** publicada por LilyPond.
- Se conservan nombres originales, copyright, aviso de
  derivación y textos completos de licencia.
- Los contornos son **derivados**, no «originales desde cero».
- El paso CFF a TrueType es una conversión de formato con
  precisión geométrica comprobable.
- Ningún contorno de MIDIDESI/Tempera forma parte de la fuente.
- No se redistribuyen los binarios fuente originales ni el TTF
  derivado en este tramo; solo generadores, manifiesto y PNG.

Fuente fijada para la compilación de control: `emmentaler-20.otf`
de GNU LilyPond 2.24.3. SHA-256:

`aa01667241dc9ff658c41d3b822aa2735f74dfe09f51d40e7a24fde5b6253eb6`

Ver [EM-G1-002](./EM-G1-002-LILYPOND_REFERENCIA.md).

## 6. Archivos reproducibles

- `v02/build_lilypond_g2.py`: obtiene del OTF legítimo las
  ocho variantes; copia fielmente sus proporciones y registra
  fracciones exactas en el manifiesto.
- `v02/test_lilypond_g2.py`: verifica genealogía de cada contorno,
  valores en cents, colisiones de códigos y advertencia de octavos.
- `v02/preview_lilypond_g2.py`: lámina que representa el mismo
  repertorio sobre pautas de tamaño real.

Uso local:

```sh
cd aplicaciones/monocordio/fuente-propia/v02
python3 build_lilypond_g2.py --source /ruta/a/emmentaler-20.otf \
  --out build/EsferasMicrotonal-G2-LilyPond.ttf
LILYPOND_FONT_SOURCE=/ruta/a/emmentaler-20.otf \
  python3 -m unittest -v test_lilypond_g2.py
python3 preview_lilypond_g2.py \
  --font build/EsferasMicrotonal-G2-LilyPond.ttf \
  --out build/Esferas-G2.png
```

La validación geométrica no equivale a la evaluación tipográfica de
tamaños pequeños o de lectura musical. G2 requiere aprobación visual
del autor antes de implementar derivados originales.

## 7. Puertas de progreso

| Control | Resultado esperado |
| --- | --- |
| G1 | Tres madres **aprobadas** |
| G2.1 | Localizar variantes reales LilyPond y preservar licencia |
| G2.2 | Mapeo exacto sin confundir 1/8 con un signo histórico de 1/4 |
| G2.3 | Convertir contornos y comprobar cajas |
| G2.4 | Presentar lámina a escalas reales |
| G2.5 | Decidir iconografía original para octavos y tres octavos |
| G2.6 | Aprobar signos antes de publicar TTF |

**La aprobación de G1 no implica aprobación de G2.**
No se modifica el monocordio web ni se fusionan sus PR.
