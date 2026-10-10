# Esferas Microtonal — prototipo de fuente propia

## Objetivo y procedencia

Construir una tipografía TTF original para el laboratorio **La música de las esferas**, basada en **conceptos musicales generales** y no en los contornos tipográficos ajenos.

Referencia histórica de terminología: Christian Texier, *MIDIDESI* (1993–2002), familia **Tempera**, catálogo de fracciones de tono, pp. 18–19. El documento contiene una tabla de modificaciones de tono y una aproximación de pitch-bend MIDI de 0 a 127 (centro 64). **Las curvas y archivos de MIDIDESI no se han extraído ni transformado**, y su mapa de teclado no se ha reutilizado.

Esta fuente se genera exclusivamente mediante polígonos, rectas, trazos engrosados y contornos calculados originalmente por `build_font.py`. No mezcla código fuente o font data de otras familias.

## Primera cobertura: exactamente las cinco familias del laboratorio

| Fracción | Desviación exacta | Código |
|---|---:|---|
| Bemol (−1/2 tono) | −100 cents | SMuFL U+E260 |
| Becuadro | 0 cents | SMuFL U+E261 |
| Sostenido (+1/2 tono) | +100 cents | SMuFL U+E262 |
| Bemol inverso abierto Stein–Zimmermann (−1/4) | −50 cents | SMuFL U+E280 |
| Medio sostenido Stein–Zimmermann (+1/4) | +50 cents | SMuFL U+E282 |
| Sextos ±1/6 | ±100/3 cents | U+F0001 y U+F0002 |
| Octavos ±1/8 | ±25 cents | U+F0003 y U+F0004 |
| Doceavos ±1/12 | ±50/3 cents | U+F0005 y U+F0006 |

**Los códigos U+F0001–U+F0006 son personalizados, no símbolos SMuFL ni correspondencias de MIDIDESI.** El uso de valores suplementarios de la Private Use Area minimiza la posibilidad de colisión con los códigos SMuFL (que están en el BMP). Algunas aplicaciones de partituras antiguas no soportan directamente estos códigos; están dirigidos inicialmente al navegador web.

Las formas de cuarto de tono Stein–Zimmermann son convencionales: el bemol inverso mantiene la panza abierta y el asta a la derecha. Los diseños de sextos, octavos y doceavos son **extensiones geométricas originales** con semántica explícita en el manifiesto JSON.

## Construcción local

Requisitos: Python 3.10+ y `fonttools`; opcionalmente `pillow` para una imagen.

```sh
python3 -m pip install fonttools pillow
cd aplicaciones/monocordio/fuente-propia
python3 build_font.py --out build/EsferasMicrotonal-Prototype.ttf
python3 -m unittest -v test_font.py
python3 preview_font.py --font build/EsferasMicrotonal-Prototype.ttf --out build/vista.png
```

Esto genera localmente **el TTF y un manifiesto JSON**; el TTF no se incorpora a Git. Las pruebas de CI generan el TTF de forma transitoria y publican **solo la previsualización PNG y el manifiesto**, nunca un archivo tipográfico binario.

## Límites editoriales

- El TTF es una primera prueba de ingeniería tipográfica, **no es todavía la tipografía oficial del proyecto**.
- No reemplaza la actual elección Leland/Ekmelos ni modifica el módulo `notacion-glyphs.mjs`.
- La licencia de eventual distribución y el nombre definitivo quedan **pendientes de una decisión expresa del autor**.
- Para extender el catálogo de fracciones de MIDIDESI, deben diseñarse nuevas reglas de construcción independientes; no debe importarse ni calcarse su tipografía ni reproducirse su arreglo gráfico protegido.

Fuentes públicas de control: SMuFL (W3C Music Notation Community Group); fuentes originales del catálogo de Tempera disponibles en la documentación histórica del autor del proyecto.
