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

El pentagrama representa **alturas**, no una partitura rítmica. Presenta clave de sol, nombres científicos y alteraciones convencionales, acompañados de la desviación microtonal en **cents** respecto de un sistema temperado de 12 semitonos (12-TET) afinado a La4 = 440 Hz. Una flecha arriba/abajo indica únicamente la dirección: la cifra numérica con signo es la especificación exacta de afinación.

**Importante:** un símbolo genérico de cuarto de tono suele denotar 50 cents y no serviría para representar fielmente las desviaciones pitagóricas de pocos cents o la coma de 23,46 cents. Por ello esta versión utiliza notación de altura + corrección numérica. Podrá añadirse una representación alternativa de alteraciones específicas de coma (p. ej. HEJI) en una etapa posterior con revisión de grafías y fuentes musicales.

## v1.2 — Convención de notación avanzada

Se ofrecen dos modos para la escala pitagórica, sin afectar jamás los datos acústicos:

1. **Pitagórico exacto:** nota, alteración convencional y cents **totales** respecto de 12-TET, La4 = 440 Hz.
2. **Contemporáneo:** nota, alteración usual, signo fraccionario cuando procede y cents **residuales**, además de mostrar los cents totales para control.

Se emplea la descomposición matemática:

```text
cents totales = cents del signo fraccionario + cents residuales
```

Por ejemplo **Do4 +64,00 cents** (referencia Do4 del temperamento igual) puede escribirse con un signo de **¼ de tono ascendente (+50,00 cents)** y **corrección residual +14,00 cents**. La corrección no se suma dos veces. Para las notas pitagóricas habituales, cuya desviación es muy pequeña, es correcto que no aparezca un signo de cuarto de tono; se mantiene la alteración convencional y su desviación en cents.

### Fracciones y signos

| Subdivisión | Valor convencional | Grafía |
| --- | ---: | --- |
| ¼ tono, preferido | 50 cents | Stein–Zimmermann, SMuFL E282/E280 |
| ¼ tono alternativo | 50 cents | Ferneyhough, SMuFL E48E/E48F (grafías con cifra 4) |
| ⅙ tono | 33⅓ cents | Sims, SMuFL E2A4/E2A1 |
| ⅛ tono | 25 cents | Texto literal «⅛ tono» (sin reivindicar un glifo SMuFL propio) |
| ⅓ tono | 66⅔ cents | Ferneyhough, SMuFL E48A/E48B |
| ⅔ tono | 133⅓ cents | Ferneyhough, SMuFL E48C/E48D |
| ¾ tono bemol | −150 cents | Grisey, SMuFL E486; ascenso +150 solo en texto |

**Corrección editorial v1.2:** se rectificaron códigos SMuFL erróneos de la implementación original. El «4 con flecha» puede ser una grafía propia de Ferneyhough; para mejorar la legibilidad se selecciona por defecto el medio sostenido / bemol invertido de Stein–Zimmermann. La familia de Ferneyhough queda disponible con identificación explícita. Los códigos aquí indicados se contrastaron con las tablas oficiales de SMuFL.

Los glifos SMuFL se cargan mediante Bravura (Steinberg, licencia SIL Open Font License) desde un CDN público. Si el navegador está sin conexión o la fuente no carga, los controles presentan **etiquetas textuales** de fracción de tono con dirección, y las alteraciones convencionales se dibujan con Unicode. La ausencia de la fuente no altera el audio ni los cálculos.

Los presets fraccionarios conservan internamente la fracción exacta de cent (aunque las cifras visibles se redondeen a dos decimales). El deslizador permite modificaciones de una décima de cent. La selección de un preset no debe reducirse a esa resolución.

El explorador trabaja con **Do4 temperado**, cuya frecuencia es `440·2^(−9/12) ≈ 261,626 Hz`. Esto es deliberadamente distinto de Do4 pitagórico (`440·16/27 ≈ 260,741 Hz`). Cambiar la grafía en el explorador conserva el desplazamiento total y la frecuencia.

La flecha de una etiqueta numérica es únicamente direccional; **las flechas integradas en un glifo pertenecen al valor semántico propio de esa familia de signos**. No deben interpretarse arbitrariamente como comas pitagóricas o sintónicas.

Fuentes de los códigos de glifos y sistemas:
- https://smufl.formats.music/latest/tables/stein-zimmermann-accidentals-24-edo.html
- https://smufl.formats.music/latest/tables/other-accidentals.html
- https://smufl.formats.music/latest/tables/sims-accidentals-72-edo.html
- https://smufl.formats.music/latest/tables/extended-stein-zimmermann-accidentals.html
- https://github.com/steinbergmedia/bravura (licencia OFL)

**Limitaciones:** la sección dibuja una secuencia de alturas (no una partitura rítmica con reglas de vigencia de alteraciones). El modo contemporáneo no pretende copiar una obra particular de Grisey o Ferneyhough; adopta signos concretos de familias documentadas y define expresamente su interpretación numérica. El soporte de ⅛ de tono es deliberadamente textual hasta validar una convención y una tipografía específicas.

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
