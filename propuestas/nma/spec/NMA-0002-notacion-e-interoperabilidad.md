# NMA-0002 — Notación, glifos e interoperabilidad

**Clase:** NORM · **Edición:** 0.1-draft  
**Licencia:** GNU FDL-1.3-or-later sin secciones invariantes  
**Dependencia:** NMA-0001.

## 1. Separación de identidades

NMA reconoce al menos **cuatro identidades diferentes**:

1. **Significado acústico:** intervalo exacto o frecuencia física.
2. **Interpretación afinatoria:** perfil (EDO, razón, entonación justa,
   temperamento, práctica cultural, etc.).
3. **Escritura:** nota, octava, alteración, contexto y posible estado
   de vigencia en la partitura.
4. **Glifo:** contorno y código que el editor utiliza para mostrarla.

La asociación *glifo → cents* NO es universal: una alteración puede
tener valores diferentes en perfiles distintos. Tampoco un número de cents
determina una ortografía única.

## 2. Objeto semántico mínimo de nota

Un evento musical conforme conserva al menos:

- `reference`: identificador y frecuencia exacta de la referencia
  (`A4=440` se permite como **perfil explícito**, no como ley natural).
- `soundingInterval`: intervalo EXACTO respecto de la referencia, en
  una de las clases de NMA-0001.
- `writtenPitch`: nombre de grado/letra y registro **si** la notación
  emplea ese concepto.
- `notationProfile`: identificador versionado del sistema de alteraciones
  con el que se interpreta el glifo.
- `accidentalTokens`: cero o más identificadores de signos (con orden).
- `display`: glifo SMuFL opcional, alternativa SVG/figura y texto accesible.

Un evento sin `writtenPitch` PUEDE describir una altura sonora sin
forzarle una nota diatónica occidental. El campo `writtenPitch` tampoco
puede sustituir `soundingInterval`.

## 3. Perfiles semánticos de alteración

Un **perfil** es una tabla pública de asociación:
`(signo, contexto) → intervalo exacto`.

Se propone inicialmente `nma.tone-12tet.v0`, en el que la unidad de
*tono* está definida como 200 cents:

- bemol convencional: -100 cents; sostenido: +100 cents;
- bemol inverso **abierto Stein–Zimmermann**: -50 cents;
- medio sostenido Stein–Zimmermann: +50 cents;
- sexto de tono descendente/ascendente: -/+100/3 cents;
- octavo de tono descendente/ascendente: -/+25 cents;
- doceavo de tono descendente/ascendente: -/+50/3 cents.

Este **es un perfil**, no una prescripción universal para la música
persa, otomana, india, árabe, la entonación justa ni la música espectral.

La diferencia `cents totales = alteraciones + residual` se usa únicamente
cuando todos los términos estén expresados en un sistema logarítmico común.
No sustituye las razones exactas que caractericen el sonido.

## 4. SMuFL y normalización tipográfica

Cuando un signo tenga nombre de glifo SMuFL registrado, **DEBE**
utilizarse ese nombre como clave interoperable:

| Significado en el perfil 12-TET | Glifo SMuFL | Código |
| --- | --- | --- |
| Bemol | `accidentalFlat` | E260 |
| Becuadro | `accidentalNatural` | E261 |
| Sostenido | `accidentalSharp` | E262 |
| Cuarto descendente, bemol inverso abierto | `accidentalQuarterToneFlatStein` | E280 |
| Cuarto ascendente, medio sostenido | `accidentalQuarterToneSharpStein` | E282 |
| Doceavo descendente estilo Sims | `accidentalSims12Down` | E2A0 |
| Sexto descendente estilo Sims | `accidentalSims6Down` | E2A1 |
| Doceavo ascendente estilo Sims | `accidentalSims12Up` | E2A3 |
| Sexto ascendente estilo Sims | `accidentalSims6Up` | E2A4 |

Las variantes **no son intercambiables por coincidencia de cents**:
un signo Sims, uno de Wyschnegradsky y uno geométrico editorial
pueden tener semejante destino acústico pero distinta escritura histórica.

Si un nuevo signo no tiene código SMuFL oficial, su glifo PUEDE
asignarse provisionalmente a un punto de uso privado, con un nombre de
dominio propio y metadatos verificables; ese punto **no constituye**
normalización ni reserva de código en SMuFL. Las extensiones duraderas
se presentarán al grupo responsable en vez de apropiarse de rangos.

## 5. Alcance de la notación gráfica

En 0.1, los perfiles solo cubren identidad de signo y altura; la
semántica exacta de cancelación en compases, ligaduras a través de
barras, armaduras no tradicionales y ortografía en transposición se
reservan a RFC posteriores. Un editor NO DEBE inferir esas reglas
únicamente de un glifo de cuarto de tono.

Las fuentes tipográficas deben suministrar métricas de posición y
anclajes para no producir solapamientos en clave, cabeza de nota o
alteraciones. La referencia de escala en staff spaces seguirá las
convenciones de SMuFL cuando se reutilicen sus símbolos.

## 6. Accesibilidad

Todo signo con papel semántico DEBE disponer de:

- nombre de lectura descriptivo (p. ej. «cuarto de tono descendente»);
- intervalo del perfil expresable en cents/fracción exacta;
- modo alternativo de representación cuando una fuente no esté instalada;
- distinción visual legible entre orientaciones opuestas.

Una fuente tipográfica, por sí sola, **no es el modelo de datos**.

## 7. MusicXML

MusicXML 4.0 usa `<alter>` para alteraciones expresadas en
**semitonos decimales**, y `<accidental>` para la grafía. Admite
`smufl` como atributo para desambiguar signos. Por ejemplo un cuarto
de tono ascendente corresponde a `0.5` semitonos.

**Peligro**: un sexto de tono temperado equivale a `1/3` de
semitono; ningún decimal finito es exactamente `1/3`.
Por tanto un exportador que solo proporcione `0.333333` debe
identificar el redondeo y guardar la fracción NMA exacta mediante
una extensión documentada, si desea prometer recuperación sin pérdida.

Un exportador DEBE separar la exactitud acústica de la fidelidad gráfica.
No se debe asignar a `<accidental>` un signo inexistente en la enumeración
con la esperanza de que el receptor lo interprete.

## 8. Scala y mapeo instrumental

Un archivo Scala `.scl` puede codificar razones exactas de escala y cents
decimales, pero NO lleva por sí mismo la escritura de una partitura.
Un archivo `.kbm` aporta un mapeo de teclas independiente. La
exportación a Scala DEBE conservar las razones enteras y especificar
cuando una medida de cents ha sido aproximada. La importación no debe
fabricar una grafía histórica universal.

## 9. MIDI y síntesis

MIDI Tuning Standard permite intercambiar afinaciones microtonales,
pero su resolución es finita. Se documentarán:
`formato → precisión cuantizada → error máximo o real`.
El mensaje MIDI NO debe convertirse en la forma canónica de un intervalo.

Los formatos de salida que no puedan conservar una distinción (como
un intervalo JI frente a uno temperado aproximado) deben emitir un
informe explícito de pérdida.

## 10. Condiciones de conformidad visual

El perfil **NMA-GLYPH-0.1** exige:

1. reproducir visualmente al menos diez símbolos de prueba;
2. que el bemol inverso Stein–Zimmermann sea de contorno **abierto**;
3. no confundir signos distintos por reutilizar el mismo código de
   carácter privado sin metadatos;
4. no alterar la frecuencia por cambiar la familia tipográfica;
5. texto alternativo y plan de fallback;
6. evitar colisiones evidentes en 24, 32 y 48 px y en pantallas pequeñas.

Estas reglas son un punto de partida de diseño, no un conjunto
cerrado de métricas finales.

## 11. Trabajo futuro

- Escritura enharmónica como relación de equivalencia sobre alturas.
- Vigencia y cancelación de alteraciones por compás/voz/instrumento.
- Entonación justa como *lattice* de exponentes primos.
- Polifonía microtonal y transposición.
- Registro comunitario de tradiciones de escritura, con atribución.
- Preservación exacta de notación en MusicXML y adaptadores a editores.

**Prohibición específica:** este proyecto no transforma contornos de
MIDIDESI/Tempera ni atribuye al creador de NMA convenciones históricas
preexistentes.
