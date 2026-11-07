# Telar

Telar genera material composicional complejo: ritmo anidado, polifonía paramétrica, campos armónicos y procesos en el tiempo. Lo muestra en notación, lo hace sonar y lo exporta a LilyPond, MusicXML y MIDI.

Funciona solo en el navegador. No usa inteligencia artificial, servidor ni dependencias externas. Toda decisión es una regla escrita o un azar fijado por la semilla: la misma entrada da siempre la misma pieza.

## Uso

Sirve la raíz del repositorio con cualquier servidor estático (los módulos ES no funcionan con `file://`):

```bash
python -m http.server 8000
```

Abre `http://localhost:8000/aplicaciones/telar/`. La partitura se rehace con cada cambio y el proyecto se guarda en el navegador. El botón **Proyecto** lo descarga como JSON para abrirlo después.

El interruptor **Modo oscuro** de la cabecera cambia toda la interfaz, partitura incluida, y recuerda la elección; si no eliges, sigue el modo del sistema. Al imprimir, la partitura sale siempre en negro sobre blanco.

Telar tiene dos modos, que se cambian arriba a la izquierda y comparten el mismo proyecto:

- **Partitura:** una pieza completa, descrita a continuación.
- **Material:** materia prima para tu software o tu manuscrito (véase [Modo Material](#modo-material)).

En el modo Partitura se trabaja en cuatro pasos, sin cables ni módulos que conectar:

| Paso | Qué decides |
| --- | --- |
| **1 Urdimbre** | Ciclo de compases, número de compases y tempo |
| **2 Hilos** | Por voz: instrumento, ritmos y ciclos de altura, densidad, dinámica y articulación |
| **3 Campos** | De dónde salen las alturas y cómo se pasa de un campo a otro |
| **4 Procesos** | Filtros y transformaciones con curva y ventana temporal |

La vista **Tejido** muestra cada hilo como una fila y cada ataque como una columna. Las marcas oscuras son reinicios de un ciclo; las rojas, los momentos en que los cuatro hilos reinician a la vez.

## Sintaxis

**Compases.** `4/4 3/8 3/10 5/12 2+3/16`. Con denominador 16 o mayor los pulsos se agrupan solos (`7/16` es 2+2+3), salvo que indiques otra agrupación.

Un compás es irracional si su denominador no es potencia de 2. Se escribe bajo una tupla implícita: `3/10` son tres corcheas bajo 5:4 y dura exactamente 3/10 de redonda.

**Ritmos.** Pesos relativos; cada línea es un patrón y los patrones forman un ciclo propio, independiente del de compases.

```text
1 2(1 1 1) 1        tres partes; la central, doble, se divide en tres
3(1 -1 1) 2(1 1)    -1 es un silencio
1 +1 2(3 2(1 1))    +1 liga con lo anterior; la anidación es libre
```

Un patrón llena un pulso o un compás entero, según elijas.

**Alturas.** `Do4`, `Sol#3`, `Sib2`, `Re4+` (un cuarto de tono arriba), `La-3` (un cuarto de tono abajo). También vale `C#5`. Do4 es el Do central.

**Hilos.** Cada ciclo avanza por ataques o por tiempo, con su propio paso y su fase.

| Hilo | Valores |
| --- | --- |
| Altura | Índices del campo dentro del ámbito del instrumento; 0 es la nota más grave |
| Densidad | Notas por ataque, limitadas por el instrumento |
| Dinámica | `ppp pp p mp mf f ff fff`, o `-` para ninguna |
| Articulación | `-` nada, `.` picado, `!` muy picado, `_` tenuto, `>` acento, `^` marcato |

**Campos.**

- **Multiplicación:** interválica (A transportado por los intervalos de B) o en anillo (sumas y diferencias de frecuencias).
- **Criba:** `(5@0 | 7@2) & !3@1`, sobre una rejilla de semitonos o de cuartos de tono.
- **Espectro:** parciales `f·nᵉ`, con `1-16 19` como lista y `e = 1` para la serie armónica. Se redondean al cuarto de tono; la desviación en cents aparece al pasar el puntero por la nota.
- **Lista:** alturas escritas a mano.

Entre campos puede haber corte o interpolación. Con interpolación, cada posición de un campo viaja hacia su homóloga del siguiente.

**Procesos.** Cada uno tiene una ventana (0 a 1 sobre toda la pieza), una curva (lineal, exponencial o campana) y las voces a las que afecta.

| Proceso | Efecto |
| --- | --- |
| Subdivisión progresiva | Una nota puede convertirse en tupla: la anidación crece |
| Fusión de ataques | Un ataque puede ligarse con el anterior |
| Rarefacción | Calla una fracción de ataques; lo que suena conserva su altura |
| Criba de ataques | Solo suenan los ataques cuyo número pasa la criba |
| Filtro de banda | Un pasabanda móvil: lo que queda fuera calla o se pliega por octavas |
| Transposición | En semitonos; 0,5 es un cuarto de tono |
| Compresión interválica | Multiplica los intervalos respecto de un eje |
| Deriva dinámica | Desplaza la dinámica en grados |

Los procesos rítmicos actúan siempre primero. Los demás se aplican en el orden de la lista, después de tejer los hilos, de modo que filtrar no desplaza los ciclos.

## Modo Material

| Pestaña | Qué genera |
| --- | --- |
| **Series** | Serie en módulo 12 o 24, con intervalos, matriz (O, I, R, RI), rotaciones, rotaciones transpuestas y multiplicaciones de intervalos. En pentagrama, los originales o las 48 formas |
| **Matriz rítmica** | Filas que rotan una lista de proporciones, anidadas hasta cuatro niveles. Da los patrones en sintaxis de Telar, las duraciones exactas y la notación |
| **Campos** | Cada campo como tabla: altura, cuartos de tono, MIDI, Hz, desviación en cents y parcial |
| **Hilos** | Cada ataque de cada voz tras los procesos: compás, inicio y duración exactos, alturas, dinámica, articulación y si suena o fue filtrado |

**Series.** Se escriben con números (`0 11 3`) o nombres (`Do Si Mib`; con módulo 24, `Do+ Re#-`). La fila `On` transpone la serie `n` unidades; `In`, `Rn` y `RIn` son su inversión, su retrógrado y el retrógrado de la inversión. Los botones generan una serie al azar o una de todos los intervalos, fijadas por la semilla. En módulo 24, las de todos los intervalos derivan de la serie en cuña, así que hay menos variedad que en módulo 12.

**Matrices rítmicas.** Con `3 1 2` y dos niveles, la primera fila es `3(1 2 3) 1(2 3 1) 2(3 1 2)`. Un valor negativo es un silencio en las hojas; un grupo anidado siempre suena por dentro.

**Salidas.** Cada pestaña descarga sus tablas en texto alineado, CSV (separado por `;`) o JSON, y **Imprimir** prepara una hoja para trabajar a mano. En Series y Matriz rítmica, los botones de la cabecera hacen sonar y exportan a LilyPond, MusicXML y MIDI ese material. En Campos e Hilos actúan sobre la pieza.

Al abrir el CSV en una hoja de cálculo, importa las columnas como texto: de lo contrario, fracciones como `1/10` pueden convertirse en fechas y patrones como `-1 2` en fórmulas.

**Del material a la pieza.** *Usar en la partitura* convierte la serie en el campo de la pieza y hace que cada voz la recorra en orden, cerca del centro de su registro. *Usar en esta voz* lleva las filas de la matriz a los ritmos de una voz, un compás por fila. Deshacer revierte ambos.

## Convenciones de escritura

- **Alteraciones:** valen solo para su nota. Se escribe becuadro si esa misma nota ya apareció alterada en el compás. Los cuartos de tono usan los signos Stein–Zimmermann.
- **Instrumentos:** en Do, a sonido real, sin transposición.
- **Tuplas:** S:M, con M ≤ S < 2M siempre que sea posible (5:4, 5:3, 7:6). Se rotula solo la cifra cuando la razón es la habitual.
- **Límites:** figura mínima 1/128 y seis tuplas anidadas, el máximo que usa Telar para MusicXML. Lo que los supera se funde en una nota y la interfaz lo avisa.
- **Picados y ligaduras:** una nota que se prolonga por ligadura pierde el picado, porque sería contradictorio.
- **Sonido:** el audio y el MIDI usan la altura escrita, es decir, el cuarto de tono más cercano y no la frecuencia exacta del espectro.

## Exportaciones

| Formato | Notas |
| --- | --- |
| **LilyPond** | Requiere 2.26. Notas neerlandesas, haces manuales y tuplas anidadas. El bloque `\midi` omite el compás, porque LilyPond no admite compases irracionales en MIDI |
| **MusicXML 4.0** | Compases irracionales como `beat-type` no potencia de 2 (por ejemplo `3/10`) |
| **MIDI** | Formato 1, dos canales por voz (uno con pitch bend de +50 cents), máximo 7 voces |

Límites del MIDI:

- El formato solo admite denominadores potencia de 2. Si hay compases irracionales, no se escribe compás sino marcadores de texto, y la rejilla de un secuenciador no coincidirá con los compases. Las notas sí caen en su sitio.
- Si la resolución exacta no cabe en el archivo, cada ataque se redondea desde su posición absoluta, sin acumular deriva.

## Arquitectura

```text
nucleo/     puro y sin DOM
  fraccion    aritmética exacta (BigInt)
  ritmo       compases, patrones, árboles, división en tuplas
  armonia     alturas, campos, instrumentos
  motor       proyecto → partitura: hilos, procesos, validación
  material    series, matrices rítmicas, tablas y salidas de texto
  escritura   árbol → figuras, tuplas, haces, ligaduras, signos
  export-*    LilyPond, MusicXML, MIDI
  ejemplos    proyectos de partida
interfaz/
  ui          paneles y estado
  grabado     partitura en SVG (también se ejecuta en Node)
  tejido      vista de hilos, tiras rítmicas, curvas
  audio       síntesis con Web Audio
```

El tiempo musical es siempre racional: una duración es una fracción exacta de redonda. `escritura` es la única fuente de la grafía, y SVG, LilyPond y MusicXML leen de ella.

La fuente de notación es Leland (SIL OFL 1.1), que se carga desde `../monocordio/fonts/` sin copiarla. Telar no usa Alevi Microtonal.

## Pruebas

Desde esta carpeta:

```bash
node --test tests/
```

- **Invariantes** sobre los ejemplos y 300 proyectos al azar: cada compás suma exactamente su duración, las figuras son contiguas, toda tupla abierta se cierra y está bien anidada, cada tupla ocupa lo que promete su razón, las ligaduras unen la misma altura y las alturas respetan el ámbito.
- **Exportaciones**, con lectores independientes de XML y MIDI: duraciones por compás, tuplas por nivel, posición de cada ataque en ticks y pitch bend.
- **Con LilyPond instalado:** compila los ejemplos sin avisos y compara su MIDI con el modelo. También importa el MusicXML con `musicxml2ly` y hace la misma comparación. Estas pruebas se omiten si no encuentra LilyPond; la ruta se indica con la variable `LILYPOND` y por defecto es `D:/lilypond-2.26.0/bin/lilypond.exe`.
- **Material:** propiedades de la matriz en módulos 12 y 24, las 48 formas, series de todos los intervalos, invariantes de compás en las matrices rítmicas, formatos de texto, y que una serie llevada a la pieza suene en orden en cada voz.
- **Grabado:** sin números inválidos, mapa de tiempo monótono y figuras sin solaparse.
