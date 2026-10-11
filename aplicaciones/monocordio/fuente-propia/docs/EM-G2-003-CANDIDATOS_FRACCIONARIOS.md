# EM-G2-003 — Exploración de octavos, sextos, doceavos y tres octavos

**Proyecto:** Esferas Microtonal v0.2  
**Fecha:** 2026-10-10  
**Fase:** G2.2 — primer laboratorio comparativo  
**Estado:** `G2.2_CANDIDATOS_COMPILADOS_Y_COMPARADOS_NO_APROBADOS`  
**Precedentes:** G1 aprobado, G2.1 (ocho formas LilyPond) aprobado visualmente.  
**Licencia del estudio:** GPL-3.0-or-later + excepción tipográfica LilyPond para la parte derivada.

## 1. Problema de diseño

La propuesta del autor pide derivar alteraciones de signos musicales
reconocibles, mediante supresión/adición de trazos, evitando figuras
geométricas sólidas, excesivo peso óptico y consumo de tinta.

La investigación del código auténtico de LilyPond descubrió que
`accidentals.sharp.slash.stem` —una asta y un travesaño— es
históricamente una **variante de medio sostenido**, no un signo
de octavo de tono. La figura aislada **no puede reutilizarse
sin advertencia** para +25 cents en el mismo perfil.

La tarea de G2.2 consiste en ensayar **transformaciones realmente
distintas**, construidas sobre fuentes Emmentaler legítimas, sin
afirmar prematuramente que constituyan un estándar musical.

## 2. Modelo matemático exacto

El primer perfil declara que el tono de referencia vale 200 cents,
como en el temperamento igual de doce semitonos.

Para una fracción \(p/q\) de ese tono:

\[
c=200\frac pq \text{ cents},
\qquad
\frac{f}{f_0}=2^{p/(6q)}.
\]

| Fracción de tono | Cents exactos | EDO equivalente para un paso |
| --- | --- | --- |
| ±1/12 | ±50/3 | 72-EDO |
| ±1/8 | ±25 | 48-EDO |
| ±1/6 | ±100/3 | 36-EDO |
| ±3/8 | ±75 | 16-EDO (3 pasos de 48-EDO) |

Los valores se serializan como pares de enteros reducidos. Una cadena
como `33.33` es solo un redondeo para mostrar en pantalla, no
la representación canónica de un sexto de tono.

**Una forma tipográfica no tiene valor matemático intrínseco.**
El significado es una asociación `(perfil, identificador) → intervalo`.
Ni la cantidad de trazos ni la semejanza con otra grafía permiten
inferir directamente ese valor.

## 3. Geometría compartida

Las dos alternativas toman **contornos auténticos** de Emmentaler:

- **Ascendentes:** `accidentals.sharp.slash.stem`, históricamente un
  cuarto de tono; nunca se utiliza solo para representar un octavo.
- **Descendentes:** `accidentals.mirroredflat`, cuarto de tono
  descendente de la familia de bemol inverso abierto.

Al contorno original se le añaden marcas de construcción nuevas,
finas y separadas, cuyo diseño paramétrico está en
`v02/build_lilypond_g22.py`.

Las dos alternativas mantienen la misma referencia estética de
LilyPond; **no transforman material de MIDIDESI/Tempera**.

### Alternativa A — Rayas oblicuas auxiliares

Se usa una pequeña serie de trazos oblicuos adyacentes,
sin rellenos ni polígonos ornamentales macizos.

| Valor absoluto | Rayas auxiliares | Semántica |
| --- | ---: | --- |
| 1/12 de tono | 1 | 50/3 cents |
| 1/8 de tono | 2 | 25 cents |
| 1/6 de tono | 3 | 100/3 cents |
| 3/8 de tono | 4 | 75 cents |

**El conteo expresa una clasificación convencional, no adición de
intervalos.** No existe aquí una unidad fija de cents por raya.
La variante con cuatro rayas podría quedar congestionada a tamaño
real, y debe ser evaluada antes de seguir.

### Alternativa B — Terminales de horquilla

Se conserva el signo histórico de partida y se añade un pequeño
marcador de dirección y posición:

| Valor absoluto | Transformación distintiva | Semántica |
| --- | --- | --- |
| 1/12 de tono | Un terminal corto en zona superior | 50/3 cents |
| 1/8 de tono | Un terminal corto en zona inferior | 25 cents |
| 1/6 de tono | Dos terminales abiertos | 100/3 cents |
| 3/8 de tono | Dos terminales y una asta auxiliar | 75 cents |

Esta opción tiene menos trazos que A para algunas fracciones.
Su riesgo principal es confundir la posición de los terminales al
cruzar líneas del pentagrama o al imprimir a pequeño cuerpo.

## 4. Alcance del prototipo

Se generan **16 propuestas**: cuatro fracciones por dos orientaciones,
multiplicadas por las dos alternativas A/B. Todas son candidatos;
ninguna está inscrita como signo oficial SMuFL.

- Código de estudio: `U+F0100` a `U+F010F`,
  en el área privada suplementaria Unicode.
- `smufl: null`; el código no equivale a registro ni estándar.
- Cada archivo conserva el nombre y SHA-256 de la fuente original,
  el copyright LilyPond y la opción GPL con excepción.
- El TTF es un resultado **transitorio para control visual y pruebas**,
  no se incorpora al repositorio ni se entrega como fuente definitiva.
- G2.1 sigue aprobado y sin modificaciones.
- No se incorpora ningún signo nuevo al monocordio y no cambia la
  afinación ni las proporciones del instrumento.

## 5. Pruebas comparativas

El script `v02/preview_lilypond_g22.py` produce tres láminas:

1. **Familia A:** ocho glifos a gran escala y en pentagramas
   de 12 y 7 píxeles por espacio.
2. **Familia B:** las mismas pruebas, con terminales de horquilla.
3. **Matriz A/B:** las 16 formas, lado a lado, ordenadas por intervalo
   y orientación.

El script `v02/test_lilypond_g22.py` verifica fracciones,
códigos no normalizados, fidelidad de la fuente base, diferencias
de componentes, metadatos y prohibición de asignar automáticamente
un octavo al glifo histórico LilyPond de una barra.

Estas pruebas no demuestran por sí solas la **legibilidad** del dibujo.

## 6. Riesgos y condiciones de rechazo

| Riesgo | Rechazar si… |
| --- | --- |
| Colisión con grafía histórica | Una forma nueva es indistinguible del medio sostenido de una barra |
| Bajo contraste | Los terminales desaparecen a 7 px por espacio |
| Interferencia con pentagrama | Una marca se confunde con líneas de la pauta |
| Sobrecarga | Las cuatro rayas de A parecen un pictograma pesado |
| Sintaxis poco intuitiva | La lectura requiere adivinar un valor por el número de rayas |
| Semántica accidental | Un glifo recibe valor distinto sin perfil explícito |
| Licenciamiento incompleto | Se pierde atribución o aviso de la fuente original |

Las conclusiones visuales deberán registrarse tras revisar las láminas,
no presumirse aprobadas porque el TTF compile correctamente.

## 7. Informe de la segunda pasada y medición rasterizada

La primera muestra **no era suficientemente legible** a escala
de pauta pequeña: sus rayas auxiliares parecían desaparecer. Se
aumentaron la longitud de los trazos y su separación, conservando
una geometría lineal ligera (sin bloques macizos).

El script `v02/measure_lilypond_g22.py` comprueba la distinción
de todos los pares de candidatos a pautas con espacios de
**7, 9, 12 y 16 px** y genera `esferas-g22-raster-qa.json`.
El resultado cuantifica la suma de diferencias de intensidad entre
dos imágenes, normalizada a la intensidad de un píxel negro. No
debe interpretarse como una probabilidad de reconocimiento humano.

| Pauta | Familia A: diferencia mínima entre signos | Familia B: diferencia mínima |
| --- | ---: | ---: |
| 7 px | 4,85 píxeles de tinta equivalentes | 3,16 |
| 9 px | 7,94 | 5,33 |
| 12 px | 14,21 | 9,76 |
| 16 px | 25,23 | 17,21 |

La tabla resume el mínimo observado entre orientaciones
ascendente y descendente; los resultados íntegros están en el
JSON de QA generado por GitHub Actions.

**Interpretación:**

- A muestra mayor separación raster entre fracciones, pero su
  variante de cuatro rayas puede parecer una acumulación excesiva.
- B resulta visualmente algo más económica, pero sus terminales
  de posición superior/inferior son más susceptibles de confusión
  a 7 px. A 12 px, la reducción de área de tinta de B frente a A
  es pequeña, en torno a **1–2%** para los ejemplos de esta prueba.
- Ninguna familia presenta candidatos **idénticos** en las imágenes
  generadas a los tamaños ensayados, pero eso no equivale a un
  reconocimiento musical correcto.
- Todavía no hay una relación universal demostrada entre un
  número de rayas y la fracción del tono que representan.
  Esta gramática se considera un **código visual propuesto**.

**Juicio provisional:** no congelar A ni B como escritura definitiva.
Exigir contraste sobre pentagramas impresos y lectura a ciegas;
considerar una tercera iteración con rasgos aún mejor integrados
en el esqueleto LilyPond si los músicos no reconocen las diferencias.

Se conservan las láminas de ambas familias y la comparación central.
La ejecución de CI aprueba estructura, valores y ausencia de
colisiones pixel-idénticas, **no** la aceptación editorial.

## 8. Puertas pendientes

- [x] Conservar madres G1 y formas G2.1 aprobadas.
- [x] Codificar dos alternativas reversibles en generadores separados.
- [x] Definir intervalo y dirección con fracciones exactas.
- [ ] Ejecutar comparación visual A/B a escala de partitura.
- [ ] Estudiar índices tipográficos incompatibles (cuarto vs octavo).
- [ ] Elegir A, B, mezcla o rediseño mediante autorización del autor.
- [ ] Pruebas con músicos/lectura a ciegas e impresión.
- [ ] Integrar cualquier signo nuevo solo tras aprobaciones posteriores.

**G2.2 no queda cerrada por producir un primer TTF experimental.**
Su salida principal es una decisión informada sobre un sistema de
signos que continúe siendo ligero, matemáticamente inequívoco y
compatible con la familia LilyPond.
