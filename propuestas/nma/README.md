# NMA — Notación Microtonal Abierta

> **Estado:** incubación, borrador de propuesta, NO un estándar ratificado.  
> **Edición:** 0.1-draft · 10 de octubre de 2026  
> **Ámbito:** acústica, afinación, escritura y representación tipográfica interoperable.  
> **Relación:** proyecto derivado conceptualmente del laboratorio *La música de las esferas*, pero independiente de su implementación y del repositorio/fuente Esferas Microtonal Prototype.

## Visión

Proponer una especificación abierta de notación microtonal con rigor matemático,
que distinga sin ambigüedad:

1. **Altura física**: frecuencia y razón de frecuencias.
2. **Modelo de afinación**: entonación justa, división igual (EDO/EDx),
   temperamentos regulares y otros perfiles explícitos.
3. **Escritura o grafía musical**: nombre de nota, octava, alteración y contexto.
4. **Glifo tipográfico**: forma visual, métricas y código existente de SMuFL
   cuando corresponda.
5. **Realización digital**: datos exactos, serialización, exportación con informe
   de pérdida si el formato de destino no preserva la semántica exacta.

La especificación no confundirá un intervalo de razón `3/2` con un intervalo
temperado de `700` cents. Tampoco llamará universal al concepto de *tono*:
las subdivisiones `1/4`, `1/6`, `1/8` y `1/12` de tono se definen en
un **perfil** cuyo tono de referencia sea expresamente `200 cents`.

## Documentos normativos iniciales

- [NMA-0000 — Carta fundacional](spec/NMA-0000-carta-fundacional.md).
- [NMA-0001 — Matemática de alturas e intervalos](spec/NMA-0001-modelo-matematico.md).
- [NMA-0002 — Semántica de la notación e interoperabilidad](spec/NMA-0002-notacion-e-interoperabilidad.md).
- [NMA-0003 — Gobernanza, conformidad y propuestas](spec/NMA-0003-gobernanza-y-conformidad.md).
- [Política de licencias GNU](LICENSING.md).
- [Programa de investigación y fuentes externas](RESEARCH.md).

## Prototipo reproducible

El archivo `src/nma_core.py` ofrece operaciones matemáticas **con fracciones
exactas**, sin guardar la altura únicamente en `float`. No depende de
ninguna fuente tipográfica. El programa `tests/test_core.py` verifica
inversión, composición, igualdad de representaciones equivalentes y
la diferencia matemática entre una razón racional y una fracción temperada
de tono.

```bash
cd propuestas/nma
python3 -m unittest discover -s tests -v
```

La serialización JSON de muestra está en `examples/`. La propuesta separa
entornos de prueba del núcleo normativo.

## Interoperabilidad sin apropiación de estándares existentes

- **SMuFL**: usar identificadores de glifo existentes, nunca inventar
  significados nuevos para códigos registrados.
- **MusicXML**: exportar la altura de la forma compatible; una fracción
  periódica como `1/3` de semitono puede exigir extensión propia para
  conservarse de manera exacta porque `<alter>` es decimal.
- **Scala .scl y .kbm**: conservar razones y escalas, con mapeos de teclado
  independientes; `.scl` no codifica por sí solo la ortografía en pentagrama.
- **MIDI Tuning**: salida cuantizada declarando resolución/error. El MIDI
  heredado no debe convertirse en la representación canónica.

Los tres subsistemas —semántica de afinación, grafía y codificación— tienen
distintos requisitos de interoperabilidad y distintos tests.

## Libertades y licencias

El propósito es **software libre bajo licencias GNU**, sin afirmar afiliación
institucional al Proyecto GNU ni respaldo de la Free Software Foundation.

- Software, esquemas de datos ejecutables, pruebas: **GNU GPL-3.0-or-later**.
- Especificación, documentación, manuales: **GNU FDL-1.3-or-later**,
  sin secciones invariantes ni textos de cubierta.
- Fuente tipográfica **propia**, cuando se publique: GPL-3.0-or-later **con
  la excepción oficial de incrustación de fuentes de GNU**, tras confirmar
  autoría y titularidad de todos los contornos.

Las fuentes de terceros SIL OFL (Leland/Ekmelos/Bravura) seguirán con sus
licencias propias: **no pueden simplemente cambiarse a GPL**. MIDIDESI/Tempera
se estudia como precedente histórico; sus contornos y binarios no se usan.

Las licencias están completas en `LICENSES/`. Véase `LICENSING.md` para
condiciones, atribución y futuras contribuciones.

## Contribuir

El borrador está abierto a compositores, grabadores, matemáticos,
microtonalistas, programadores y representantes de tradiciones de afinación
no occidentales. Una propuesta no se adopta por autoridad personal: debe
definir significado, alcance, ejemplos, pruebas y compatibilidad.

Las propuestas aceptadas deberán mantenerse versionadas. No se declarará
ningún perfil *estándar* por sí solo antes de revisión comunitaria.

## Hoja de ruta

**Fase 0 — RFC de fundamentos**: modelos exactos, perfiles y pruebas.
**Fase I — Notación**: registro de sistemas, contextos, equivalencia y
composición de signos.
**Fase II — Tipografía**: fuente con contornos originales, licencia GNU más
excepción y metadatos de métricas/alineación.
**Fase III — Interoperabilidad**: MusicXML, SMuFL, Scala y audio/MIDI.
**Fase IV — Validación pública**: pruebas intereditor, revisión por músicos,
accesibilidad, gobernanza y candidato a estándar 1.0.

Este directorio se ha creado como **incubadora en una rama aislada**; el
proyecto tiene vocación de repositorio independiente. No modifica la web
publicada ni los PR #4/#5 del monocordio.
