# Alevi Microtonal — Estudio 02 (propuesta de Canva)

**Procedencia:** paquete `Alevi-Microtonal-v02.zip` aportado por el autor,
10 de octubre de 2026. SHA-256 del ZIP recibido:
`5adf7feace8c4d960baa00540e0404efe82bffccd0a66636914f38811f1a49ee`.

**Estado:** `PROPUESTA_INCORPORADA_PARA_EVALUACION`. Este material ha sido
integrado al corpus editable de Esferas Microtonal v0.2, **no** a la fuente
oficial ni al monocordio. La aprobación de la integración se refiere a
**preservar y estudiar la solución gráfica**, sin atribuirle de forma
automática carácter de signo estándar.

## Inventario recuperado

El ZIP contiene 13 glifos: cinco accidentales tradicionales y ocho
microtonales; 13 SVG editables, el generador original `construir.py`,
su maestro de contornos `base-v01.json`, el mapa de caracteres
`mapa.csv`, la documentación `LEEME.txt`, un TTF de prueba y
dos vistas gráficas.

En este repositorio se han conservado **sin modificación de sus bytes**
`construir.py`, `base-v01.json`, `mapa.csv`, `LEEME.txt`
y los **13 SVG originales**.

El archivo TTF recibido **no se versiona ni distribuye**. Se regenera
temporalmente para QA y está expresamente pendiente de revisión tipográfica.

## Qué aporta la propuesta

La lógica gráfica parte de la **familia del sostenido** (asta vertical,
travesaños oblicuos relacionados) y de **la familia del bemol inverso**,
utilizando remates y barras adicionales para distinguir las fracciones.
Es notablemente más próxima al lenguaje que desea el autor que los
primeros polígonos macizos del generador independiente v0.1.

| Glifo Canva | Fracción del tono (200 cents) | Cents exactos |
| --- | --- | --- |
| `toneQuarterUp` | +1/4 | +50 |
| `toneQuarterDown` | −1/4 | −50 |
| `toneSixthUp` | +1/6 | +100/3 |
| `toneSixthDown` | −1/6 | −100/3 |
| `toneEighthUp` | +1/8 | +25 |
| `toneEighthDown` | −1/8 | −25 |
| `toneTwelfthUp` | +1/12 | +50/3 |
| `toneTwelfthDown` | −1/12 | −50/3 |

El generador escribe los campos de cents del CSV con punto flotante.
Nuestro **registro NMA adicional**, `REGISTRO_CANVA_NMA_v0.2.json`,
conserva su significado mediante numeradores y denominadores enteros.

## Auditoría de compatibilidad con los acuerdos anteriores

**El paquete no sustituye los signos históricos que el autor aprobó
en G1 y G2.1, procedentes DIRECTAMENTE de GNU LilyPond.**

1. `toneQuarterDown`: la documentación y los contornos del paquete
   indican un **bemol inverso cerrado**. Para el cuarto descendente
   hemos fijado el **bemol inverso abierto Stein–Zimmermann**, SMuFL E280.
   El dibujo cerrado permanece como referencia del archivo, no como
   sustituto automático del signo convencional.
2. `toneSixthUp`: una asta y una barra. Esta morfología se acerca a
   `sharp.slash.stem` de LilyPond, un **medio sostenido histórico (+1/4)**.
   Requiere diferenciación visual suficiente antes de adoptarse para
   +1/6. No afirmamos que sus curvas sean idénticas.
3. `toneSixthDown`: su bemol abierto puede confundirse a tamaño pequeño
   con el bemol inverso estándar de −1/4. Su distinción debe ensayarse
   a escala de partitura.
4. `toneEighthUp`/`Down` y `toneTwelfthUp`/`Down` tienen
   caracteres reconocibles y valores explícitos, pero siguen pendientes
   de control visual y de registro tipográfico estable.
5. Los códigos `U+F000` a `U+F007` que figuran en el CSV son
   **códigos de uso privado del estudio original**, no asignaciones
   SMuFL ni códigos definitivamente adoptados por NMA.
6. El archivo `base-v01.json` representa cinco trazos de una
   propuesta independiente inspirada en el estilo clásico:
   **no es una extracción de Emmentaler** y no debe identificarse como
   fuente original aprobada de LilyPond.

## Prueba y visualización

[Comparador de las ocho alteraciones](comparador.html).

Para reproducir sin alterar los archivos conservados, ejecuta
`python3 -m unittest -v test_canva_archive.py` desde la carpeta
`v02`. La prueba utiliza un directorio temporal, reconstruye el TTF
y coteja la salida SVG y el mapa con los originales.

Para uso local exploratorio únicamente:

```bash
python3 -m pip install fonttools
cp -R alevi-v02 /tmp/alevi-microtonal-estudio
cd /tmp/alevi-microtonal-estudio
python3 construir.py
```

El generador escribe su TTF y todos los SVG **en la carpeta donde reside**;
por eso se ejecuta sobre una copia temporal para no modificar el corpus
original archivado.

## Licencias y atribuciones

El ZIP recibido **no incluye archivo de licencia**. El proyecto NMA
aspira al régimen GNU GPL con excepción de fuentes, pero **no se atribuye
automáticamente esa licencia a material externo sin resolver su
titularidad, contribución y procedencia**. Antes de publicar o
sustituir signos habrá que fijar la licencia específica de este paquete
y conservar los avisos correspondientes.

No se incluye ningún contorno procedente de MIDIDESI/Tempera en
este paquete según su documentación, pero esa afirmación de origen
es parte de la descripción recibida, no una auditoría jurídica
independiente. Las formas convencionales de Emmentaler/Feta se
mantienen con su propia licencia GNU en el prototipo aprobado G2.1.

**Próximo hito:** seleccionar, corregir y validar ópticamente las
variantes que no entren en conflicto, con los perfiles matemáticos
exactos y su genealogía claramente indicada.
