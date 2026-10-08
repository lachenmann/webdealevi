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
