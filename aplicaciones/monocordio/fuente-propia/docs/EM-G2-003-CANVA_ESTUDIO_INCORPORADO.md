# EM-G2-003 — Incorporación del estudio Alevi Microtonal v0.2 (Canva)

**Proyecto:** Esferas Microtonal / G2.2  
**Fecha:** 10-10-2026  
**Autor del material aportado:** titular de este proyecto, mediante archivo entregado
`Alevi-Microtonal-v02.zip`  
**Estado:** `INCORPORADO_AL_CORPUS_DE_DISENO_PENDIENTE_DE_ADOPCION_TIPOGRAFICA`  
**PR:** #5, rama `feature/monocordio-fuente-microtonal-original`  
**No afecta:** PR #4 (monocordio), PR #6 (NMA) ni `main`.

## I. Instrucción y preservación

El autor informó que la integración con Canva había encontrado soluciones
gráficas especialmente buenas y autorizó expresamente: «Sí, incorpórala».

Se conservan en:

`v02/propuestas-canva/alevi-v02/`

- generador original `construir.py`;
- archivo paramétrico de contornos `base-v01.json`;
- `LEEME.txt` y `mapa.csv`;
- 13 SVG originales correspondientes a los cinco signos tradicionales y
  a ocho alteraciones microtonales;
- un registro semántico **adicional** con fracciones y cents exactos;
- una página HTML comparativa para inspección a tamaño de pauta.

Los archivos originales de texto y glifo se conservaron **byte por byte**,
verificados mediante SHA-256 de los originales del ZIP recibido. El
generador reproduce los trece SVG y el mapa sin cambios.

**Fuente exacta aportada:** `Alevi-Microtonal-v02.zip`,
SHA-256 `5adf7feace8c4d960baa00540e0404efe82bffccd0a66636914f38811f1a49ee`.

No se versionan ni redistribuyen el TTF binario ni la captura PNG
incorporados al ZIP. El TTF se reconstruye **transitoriamente** para
validación, y la muestra SVG se almacena como artefacto de QA.
Los metadatos del TTF original dicen `Alevi Microtonal Regular`,
v0.2, `UPM=1000`, 13 glifos visuales y ocho códigos privados
`U+F000…U+F007`.

## II. Valores exactos

Para el perfil de tono temperado de 200 cents:

| Familia | Ascenso | Descenso |
| --- | --- | --- |
| Cuarto de tono | +50 cents | −50 cents |
| Sexto de tono | +100/3 cents | −100/3 cents |
| Octavo de tono | +25 cents | −25 cents |
| Doceavo de tono | +50/3 cents | −50/3 cents |

El CSV aportado expresa algunas fracciones mediante flotantes
(`33.333333333333336` y `16.666666666666668`). El nuevo JSON
`REGISTRO_CANVA_NMA_v0.2.json` conserva numerador y denominador
enteros, sin substituir la versión original de `mapa.csv`.

## III. Hallazgos que requieren armonización

El material es visualmente una alternativa valiosa, pero
**no se identifica sin más con el repertorio G1/G2.1 aprobado**.

### 1. Bemol inverso −¼

`toneQuarterDown` presenta una forma de panza **cerrada**.
La elección histórica aprobada para un cuarto de tono descendente
es el **bemol inverso abierto Stein–Zimmermann**, SMuFL E280.

**Resolución provisional:** conservar el archivo exacto como candidato,
pero mantener **LilyPond E280** para el signo estándar en cualquier
perfil que lo identifique como Stein–Zimmermann.

### 2. Sexto ascendente +⅙

`toneSixthUp` usa un asta y una barra. Esta gramática es próxima a
`accidentals.sharp.slash.stem` de LilyPond, que en su sistema
representa un **medio sostenido (+¼ de tono)**.

**Resolución provisional:** no normalizarlo ni adoptarlo hasta que
se distinga inequívocamente del símbolo histórico, incluso a
pauta de siete píxeles por espacio.

### 3. Sexto descendente −⅙

`toneSixthDown` usa un arco inverso abierto que, a tamaño pequeño,
puede confundirse con el cuarto descendente. No se declara
idéntico: la similitud es **de lectura**, no una prueba de coincidencia
de coordenadas.

**Resolución provisional:** estudio de reconocimiento ciego
contra LilyPond E280.

### 4. Octavos y doceavos

Se incorporan sus cuatro dibujos como candidatos.
Los remates en escuadra de los octavos y las barras adicionales
de los doceavos son soluciones interesantes. Requieren comparación
a escala de pauta real, revisión de peso y una gramática que no
contradiga el registro semántico NMA.

## IV. Genealogía y derechos

El ZIP contiene la afirmación de que sus contornos son originales,
inspirados en el estilo de LilyPond. **No contiene** una licencia
escrita para el paquete.

La documentación anterior de Esferas aprobó como signos madre
los **contornos extraídos directamente de GNU LilyPond/Emmentaler**
bajo su opción de licencia GNU GPL con excepción de incrustación de
fuentes. Los cinco `accidental*.svg` del paquete Canva
proceden de otro generador (`base-v01.json`), por lo que **no
son ni sustituyen esas madres de Emmentaler**.

Para una futura publicación GPL de Alevi Microtonal:
1. confirmar titularidad y autorización de contribuciones;
2. decidir si se reutilizarán exclusivamente los contornos nuevos
   o se construirán derivados de LilyPond con su atribución;
3. documentar la excepción oficial de incrustación cuando corresponda;
4. efectuar QA de originalidad y compatibilidad SMuFL.

Incorporar este estudio al repositorio en una rama de trabajo
**no constituye ratificación de su licencia GNU definitiva**.

## V. Verificaciones y próximo hito

La suite `v02/test_canva_archive.py` garantiza:

- fuentes originales verificadas mediante huellas SHA-256;
- regeneración fiel de los trece SVG y el CSV;
- 13 glifos en una fuente TrueType construida transitoriamente;
- ocho códigos privados explícitos, sin proclamación SMuFL;
- valores fraccionarios exactos y conflicto con los acuerdos previos;
- ninguna sustitución de los generadores G1/G2.1.

La página `comparador.html` permite revisar las ocho microalteraciones
en grande y sobre una pauta sin tener que instalar la fuente.

**Control pendiente:** selección formal de los contornos que puedan
incorporarse a Esferas Microtonal, corrección de los tres conflictos
apuntados, confirmación del régimen GNU y ratificación visual antes
de sustituir cualquier familia tipográfica del monocordio.

**Prohibido interpretar esta autorización como un merge o una publicación.**
