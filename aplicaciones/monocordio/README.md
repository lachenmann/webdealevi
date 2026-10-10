# Monocordio pitagórico — laboratorio de escala y notación

Esta aplicación forma parte del taller «La música de las esferas». El monocordio original funciona con una fundamental de La3 = 220 Hz. La sección de escala representa alturas entre Do4 y Do5; la referencia del sistema de afinación es **La4 = 440 Hz**.

## Construcción y afinación

- Desde Do, sumar una quinta ascendente equivale a multiplicar por 3/2; restar una quinta equivale a multiplicar por 2/3.
- Cada altura se reduce mediante octavas a la región [Do4, Do5).
- **Do4 = 440 · 16/27 Hz** para asegurar que La4 —tres quintas desde Do— valga 440 Hz.
- El modo de siete notas utiliza los pasos de quinta `[-1,0,1,2,3,4,5]`, es decir **Fa–Do–Sol–Re–La–Mi–Si**. En orden de alturas, las razones respecto a Do4 son:

| Nota | Razón |
| --- | ---: |
| Do4 | 1/1 |
| Re4 | 9/8 |
| Mi4 | 81/64 |
| Fa4 | 4/3 |
| Sol4 | 3/2 |
| La4 | 27/16 |
| Si4 | 243/128 |

El preset de comparación muestra **Sol♭4** (seis quintas descendentes) y **Fa♯4** (seis quintas ascendentes). Sus alturas se diferencian en `531441/524288`, es decir, aproximadamente **23,460 cents**: la coma pitagórica.

## Notación para músicos

El pentagrama representa alturas y conserva sus relaciones pitagóricas exactas. Todas las correcciones en cents son relativas al temperamento igual de doce semitonos (12-TET) con **La4 = 440 Hz**. La versión refinada utiliza alteraciones SVG dibujadas localmente, agrupadas por fracciones de tono y acompañadas de corrección residual inequívoca. Los símbolos no sustituyen ni redondean la afinación matemática.

## v1.3 — Notación microtonal unificada por signos vectoriales

El sistema es una **adaptación editorial de la lámina facilitada por el autor y atribuida por él a Danny Wier**; no se declara que cada nueva solución sea un signo histórico normalizado. Para evitar el problema de los glifos que parecían un «4 con flecha», las alteraciones se dibujan con **SVG propio**. No se carga Bravura, SMuFL ni ninguna fuente tipográfica externa para las alteraciones.

Se mantienen los dos modos del pentagrama de la escala pitagórica:

- **Exacto:** alteración cromática habitual (si procede) y desviación TOTAL en cents respecto de 12-TET, La4 = 440 Hz. La proporción racional pitagórica sigue fijando la frecuencia.
- **Contemporáneo:** misma nota, más alteraciones vectoriales cromáticas y/o fraccionarias cuando aproximan la desviación, además de cents residuales; siempre aparece el valor total.

### Fracciones elegidas (tono temperado = 200 cents)

| Subdivisión | Valor de una alteración | Signos en SVG |
| --- | ---: | --- |
| Semitono (½ tono) | ±100 cents | Bemol / sostenido tradicionales; también dobles |
| Cuarto (¼ tono) | ±50 cents | Medio sostenido (+) y **bemol inverso sin relleno** (−) |
| Sexto (⅙ tono) | ±100/3 cents | Pentágono (+) y rombo (−), según motivos compactos de la lámina |
| Octavo (⅛ tono) | ±25 cents | Indicación textual explícita ⅛↑ / ⅛↓; **extensión editorial** |
| Doceavo (¹⁄₁₂ tono) | ±50/3 cents | Cuadrado (+) y medio triángulo (−), conforme a los motivos de ≈±17 cents de la lámina |

Los valores ±33 y ±17 impresos en la referencia están redondeados; la frecuencia de la aplicación se calcula mediante las cantidades exactas `100/3` y `50/3` cents. Los signos compactos no deben identificarse sin más con los estándares de otros compositores.

### Composición de las alteraciones

El algoritmo puede combinar hasta un signo cromático (0, ±100 o ±200 cents) con **una alteración de la fracción seleccionada**. Elige la combinación que minimiza la corrección restante y, en caso de empate, la escritura con menos signos:

```text
cents totales = cents cromáticos + cents de fracción + cents residuales
```

Ejemplos (Do4 temperado de referencia):

- `+64 cents` en modo cuarto → `+50` por medio sostenido + `+14` residuales.
- `−50 cents` en modo cuarto → bemol inverso hueco, residuo cero.
- `+150 cents` en modo cuarto → sostenido `+100` y cuarto ascendente `+50`.
- `−33⅓ cents` en modo sexto → rombo `−100/3`, residuo cero.
- `+16⅔ cents` en modo doceavo → cuadrado `+50/3`, residuo cero.

**La precisión sonora no cambia** al modificar el selector, activar otro modo ni elegir otra grafía. La base del explorador es **Do4 temperado**: `440·2^(−9/12) ≈ 261,626 Hz`, distinta de Do4 pitagórico (`440·16/27 ≈ 260,741 Hz`). El deslizador permite incrementos de una décima de cent; los botones fraccionarios conservan los valores internos exactos sin redondearlos a la décima.

La interfaz incluye un **muestrario accesible** de los cinco pares de signos, con etiquetas de cents y desplazamiento horizontal para pantallas estrechas. El octavo está claramente identificado como extensión textual; no se presenta como símbolo presente en la lámina. La fotografía/imagen enviada por el autor es la referencia visual de trabajo y no se redistribuye como archivo incrustado.

### Alcance y pruebas

El pentagrama representa **alturas** (no duraciones ni reglas de vigencia de alteraciones dentro de un compás). El archivo `notacion-core.mjs` determina la altura semántica; `notacion-glyphs.mjs` dibuja los signos, y `notacion-ui.mjs` realiza las interacciones. Las pruebas verifican todas las fracciones, la grafía de bemol inverso hueco, la consistencia de cents y que cambiar la representación jamás altere las frecuencias.

## Catálogo ampliado de relaciones pitagóricas

El monocordio ofrece **19 proporciones seleccionables** clasificadas en consonancias fundamentales, intervalos diatónicos, microintervalos pitagóricos, tritonos enarmónicos e intervalos compuestos. Su longitud mínima es una cuarta parte de la cuerda, correspondiente a dos octavas sobre la fundamental.

**Convención esencial:** los botones indican proporciones exactas de **longitud**, no razones de frecuencias. Por ejemplo, la longitud 243:256 produce el limma de frecuencia 256:243. El cálculo del sonido conserva la fracción exacta aunque el control continuo redondee la posición visible.

| Intervalo | Longitud | Frecuencia respecto de la cuerda completa |
| --- | ---: | ---: |
| Coma pitagórica | 524288:531441 | 531441:524288 |
| Limma | 243:256 | 256:243 |
| Apótome | 2048:2187 | 2187:2048 |
| Tono pitagórico | 8:9 | 9:8 |
| Tercera menor | 27:32 | 32:27 |
| Tercera mayor | 64:81 | 81:64 |
| Cuarta justa | 3:4 | 4:3 |
| Quinta disminuida | 729:1024 | 1024:729 |
| Cuarta aumentada | 512:729 | 729:512 |
| Quinta justa | 2:3 | 3:2 |
| Sexta menor | 81:128 | 128:81 |
| Sexta mayor | 16:27 | 27:16 |
| Séptima menor | 9:16 | 16:9 |
| Séptima mayor | 128:243 | 243:128 |
| Octava | 1:2 | 2:1 |
| Novena mayor | 4:9 | 9:4 |
| Duodécima | 1:3 | 3:1 |
| Doble octava | 1:4 | 4:1 |

Se añade también el unísono 1:1. Estas razones solo involucran potencias de 2 y 3 (sistema pitagórico); no se presentan intervalos que requieran el factor 5 como si fueran pitagóricos.

## v1.3 — Tetraktys y las medias musicales

### La tetraktys como modelo sonoro

La **tetraktys** muestra diez puntos distribuidos en cuatro filas:
`1 + 2 + 3 + 4 = 10`. Se asigna a cada fila su número como múltiplo de frecuencia fundamental `f₀ = 220 Hz` (La3). Es un modelo pedagógico, **no** una afirmación de que el diagrama antiguo constituyera por sí mismo una partitura o una construcción organológica documentada.

| Fila | Frecuencia | Razón de frecuencia | Fracción vibrante respecto de L |
| --- | ---: | ---: | ---: |
| 1 | 220 Hz | 1:1 | 1:1 |
| 2 | 440 Hz | 2:1 | 1:2 |
| 3 | 660 Hz | 3:1 | 1:3 |
| 4 | 880 Hz | 4:1 | 1:4 |

Las relaciones internas de frecuencias son 1→2 = 2:1 (octava), 2→3 = 3:2 (quinta), 3→4 = 4:3 (cuarta). Se pueden seleccionar los puntos o sus controles accesibles, escuchar la secuencia o simultáneamente y enviar la fila seleccionada al puente.

### Media aritmética y armónica de los extremos 6 y 12

Para extremos `a = 6` y `b = 12`, las medias **de los números que representan frecuencias** son:

- Media aritmética: `A = (a+b)/2 = 9`.
- Media armónica: `H = 2ab/(a+b) = 8`.
- La media geométrica `√72 ≈ 8,485` queda entre ambas y se usa como contraste matemático; no es uno de los cuatro términos enteros.

De este modo la serie `6 : 8 : 9 : 12`, con `6 = 220 Hz`, permite escuchar las relaciones:

| Número | Papel | Frecuencia | Relación con 6 (frecuencia) | Longitud con respecto a L |
| --- | --- | ---: | ---: | ---: |
| 6 | Extremo inferior | 220 Hz | 1:1 | 1:1 |
| 8 | Media armónica | 293⅓ Hz | 4:3 | 3:4 |
| 9 | Media aritmética | 330 Hz | 3:2 | 2:3 |
| 12 | Extremo superior | 440 Hz | 2:1 | 1:2 |

Las dos medias difieren por `9:8`, el tono pitagórico. La distinción entre media de **frecuencias** y media de **longitudes** importa: al trasladar el modelo al monocordio se invierten las fracciones.

**Arquitectura:** `armonia-core.mjs` contiene todas las proporciones, el cálculo de las medias y los datos de los tonos. `armonia.mjs` dibuja ambos SVG y genera audio local mediante Web Audio API; `armonia.css` compone la interfaz. Se comunica con la vista original mediante el evento opcional `monocordio-set-fraction`. El monocordio sigue funcionando independientemente.

**Verificación:** la suite `tests/armonia.test.mjs` controla diez puntos, relaciones y medias exactas, correspondencia de las longitudes con las frecuencias del instrumento, cambio de fundamental y rechazo de datos inválidos. El audio, los controles SVG/teclado y el desplazamiento del puente requieren además una prueba manual en navegador real.

## Diagnóstico de versiones y caché del navegador

Tras actualizar el HTML a los signos vectoriales, se observó en una captura un comportamiento mixto: el HTML mostraba los nuevos botones de doceavos de tono mientras que el módulo antiguo de JavaScript escribía `+50,00 ¢` a la izquierda de la nota y seguía mencionando Stein–Zimmermann. Ello es compatible con un recurso JavaScript anterior servido desde caché.

Para evitar que las distintas piezas compartan una URL cacheada, los ocho recursos principales y todos los imports ES entre módulos incluyen la misma etiqueta de revisión: **`VEC-20261010-01`**. La página muestra el indicador `Motor SVG activo · VEC-20261010-01` únicamente cuando el módulo de notación terminó de dibujar la muestra y el ejemplo. No se debe dar por validada visualmente una captura en la que aparezca `Motor de alteraciones SVG: esperando confirmación de carga`.

Comprobación local:

```bash
cd ~/webdealevi
git switch feature/monocordio-v1.3-tetraktys-medias
git pull --ff-only
grep 'VEC-20261010-01' aplicaciones/monocordio/index.html
python3 -m http.server 8000
```

Abrir `http://localhost:8000/aplicaciones/monocordio/`, recargar completamente (`Cmd + Shift + R`) y confirmar **Motor SVG activo**. Si no aparece, revisar si el servidor se ejecutó desde una carpeta distinta, si la rama es incorrecta o si Chrome sigue reutilizando módulos antiguos. Como prueba adicional, desactivar temporalmente la caché en DevTools > Network antes de recargar.

GitHub Actions contiene un control de **Chrome headless real** que espera el indicador de motor activo y comprueba la presencia en el DOM de las figuras `quarter-sharp` y `reverse-flat-outline`. Aun con ese control, la legibilidad fina en Safari y Mac requiere revisión humana.

## Uso

Abrir `aplicaciones/monocordio/index.html` desde un servidor web estático (necesario para los módulos ES). Los controles de quinta amplían el conjunto de alturas hasta seis pasos a cada lado; el preset de siete notas y la comparación de coma sustituyen temporalmente la colección actual.

El audio se sintetiza localmente con Web Audio API y no pretende ser una grabación histórica del monocordio.

## Pruebas

Ejecutar desde la raíz del repositorio:

```bash
node --test aplicaciones/monocordio/tests/*.test.mjs
node --check aplicaciones/monocordio/escala-core.mjs
node --check aplicaciones/monocordio/escala.mjs
```

Las pruebas automatizadas verifican razones, afinación de referencia, cents y coma pitagórica. La validación visual y auditiva debe hacerse además en navegadores reales.
