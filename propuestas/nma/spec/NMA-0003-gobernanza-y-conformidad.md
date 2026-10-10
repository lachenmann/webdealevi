# NMA-0003 — Gobernanza, conformidad y ruta de estandarización

**Clase:** NORM · **Edición:** 0.1-draft  
**Licencia:** GNU FDL-1.3-or-later sin secciones invariantes.

## 1. Estado de la iniciativa

NMA es una **propuesta** y NO un estándar aprobado, ni un proyecto oficial
GNU/FSF/W3C. La adopción de licencias GNU no otorga reconocimiento a la
Fundación para el Software Libre ni pertenencia al Proyecto GNU.

El grupo de editores se constituirá mediante un procedimiento transparente.
Se publicarán versiones de trabajo y se mantendrá un historial de decisiones.

## 2. Admisión de una propuesta (NMA-RFC)

Toda contribución sustancial incluirá:

1. problema o inconsistencia reproducible;
2. modelo matemático exacto y dominios de definición;
3. origen histórico y relación con prácticas culturales existentes;
4. glifos preexistentes SMuFL y perfiles afectados;
5. cambio tipográfico reproducible con código fuente de los contornos;
6. impacto sobre MusicXML, Scala, MIDI y el manifiesto NMA;
7. ejemplos positivos y casos que el sistema debe rechazar;
8. licenciamiento y procedencia del material enviado;
9. plan de migración y compatibilidad.

Las propuestas deben emplear números rationales exactos, no afirmaciones
como «aproximadamente lo mismo» para definir equivalencia acústica.

## 3. Pruebas y niveles de conformidad

Se contemplan estos perfiles:

- **CORE-MATH**: intervalos normalizados, composición e inversión exactas,
  EDO, razón, fracciones de cents, validación de datos.
- **CORE-NOTATION**: separación de sonido y escritura, contexto de
  afinación explícito, reversibilidad de una grafía documentada.
- **CORE-GLYPH**: nombres SMuFL, mapa de caracteres, métricas, texto
  alternativo, variantes abiertas/rellenas.
- **INTERCHANGE**: importación/exportación controlada, manifestación de
  pérdidas y errores de cuantización.
- **RENDER-ACCESS**: lectura accesible, visualización verificable en tamaños
  múltiples y sustitución cuando una fuente falta.

Un software PUEDE cumplir solo algunos perfiles, pero NO DEBE declararse
«compatible con toda NMA» hasta superar la totalidad del conjunto vigente.

## 4. Cambios

Durante 0.x se aceptan cambios incompatibles, siempre con changelog.
Desde 1.0, un cambio incompatible necesitará una versión mayor y
un procedimiento público de migración. Un símbolo registrado no
cambiará silenciosamente de significado dentro del mismo perfil/versión.

Una prueba editorial no sustituye la validación matemática ni la evaluación
por músicos de diferentes tradiciones.

## 5. Participación y derechos

Las contribuciones conservarán su autoría; la documentación llevará
trazabilidad e identificación de contribuyentes. Se propone emplear
`Signed-off-by` (Developer Certificate of Origin) solo después de
publicar el procedimiento correspondiente. Nadie deberá afirmar
tener derechos sobre fuentes de terceros sin prueba documental.

Los signos de sistemas históricos se incorporarán a un registro
descriptivo con referencia, sin afirmar que NMA los haya inventado.
Los criterios editoriales se publicarán con acta y alternativas razonadas.

## 6. Qué hace falta para aspirar a «estándar»

Esta v0.1 no garantiza interoperabilidad por sí sola. Antes de 1.0:

- revisión por especialistas externos independientes;
- dos implementaciones independientes que pasen un corpus público;
- al menos un adaptador de ida y vuelta con validación de pérdida;
- discusión documentada con la comunidad de notación (en particular
  la W3C Music Notation Community Group para compatibilidad SMuFL);
- especificación de criterios de consenso y resolución de desacuerdos;
- política de licencias/patentes sin restricciones discriminatorias;
- documentación legible en más de un idioma y ejemplos accesibles.

Este proceso describe nuestra gobernanza pretendida, no constituye
ningún aval externo.

## 7. Prioridades editoriales

Se **conservan** las formas convencionales Stein–Zimmermann sin atribuirlas
al nuevo proyecto, se compara la literatura de Texier/MIDIDESI como
fuente histórica protegida, y se distingue cualquier nueva gramática
de fracciones como propuesta NMA. El mismo glifo puede tener más de
un valor a través de distintos perfiles explícitos, pero nunca dentro
de un perfil/versionado idéntico y ambiguo.

## 8. Criterios de congelación de una versión

No se puede congelar una release si fallan pruebas matemáticas, faltan
fuentes para afirmaciones históricas fundamentales, se reutilizan
códigos ajenos con nuevas semánticas o no se puede construir la fuente
desde su código fuente modificable.

La decisión de congelar NMA-1.0 será explícita y pública.
