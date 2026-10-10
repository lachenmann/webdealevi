# NMA — Investigación y referencias de control (informativo)

**Edición:** 2026-10-10 · Licencia GNU FDL 1.3 o posterior.

Este inventario delimita qué elementos de NMA vienen de normas o
convenciones ya existentes y cuáles son propuestas independientes.

| Recurso | Aportación | Límite |
| --- | --- | --- |
| [SMuFL, W3C Music Notation Community Group](https://w3c.github.io/smufl/latest/) | Nombres, códigos, clases, métricas y metadatos de glifos | No convierte un glifo aislado en frecuencia universal |
| [MusicXML 4.0](https://www.w3.org/2021/06/musicxml40/) | Notación de partituras, `<alter>`, `<accidental>`, metadatos de glifos SMuFL | `<alter>` es decimal; tercio de semitono exacto exige solución adicional |
| [Scala .scl](https://www.huygens-fokker.org/scala/scl_format.html) | Intercambio de escalas de razones o cents y período | No conserva necesariamente la escritura, referencia ni mapeo instrumental |
| [Scala .kbm](https://www.huygens-fokker.org/scala/help.htm) | Mapeo de grados a teclas/notas MIDI | No establece una gramática de glifos |
| [MIDI Tuning Standard](https://midi.org/midi-tuning-updated-specification) | Afinación microtonal para hardware/software | Resolución finita y posible cuantización |
| [GNU GPL](https://www.gnu.org/licenses/gpl-3.0.html) | Copyleft del código libre | No es una fuente tipográfica ni una norma musical |
| [GNU FDL](https://www.gnu.org/licenses/fdl-1.3.html) | Documentación libre | Documentación y código deberán estar identificados por separado |
| [GNU GPL Font Exception](https://www.gnu.org/licenses/gpl-faq.html#FontException) | Incrustación sin licencia GPL automática del documento por el solo uso de la fuente | Requiere aplicación expresa y correcta al original |

## Precedentes gráficos y de afinación

**Christian Texier, MIDIDESI (1993–2002).** Ejemplar privado del manual.
Su capítulo «Tempera» (pp. 18–19) contiene una clasificación de fracciones
de tono, incluyendo 1/2, 1/4, 1/6, 1/8 y 1/12. Los valores de control MIDI se
presentan en rango 0–127 con centro 64, y el autor advierte que constituyen
una modificación gruesa del pitch bend. La p. 42 reclama copyright sobre las
seis fuentes. El proyecto **no incorpora las fuentes ni reproduce su tabla
tipográfica**, sino que analiza la clasificación matemática.

**Stein–Zimmermann:** medio sostenido y bemol inverso abierto para ±1/4
de tono; identificadores estándar `accidentalQuarterToneSharpStein` (E282)
y `accidentalQuarterToneFlatStein` (E280). No presentarlos como invención
de NMA ni del autor del monocordio.

**Sims y Wyschnegradsky:** convenciones históricas incluidas en el repertorio
de SMuFL. Mantener atribución y la distinción entre morfología del glifo y
semántica dentro de un temperamento.

**Danny Wier:** notaciones con alteraciones y cabezas especiales presentadas
en sus escritos sobre 72-EDO. Una propuesta NMA no asumirá que sus dibujos
constituyen formas universales ni extenderá su atribución a octavos de tono
ajenos a ese sistema sin documentación.

## Agenda bibliográfica

Para NMA-0.2 hace falta un aparato de referencias críticas de grabado,
acústica, temperamentos regulares, teoría de retículos, gramáticas de
notación y fuentes etnomusicológicas contrastadas.

Se propondrán:
- Kurt Stone, *Music Notation in the Twentieth Century*: guía histórica,
  no normativa;
- investigación publicada sobre Wyschnegradsky, Hába, Partch y
  notaciones de entonación justa;
- las especificaciones de las asociaciones musicales y formatos actuales,
  con revisión de versiones y licencias antes de citarlas normativamente.

Las generalizaciones sobre escuelas musicales requieren evidencias y, en
su caso, especialistas de la tradición. La tabla Tempera no demuestra que
todos los signos del manual se hayan universalizado.
