# Esferas Microtonal v0.2 — Informe G1: reconstrucción de signos madre

**Unidad:** EM-G1-001  
**Estado:** `BOCETOS_TTF_GENERADOS_PENDIENTES_DE_REVISION_VISUAL_DEL_AUTOR`  
**Fecha:** 2026-10-10  
**Contrato vigente:** G0 (documentación v0.2) aprobado expresamente; G1 en evaluación.

> **REGISTRO HISTÓRICO / SUSTITUIDO:** el autor decidió
> posteriormente utilizar directamente las matrices de GNU LilyPond.
> Los contornos originales independientes de este informe no son
> la referencia vigente. Véase
> [EM-G1-002](./EM-G1-002-LILYPOND_REFERENCIA.md).
> El prototipo se conserva para comparar procesos, no para publicarlo.

## Resultado entregado

Se ha escrito un **generador nuevo**, `v02/build_mothers.py`, que crea
solamente los tres signos madre convencionales:

| Signo | Nombre SMuFL | Código | Componentes independientes |
| --- | --- | --- | --- |
| Bemol | `accidentalFlat` | `U+E260` | `B_V, B_CURVE_R, B_OPEN` |
| Becuadro | `accidentalNatural` | `U+E261` | `N_VL, N_VR, N_HS, N_HI` |
| Sostenido | `accidentalSharp` | `U+E262` | `V_L, V_R, H_S, H_I` |

Los contornos se generan desde segmentos y curvas paramétricas originales.
No se importan archivos, coordenadas, mapas tipográficos ni outlines
de MIDIDESI, Leland, Bravura ni otra fuente musical externa. No se afirma
que los signos madre hayan sido inventados en este proyecto.

El módulo declara explícitamente `UPM=1000` y espacio de pauta
`s=250` unidades. El grosor principal del boceto es `25` unidades
(`0,10s`); travesaños `20` (`0,08s`), curva `23`
(`0,092s`). Son **parámetros de estudio**, no métricas finales.

## Cambios concretos respecto a los defectos de la v0.1

- **Becuadro:** dos astas de diferente extensión vertical, con dos
  travesaños separados y oblicuos; se abandona la figura rígida anterior.
- **Sostenido:** astas finas con pequeños ajustes de inclinación y
  travesaños paralelos; sin polígonos de relleno masivo.
- **Bemol:** asta fina y panza a la derecha, abierta, realizada a partir
  de una curva construida por el proyecto; se evitan cuerpos macizos.
- **Presentación:** comparación grande para inspección de contornos y
  pauta real con `s=7,9,12,16` píxeles.

El becuadro conserva su **función de cancelación contextual**.
La fuente en sí no almacena un valor universal de cero cents.

## Qué se ha comprobado automáticamente

El conjunto `v02/test_mothers.py` prueba:

1. correspondencia de códigos SMuFL y cobertura restringida a las tres madres;
2. estructura verdadera TTF, UPM, metadatos y procedencia declarada;
3. grosores normalizados sobre el espacio de pauta;
4. número de contornos y tokens morfológicos;
5. asimetría de astas y caja del becuadro;
6. anchos, avances y altura de los glifos;
7. ausencia de extensiones microtonales todavía no aprobadas.

Además, el workflow genera el TTF **de manera transitoria** y publica
solamente el PNG de prueba y su manifiesto, sin distribuir un archivo de
fuente al usuario. El TTF v0.1 y su generador permanecen intactos.

## Próxima revisión visual G1

La lámina deberá evaluarse especialmente con estos criterios:

- ¿Los trazos son suficientemente elegantes y económicos?
- ¿El becuadro se reconoce como signo natural y ya no como una figura H?
- ¿La curva del bemol tiene una contraforma adecuada?
- ¿El sostenido mantiene identidad a `s=7` y `s=9` píxeles?
- ¿La separación respecto de la cabeza de nota resulta musical?
- ¿Hace falta compensación óptica extra para lectura a tamaño muy pequeño?

**No se ha superado todavía la puerta G1 de aprobación visual.**
La confirmación humana de las tres madres es requisito previo para
derivar cuartos, octavos, tres cuartos y demás alteraciones.

## Protección de versiones

- `build_font.py` (v0.1) NO se modifica.
- `notacion-glyphs.mjs` y el monocordio web NO se modifican.
- PR #5 permanece borrador y apilado sobre PR #4.
- No se publica el TTF como tipografía definitiva.
- El proyecto NMA conserva su rama independiente.

El ejercicio G1 prueba **dibujos y estructura**, no la función de
afinación: esa función permanece en los perfiles matemáticos separados.
