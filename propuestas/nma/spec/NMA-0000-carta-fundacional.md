# NMA-0000 — Carta fundacional de Notación Microtonal Abierta

**Versión:** 0.1-draft  
**Fecha:** 2026-10-10  
**Estado:** propuesta abierta; ningún organismo de normalización la ha adoptado  
**Idioma normativo inicial:** español; se preparará traducción inglesa revisada  
**Licencia del texto:** GNU FDL 1.3 o posterior, sin secciones invariantes ni textos de cubierta.

## Resumen

NMA propone un modelo exacto e interoperable de notación microtonal. Aspira a
describir de manera independiente la frecuencia sonora, su relación matemática
con una referencia, la afinación adoptada, la grafía de la nota y el glifo usado.
Su ámbito abarca intervalos de frecuencia racional, divisiones iguales de
cualquier período declarado, y desviaciones logarítmicas expresables en cents.

La propuesta **no pretende sustituir** SMuFL, MusicXML, Scala, MIDI ni las
notaciones históricas de ninguna cultura. Pretende definir la capa semántica
intermedia que permite interoperar entre ellos sin pérdida silenciosa.

## Motivación

La grafía microtonal actual presenta, entre otros, estos problemas:

- Una misma fracción verbal de *tono* cambia de significado si no se explicita
  el tamaño del tono que se divide.
- Un glifo tipográfico no determina por sí solo una frecuencia universal.
- Los formatos de intercambio pueden degradar las fracciones racionales
  exactas en decimales redondeados.
- Los sistemas basados en intervalos de entonación justa y los basados en EDO
  usan distintas álgebras, aunque puedan coincidir perceptualmente.
- Las anotaciones de un compositor o escuela no se deben imponer a otras.

El precedente histórico *Tempera* en **MIDIDESI** (Christian Texier, 1993–2002,
pp. 18–19) muestra una clasificación de numerosas fracciones de tono y una
conversión MIDI que su propia documentación describe como aproximada.
**NMA solo aprovecha el concepto matemático de fraccionar intervalos**;
no reproduce sus diseños tipográficos, binarios ni tabla de caracteres.

## Principios obligatorios del proyecto

1. **Exactitud simbólica**: preservar razones de enteros y exponentes
   racionales sin redondearlos en los archivos canónicos.
2. **Separación de capas**: distinguir sonido, afinación, escritura y dibujo.
3. **Perfil explícito**: toda alteración se interpreta en un sistema declarado.
4. **Compatibilidad por construcción**: reutilizar identificadores SMuFL y
   formatos interoperables antes de introducir extensiones.
5. **Redondeo declarado**: cualquier paso a cents decimales o MIDI reporta
   el error y la pérdida potencial de información.
6. **Notación culturalmente situada**: no atribuir a un glifo una semántica
   universal cuando su uso histórico es contextual.
7. **Accesibilidad**: descripción textual, alternativas sin fuente y contraste
   legible, sin depender exclusivamente de una forma visual.
8. **Software libre**: documentación y herramientas editables y redistribuibles
   bajo licencias GNU elegidas expresamente.
9. **Revisión por pares**: pruebas de conformidad, comentarios de músicos
   y discusión de decisiones incompatibles.
10. **Independencia gráfica y legal**: no calcar ni convertir las fuentes
    originales de otros autores.

## Alcance 0.1

**Incluido**: octavas y períodos, razones, cents, EDO, notación de signos,
perfiles de alteración, normalización, equivalencia, validación y documentación.

**Pendiente**: altura no periódica dinámica, glissando continuo, sistemas
no octavantes con prácticas culturales específicas, temperamentos de rango
superior, tipografía definitiva, motor de colisiones, contracción armónica
compleja y codificación MIDI 2.0 por nota. Las extensiones podrán añadirse
mediante RFC independientes.

## Clases de documentos

- **NORM**: definiciones y requisitos normativos; versión congelada al aprobar.
- **REG**: registro de perfiles y glifos con semántica y procedencia.
- **REF**: investigación histórica y fuentes (informativas).
- **IMPL**: ejemplos, implementaciones y pruebas (no normativos).
- **TEST**: casos de conformidad y tolerancias explícitas.

La palabra **DEBE** expresa requisito para implementar el perfil correspondiente;
**NO DEBE**, prohibición; **PUEDE**, opción. Este uso se inspira en la práctica
de redacción normativa técnica, sin pretender que el borrador sea una norma ISO.

## Licenciamiento propuesto

Software: `GPL-3.0-or-later`. Textos normativos: `GFDL-1.3-or-later`, sin
secciones invariantes, portada o contraportada obligatorias. Archivos de fuente
tipográfica creados por el proyecto: `GPL-3.0-or-later` junto con excepción
de incrustación de fuentes aceptada por GNU, cuando sus derechos estén claros.

Los diseños de terceros con OFL no se *relicenciarán* como si fueran originales.
La propuesta no está patrocinada ni ratificada por el Proyecto GNU, la FSF
ni la W3C Music Notation Community Group.

## Gobernanza preliminar

Versiones 0.x son borradores sometidos a corrección. La ratificación de NMA
como estándar comunitario requerirá una política de decisiones documentada,
revisión externa real y adopción medible por al menos dos implementaciones
independientes. El título *estándar* se usa en esta etapa solo como objetivo.

## Referencias (informativas)

- W3C Music Notation Community Group: SMuFL, https://w3c.github.io/smufl/latest/
- W3C MusicXML 4.0, https://www.w3.org/2021/06/musicxml40/
- Scala file format, https://www.huygens-fokker.org/scala/scl_format.html
- The MIDI Association, MIDI Tuning: https://midi.org/midi-tuning-updated-specification
- GNU GPL, https://www.gnu.org/licenses/gpl-3.0.html
- GNU FDL, https://www.gnu.org/licenses/fdl-1.3.html
- GNU GPL Font Exception, https://www.gnu.org/licenses/gpl-faq.html#FontException
- Christian Texier, *MIDIDESI* (1993–2002), pp. 18–19, 42;
  ejemplar privado de trabajo; NO redistribuido.
