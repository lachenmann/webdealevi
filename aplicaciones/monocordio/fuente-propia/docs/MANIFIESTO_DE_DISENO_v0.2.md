# Esferas Microtonal v0.2 — Manifiesto de diseño

**Identificador:** EM-DOC-020  
**Fecha:** 10 de octubre de 2026  
**Estado:** `BORRADOR_TIPOGRÁFICO_PARA_REVISIÓN`  
**Ámbito:** fuente musical de alteraciones; **no** es aún una especificación de notación aprobada  
**Origen:** crítica visual de la v0.1 y propuesta del autor de derivar los signos de bemol, becuadro y sostenido  
**Base normativa:** [gramática de trazos](./GRAMATICA_DE_TRAZOS_v0.2.md) · [criterios de aceptación](./PROTOCOLO_QA_v0.2.md) · [decisiones abiertas](./REGISTRO_DECISIONES_v0.2.md)

## Actualización G1 posterior al manifiesto

**Decisión posterior del autor (EM-G1-002):** el sostenido, bemol
y becuadro utilizarán los contornos **reales de LilyPond/Emmentaler**.
Las afirmaciones que siguen sobre creación de las matrices desde
cero solo describen la hipótesis inicial, **sustituida**. Se conserva
la gramática de operaciones morfológicas y el objetivo de ligereza,
sin perder el copyright de los autores de LilyPond. Referencia:
[EM-G1-002](./EM-G1-002-LILYPOND_REFERENCIA.md).

## I. Tesis

Una fuente microtonal rigurosa no debe construirse como una colección de
pictogramas independientes. Sus signos deben derivarse mediante **operaciones
visuales controladas** a partir de tres matrices reconocibles de la escritura
musical occidental:

- **sostenido** (\(\sharp\)): familia de alteraciones ascendentes;
- **bemol** (\(\flat\)): familia de alteraciones descendentes;
- **becuadro** (\(\natural\)): neutralización y gramática de referencia.

No se pretende atribuir estos signos al proyecto. Su nomenclatura y muchos
de sus derivados existen históricamente; el propósito consiste en diseñar
**contornos originales y homogéneos** para una fuente propia, reconociendo
sus antecedentes y favoreciendo las correspondencias SMuFL existentes.

**Principio central:** economía morfológica sin pérdida de información
acústica ni de legibilidad. Quitar un trazo, añadirlo o reflejar una forma
solo tiene valor musical dentro de un **perfil semántico explícito**.

## II. Por qué abandonamos la geometría v0.1 como modelo estético

La lámina de primera generación cumplió su función técnica de demostrar
que se podía compilar un TTF válido. Sin embargo, su aspecto no satisfizo
criterios de grabado musical:

1. cuerpos demasiado altos respecto de la pauta;
2. grosores de trazo excesivos;
3. exceso de superficies negras en rombos, cuadrados y polígonos;
4. diferencias de estilo entre signos convencionales y extensiones;
5. contraste óptico insuficiente, especialmente a tamaños de lectura;
6. un becuadro construido sin reproducir fielmente su estructura musical;
7. caracteres de octavo de tono que parecían logotipos u objetos gráficos.

**Decisión:** la v0.1 sigue disponible como registro de prototipo; la v0.2
parte de una gramática nueva. Ninguna forma v0.1 pasa a v0.2 por simple
reducción de escala.

## III. Tres matrices y sus invariantes

### Sostenido

Se identifica por **dos astas verticales y dos travesaños oblicuos**.
Se modelan como componentes de trazo susceptibles de inclusión o supresión,
no como los píxeles de una tipografía ajena. Para la familia ascendente
se toma una notación abstracta \(\{V_L,V_R,H_S,H_I\}\), donde las
subíndices representan izquierda/derecha y superior/inferior.

### Bemol

Se identifica por **asta y curva abierta**. Su geometría derivada
requiere cuidar el lado de la panza, la posición de la apertura, el
contraste de curvatura y el punto de tangencia. La figura del cuarto de
tono descendente **Stein–Zimmermann** es el bemol inverso **de contorno
abierto**: es una convención existente, no una invención de esta fuente.
La variante rellena es un glifo distinto y no puede sustituirlo.

### Becuadro

Debe reconstruirse con **dos astas verticales de extensiones asimétricas**
y **dos travesaños de conexión inclinados** situados a alturas distintas.
No es una «H», un rectángulo cerrado ni dos postes unidos por simples
escalones gruesos. Se empleará el glifo SMuFL `accidentalNatural` (E261)
como **referencia de función y de proporción**, sin copiar el contorno de
otra fuente.

El becuadro es ante todo un **operador contextual de cancelación
notacional**. No debe identificarse ingenuamente con «frecuencia cero»
ni con el grupo acústico reducido a una cifra sin contexto.

## IV. Sintaxis de transformaciones

Las operaciones propuestas son:

- `DEL(rasgo)`: suprimir un asta o travesaño;
- `ADD(rasgo)`: añadir un asta, travesaño o componente auxiliar;
- `REFLECT(eje)`: reflejar una estructura conservando lectura óptica;
- `TRIM(rasgo, t)`: modificar la extensión de un elemento en proporción
  `t` **solo si** queda legible en tamaños pequeños;
- `OPEN(curva)`: diseñar una panza abierta sin superficie negra;
- `ADJUST_OPTICAL(...)`: corregir alineación, inclinación y espaciado sin
  cambiar el valor semántico.

Los operadores son **constructores visuales**, no sumas de cents.
No se cumple, en general, «un trazo = una cantidad fija de cents».
Dos signos con igual número de trazos pueden representar valores
diferentes. La gramática deberá acompañarse de un **registro exacto**
\(\operatorname{valor}(g,\pi)\) que también indique el perfil \(\pi\).

## V. Familia ascendente: primera propuesta morfológica

Tomando las simplificaciones del sostenido planteadas por el autor y una **interpolación técnica aún no ratificada para +3/8**, en un perfil con `1 tono = 200 cents` se propone:

| Fracción de tono | Cents exactos | Construcción abstracta | Estado |
| --- | ---: | --- | --- |
| +1/8 | +25 | `V_L + H_S` | Candidata nueva |
| +1/4 | +50 | `V_L + H_S + H_I` | Convención Stein–Zimmermann |
| +3/8 | +75 | `V_L + V_R + H_S` | Candidata nueva |
| +1/2 | +100 | `V_L + V_R + H_S + H_I` | Sostenido convencional |
| +3/4 | +150 | `V_L + V_R + V_X + H_S + H_I` | Familia histórica de sostenido y medio; cotejar E283 |

Se reproduce una lógica tangible:

- octavo: sostenido sin asta derecha **ni** travesaño inferior;
- cuarto: sostenido sin asta derecha;
- tres octavos: sostenido sin travesaño inferior;
- semitono: sostenido completo;
- tres cuartos: extensión con tercera asta, según el modelo musical
  propuesto; contrastar su diseño con el catálogo Stein–Zimmermann.

**Advertencia crítica:** las construcciones de +1/4 y +3/8 tienen ambas
tres trazos, pero no los mismos. La progresión es una **retícula parcial
de formas**, no una sucesión de un solo trazo por intervalo. Deben
validarse por lectura musical, no por una supuesta proporcionalidad
«número de trazos / cents».

## VI. Familia descendente

Partimos del bemol y del **bemol inverso abierto** para −1/4.
La inversión del arco de este último constituye una convención
reconocible, no un mero ejercicio de simetría geométrica.

Para −1/8 y −3/8 se estudiarán reducciones **abiertas y monolineales**
del mismo esqueleto, conservando asta, orientación y una curva mínima
distinguible. **No se congelan todavía sus contornos**: la historia
tipográfica y la facilidad de lectura deben verificarse con la misma
exigencia que en la familia ascendente. Tampoco se fijará por analogía
automática un −3/4 sin revisar las convenciones documentadas.

## VII. Sextos y doceavos: no forzar una gramática falsa

Las divisiones `1/6` y `1/12` de un tono tienen valores exactos
`100/3` y `50/3` cents, respectivamente, bajo el perfil declarado.
Su posición entre octavos y cuartos demuestra que **no existe una única
escala entera de simplificación de las cuatro líneas del sostenido**
que codifique sin recursos adicionales todas esas fracciones.

Opciones a investigar, ninguna aprobada:

- variación controlada de un componente de la familia sostenido/bemol;
- un componente auxiliar fino y consistente con la estructura madre;
- adhesión documentada a glifos históricos existentes con semántica
  exacta y una familia de dibujo coherente.

Quedan descartados los polígonos macizos desconectados de la tradición
tipográfica y las propuestas cuya diferencia solo se perciba ampliadas
al tamaño de un póster.

## VIII. Economía óptica y material

La nueva fuente se diseña para **partituras**, no para tarjetas de interfaz.
Se fija como unidad de comparación el espacio interlineal de la pauta
(`s`), no la altura aparente de un SVG a 112 px.

- Trazos principales y secundarios con grosores controlados;
- curvas abiertas y contraformas despejadas;
- alineación por anclajes, no por centrado mecánico de un rectángulo;
- distancia suficiente con cabeza y plica de la nota;
- uso moderado de relleno: solo el grosor necesario para producir el
  trazo a tamaños de impresión.

La v0.2 deberá reducir significativamente la masa de tinta respecto de
la v0.1 **a igual escala de pauta**, sin sacrificar el reconocimiento.
Las cifras concretas se fijan como objetivos de QA, no como datos de
rendimiento ya medidos.

## IX. Licencia, genealogía y estándar

- El desarrollo tipográfico será independiente de la representación
  binaria y los contornos de MIDIDESI/Tempera.
- Las figuras convencionales deben conservar la referencia a SMuFL y a
  sus tradiciones gráficas; no se atribuirán al proyecto.
- La intención de publicación es **software libre GNU**; la fuente
  terminada se propone bajo GNU GPL-3.0-or-later con la excepción
  oficial de incrustación de fuentes, tras verificar titularidad y aviso.
- Los códigos privados provisionales no se presentarán como símbolos
  registrados por SMuFL.

La propuesta **NMA** es un proyecto paralelo de semántica matemática
y normalización. Este documento define un **estilo tipográfico** y
una gramática de construcción; no reemplaza la especificación NMA
ni declara «estándar» una mera asignación de contornos.

## X. Criterio de aceptación

La v0.2 no se considera cerrada hasta que:

1. el becuadro sea visualmente correcto;
2. la familia derivativa pueda reconstruirse desde primitivas declaradas;
3. las fracciones se conserven exactas en sus metadatos;
4. no existan colisiones gráficas o semánticas en el perfil;
5. los signos sean legibles a escala real de partitura e impresión;
6. un revisor pueda reconocer diferencias a tamaño normal **sin leer
   la etiqueta de cents**;
7. el manuscrito de diseño distinga claramente glifos históricos,
   candidatos experimentales y decisiones pendientes;
8. el autor apruebe los especímenes antes de reemplazar el TTF.

**Este documento autoriza la documentación y la exploración de bocetos,
no la sustitución automática de la fuente ni su publicación.**
