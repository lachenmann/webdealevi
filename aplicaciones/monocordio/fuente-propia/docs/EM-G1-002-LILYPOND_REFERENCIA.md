# EM-G1-002 — Matrices originales de GNU LilyPond

**Estado:** cambio de referencia tipográfica solicitado por el autor; revisión visual pendiente.  
**Fecha:** 10 de octubre de 2026.  
**Sustituye como referencia de dibujo:** los bocetos independientes EM-G1-001 (se conservan como historial).  
**No sustituye:** la gramática matemática y las decisiones de notación aún vigentes.

## Decisión

Las tres madres de Esferas Microtonal v0.2 provendrán DIRECTAMENTE
de los glifos reales del conjunto Emmentaler/Feta de GNU LilyPond.

| Madre | Nombre de glifo de LilyPond | Código SMuFL usado en el estudio |
| --- | --- | --- |
| Bemol | accidentals.flat | U+E260 |
| Becuadro | accidentals.natural | U+E261 |
| Sostenido | accidentals.sharp | U+E262 |

LilyPond tiene nombres propios de glifo; el nuevo TTF asigna códigos
SMuFL compatibles sin afirmar que el OTF de origen utilice SMuFL internamente.

Los tres signos NO serán en esta versión reinterpretaciones
independientes: **son contornos derivados de LilyPond**. Esta corrección
de procedencia es fundamental para los avisos y la futura licencia.

## Fuentes y genealogía

La definición original de los signos se conserva en los archivos
METAFONT oficiales:

- https://github.com/lilypond/lilypond/blob/master/mf/feta-flats.mf
- https://github.com/lilypond/lilypond/blob/master/mf/feta-naturals.mf
- https://github.com/lilypond/lilypond/blob/master/mf/feta-sharps.mf
- https://github.com/lilypond/lilypond/blob/master/mf/feta-accidentals.mf

## Identidad de origen congelada en la auditoría

La compilación de referencia GitHub Actions usa el paquete original
**GNU LilyPond 2.24.3**, archivo emmentaler-20.otf, y registra:

- SHA-256: aa01667241dc9ff658c41d3b822aa2735f74dfe09f51d40e7a24fde5b6253eb6.
- Familia OpenType: Emmentaler-20.
- Identificadores de origen: accidentals.flat, accidentals.natural,
  accidentals.sharp.
- UPM original y UPM del estudio: 1000.
- Conversión: curvas cúbicas CFF a cuadráticas TrueType (Cu2QuPen,
  error máximo configurado a 0,5 unidades).
- Copyright: conservado literalmente desde el campo de aviso de
  derechos del OTF original y acompañado del aviso de derivación.

La versión y hash de la fuente de origen quedan **fijadas en CI**;
si una distribución actualiza LilyPond, deberá documentarse
una nueva revisión en vez de incorporar contornos distintos
silenciosamente. En otros sistemas locales se permite utilizar un
OTF original de otra edición, registrando siempre su propia
versión y hash en el manifiesto.

El código fuente de Feta ya documenta medio sostenido con una o
dos barras y sostenido de tres cuartos con tres astas, así como
bemol inverso y tres cuartos descendente. Deben revisarse los
glifos exactos y sus funciones históricas antes de usarlos
como plantilla de nuevas fracciones.

## Licencia

La fuente bajo mf/ es doblemente licenciada según el archivo
LICENSE oficial de LilyPond:

**Opción seleccionada para este estudio:** GNU GPL 3 o posterior
con la excepción de incrustación de fuentes incluida por LilyPond.

**Opción alternativa del upstream:** SIL Open Font License 1.1,
con nombres reservados «Emmentaler» y «Feta».

Preservamos los textos originales íntegros en v02/upstream:
LICENSE, COPYING y LICENSE-OFL. La fuente derivada usa otro
nombre y reconoce el copyright de LilyPond y las contribuciones
posteriores del proyecto. Ninguna fuente de MIDIDESI es reutilizada.

## Procedimiento reproducible

El generador build_lilypond_mothers.py recibe un emmentaler-20.otf
original de LilyPond. Extrae por nombre los tres contornos,
transforma sus curvas cúbicas a cuadráticas usando FontTools,
conserva la geometría mediante escala uniforme y desplazamiento
horizontal, y escribe un pequeño TTF de estudio.

Se preserva un manifiesto que declara: nombre y versión
del archivo fuente, SHA-256, glifos originales, geometría
de transformación, límite de error y licencia.

Los binarios OTF originales no se copian en el repositorio,
y la compilación TTF de estudio se realiza de manera transitoria.
Solo se entrega una muestra gráfica y el código reproducible.

## Preservación de etapas

- El generador original v0.1 no cambia.
- El generador G1 independiente previo se conserva como archivo
  histórico, sin considerarse el nuevo modelo maestro.
- La herramienta web del monocordio, su fuente Leland y las
  proporciones acústicas permanecen sin cambios.
- La fase G2 (derivaciones de octavos, cuartos, tres cuartos)
  se realizará después de revisar visualmente las tres madres.

## Pruebas requeridas antes de cerrar G1

1. Localizar por nombre los glifos originales de LilyPond.
2. Confirmar licencia, aviso y versión del archivo OTF.
3. Comprobar por coordenadas que el contorno convertido tiene
   la misma forma dentro de una tolerancia explícita.
4. Renderizar el becuadro de LilyPond sin redibujarlo.
5. Comparar las tres madres sobre pautas de tamaño real.
6. Registrar la aprobación del autor antes de iniciar G2.

**Estado de la fase:** muestras técnicas producidas;
no se sustituye todavía la tipografía oficial del proyecto.
