# NMA-0001 — Modelo matemático de alturas e intervalos

**Clase:** NORM · **Edición:** 0.1-draft · **Estado:** revisión abierta  
**Licencia:** GNU FDL-1.3-or-later (sin secciones invariantes).

## 1. Objeto

Definir sin dependencia tipográfica las operaciones de medición, expresión
y composición de intervalos y alturas para afinaciones microtonales. La
notación tradicional y su grafía se especifican separadamente en NMA-0002.

## 2. Altura sonora y referencia

Una frecuencia física se representa por `f ∈ ℝ_{>0}`, expresada en hertz
(si es una altura periódica estable). Dos frecuencias `f₁,f₂` determinan
un **intervalo orientado** como razón positiva

\[
I(f_1,f_2)=\frac{f_2}{f_1}.
\]

El grupo de intervalos es `(ℝ_{>0},·,1)`. La octava es `2/1`; la
quinta justa de razón es `3/2`. Un intervalo descendente admite razones
`0 < I < 1`: no se emplean frecuencias negativas.

La coordenada logarítmica en cents es

\[
C(I)=1200\log_2 I.
\]

**Teorema 1 (homomorfismo)**:
\(C(IJ)=C(I)+C(J)\) y \(C(I^{-1})=-C(I)\), por las identidades del
logaritmo. La función es biyectiva de `ℝ_{>0}` a `ℝ`, inversa de
\(c\mapsto 2^{c/1200}\).

El hertz de una nota dada no se infiere de su nombre escrito sin conocer
la frecuencia de referencia y el sistema de afinación.

## 3. Intervalos de razón exacta (JI)

El constructor `ratio(p,q)` recibe enteros positivos `p,q` y denota
exactamente `p/q`. Los campos se reducen por el máximo común divisor
y el denominador se mantiene positivo. No DEBE convertirse a un
`float` para decidir su igualdad.

Un `ratio(3,2)` y un `edo(period=2/1, divisions=12, steps=7)`
son **intervalos diferentes**: sus coordenadas en cents son,
respectivamente,

\[
1200\log_2(3/2)\approx 701.955000865\quad\text{y}\quad700.
\]

La expresión decimal es una aproximación de presentación: el tipo canónico
de la quinta de razón sigue siendo `ratio(3,2)`.

## 4. División igual de un período declarado

Sea `P > 1` la razón del período, `N∈ℤ_{>0}` su número de partes y
`k∈ℤ` la cantidad orientada de pasos. Se define

\[
\operatorname{ediv}(P,N,k)=P^{k/N}.
\]

`P` se representa mediante una razón exacta positiva. Su amplitud en
cents es \(1200\frac{k}{N}\log_2 P\). Para `P=2/1` se habla de
**N-EDO** y la amplitud es el número racional exacto `1200k/N`
cents. Una quinta de 12-EDO son `7` pasos y exactamente `700` cents.

La escritura de un intervalo `ediv(3/1,13,1)` es igualmente válida
para un período *no octavante*; NO DEBE interpretarse como 13-EDO.

Dentro de un mismo sistema (P,N), los pasos se suman exactamente:

\[
\operatorname{ediv}(P,N,k_1)\,
\operatorname{ediv}(P,N,k_2)
=\operatorname{ediv}(P,N,k_1+k_2).
\]

La reducción del exponente `k/N` conserva el intervalo acústico, pero
el perfil original (P,N) DEBE seguir disponible como procedencia.

## 5. Cents racionales exactos

`rational-cents(p,q)` denota el número racional `p/q` de cents, que
corresponde exactamente a la razón

\[
I=2^{p/(1200q)}.
\]

Es una **representación logarítmica exacta**, aunque `I` sea irracional;
no debe confundirse con `ratio(p,q)` que denota una razón racional física.

Los autores PUEDEN comunicar medidas experimentales de frecuencia con un
campo separado de incertidumbre y unidades. Una medida decimal no es por
sí sola un valor matemático exacto.

## 6. Unidad de tono: especificación de perfil

Una fracción verbal `m/n de tono` carece de interpretación universal.
Para el perfil `tone-12tet` se fija **por definición**:

\[
1\ \mathrm{tono}:=200\ \mathrm{cents}.
\]

Entonces `m/n` de tono representa exactamente
\(200m/n\) cents, cuya razón es \(2^{m/(6n)}\).

| Fracción del tono definido | Cents exactos | EDO de un paso equivalente |
| --- | --- | --- |
| 1/2 | 100 | 12-EDO |
| 1/4 | 50 | 24-EDO |
| 1/6 | 100/3 | 36-EDO (2 pasos de 72-EDO) |
| 1/8 | 25 | 48-EDO |
| 1/12 | 50/3 | 72-EDO |

Esto no afirma que todas las tradiciones históricas compartan ese tono
de referencia. Una notación para un temperamento regular, un modo cultural
o un intervalo puro DEBE documentar su propia semántica.

**Lema 2:** el octavo de tono del perfil 12-TET (25 cents) no equivale a
ningún número entero de pasos en 72-EDO, ya que `25/(1200/72)=3/2`.
Es representable exactamente en 48-EDO y en 144-EDO.

## 7. Reglas de normalización y exactitud

Una implementación conforme al perfil **NMA-MATH-0.1**:

- DEBE rechazar frecuencias y razones no positivas.
- DEBE preservar enteros de precisión arbitraria para numeradores y
  denominadores; no truncarlos a IEEE-754.
- DEBE reducir la representación canónica de razones racionales y del
  exponente de división igual.
- DEBE conservar la referencia de frecuencia como parte del contexto de
  altura absoluta, sin asumir globalmente A4=440 Hz.
- DEBE preservar la representación simbólica al mostrar una aproximación
  decimal.
- NO DEBE declarar acústicamente iguales `ratio(3,2)` y siete pasos
  de 12-EDO.
- DEBE declarar explícitamente error y resolución al cuantizar un
  intervalo para MIDI o para un formato decimal.
- PUEDE realizar cálculos de visualización con punto flotante, siempre
  que el estado canónico permanezca exacto.

## 8. Identidad, equivalencia y notación

**Identidad estructural:** dos objetos son idénticos si su constructor y
parámetros canonizados coinciden.

**Equivalencia acústica:** dos expresiones pueden denotar la misma razón
real sin tener idéntico constructor (p. ej., `ediv(2/1,12,2)` y
`ediv(2/1,24,4)`). El proyecto definirá reglas verificables para clases
de equivalencia decidibles; NO DEBE reemplazar comparaciones simbólicas
por un umbral arbitrario de cents.

**Equivalencia notacional:** dos alturas acústicamente equivalentes
pueden escribirse con grafías diferentes. El nombre de nota o el glifo
no es una clave única para la altura sonora.

## 9. Casos normativos de referencia

| Caso | Constructor | Resultado |
| --- | --- | --- |
| Quinta pura | ratio(3,2) | 660 Hz si f₀=440 Hz |
| Quinta 12-EDO | ediv(2/1,12,7) | 700 cents exactos |
| Cuarto ascendente de tono | rational-cents(50,1) | razón 2^(1/24) |
| Sexto descendente | rational-cents(-100,3) | razón 2^(-1/36) |
| Octavo ascendente | ediv(2/1,48,1) | 25 cents exactos |
| Doceavo descendente | ediv(2/1,72,-1) | -50/3 cents exactos |

## 10. Temas abiertos

1. Modelo explícito de *coma* como elemento de diferencias entre afinaciones.
2. Espacios reticulares para intervalos de rango superior y temperamentos.
3. Afinaciones no periódicas y contexto de altura móvil.
4. Pruebas formales de equivalencia simbólica entre tipos distintos.
5. Medidas psicofísicas y tolerancias: **informativas**, no igualdad matemática.

La v0.1 se limita a la semántica formal expuesta, sin adoptar el nombre de
ningún método histórico como identidad universal del sistema.
