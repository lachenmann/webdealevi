# Esferas Microtonal — Registro de decisiones de diseño v0.2

**Identificador:** EM-DEC-023 · **Fecha:** 2026-10-10  
**Política:** ninguna propuesta pasa a `APROBADA` por la sola generación
de este registro. Los acuerdos sobre principios y las hipótesis de dibujo
tienen estados diferenciados.

## Convenciones de estado

- **FIJADA POR EL AUTOR**: criterio expresado explícitamente.
- **PROPUESTA TÉCNICA**: deducción o desarrollo aún no ratificado.
- **PENDIENTE DE ESTUDIO**: requiere lectura de partituras/fuentes o bocetos.
- **RECHAZADA**: solución cuyo uso final se ha descartado.
- **EN PROTOTIPO v0.1**: existe en el TTF anterior; no implica continuidad.

| ID | Decisión o hipótesis | Estado | Fundamento | Siguiente acción |
| --- | --- | --- | --- | --- |
| EM-D001 | Abandonar contornos pesados y poligonales macizos de v0.1 | **FIJADA POR EL AUTOR** | Los signos de la lámina resultan grandes, toscos y poco económicos para impresión | Redibujar desde matrices |
| EM-D002 | Partir de bemol, becuadro y sostenido correctos | **FIJADA POR EL AUTOR** | Legibilidad y parentesco visual con notación musical | Auditar madres |
| EM-D003 | Becuadro v0.1 dibujado incorrectamente | **FIJADA POR EL AUTOR** | La figura no satisface la estructura convencional | Rehacer dos astas asimétricas y dos conectores |
| EM-D004 | Preferir quitar/añadir trazos y usar inversión controlada | **FIJADA POR EL AUTOR** | Sistema derivativo y consistente | Gramática de componentes |
| EM-D005 | +¼ con una asta menos respecto del sostenido | **FIJADA POR EL AUTOR / REFERENCIA CONVENCIONAL** | Medio sostenido Stein–Zimmermann | Contrastar con E282 |
| EM-D006 | +⅛ con un asta menos y sin travesaño inferior | **HIPÓTESIS DEL AUTOR** | Reducción de sostenido a dos trazos | Especímenes + prueba de lectura |
| EM-D007 | +⅜ como sostenido sin travesaño inferior | **PROPUESTA TÉCNICA, NO RATIFICADA** | Interpolación sugerida en el diálogo, no atribuida al autor | Confirmar legibilidad, genealogía y autorización |
| EM-D008 | +¾ con un asta adicional en familia sostenido | **HIPÓTESIS DEL AUTOR / HISTÓRICAMENTE MOTIVADA** | Comparar con variante de un sostenido y medio | Cotejo concreto con Stein E283 |
| EM-D009 | Bemol inverso de ¼ **abierto** es estándar, no invención personalizada | **FIJADA POR EL AUTOR / VERIFICADA SMuFL** | `accidentalQuarterToneFlatStein` E280 | Mantener identidad y trazo hueco |
| EM-D010 | Derivar los descendentes del bemol sin pictogramas negros | **FIJADA POR EL AUTOR** | Coherencia y economía | Bocetos −⅛, −⅜, sextos y doceavos |
| EM-D011 | Sextos y doceavos en una misma familia visual de trazos | **PROPUESTA TÉCNICA** | Evitar repertorio de figuras aisladas | Investigación sin forzar una falsa monotonía |
| EM-D012 | Lectura a tamaño real y medida de tinta, no solo ampliación | **PROPUESTA TÉCNICA** | Problema visual v0.1 | Validar protocolo M01–M08 |
| EM-D013 | Cents y razones exactas independientes de los glifos | **FIJADA COMO PRINCIPIO MATEMÁTICO DEL PROYECTO** | Evitar inferir afinación por líneas | Conformidad NMA |
| EM-D014 | Fuente futura GNU GPL-3.0-or-later con excepción oficial de fuente | **PROPUESTA DE LICENCIAMIENTO** | Objetivo software libre GNU | Revisar titulares y avisos |
| EM-D015 | Mantener Leland en el monocordio mientras madura la v0.2 | **DECISIÓN OPERATIVA** | No comprometer v1.3 | No tocar CSS ni JS publicados |
| EM-D016 | No identificar un octavo de tono en 72-EDO con un solo paso | **VERIFICADA MATEMÁTICAMENTE** | 25/ (1200/72) = 3/2 | Conservar perfil EDO correcto |
| EM-D017 | Basarse DIRECTAMENTE en los signos madre originales de LilyPond | **FIJADA POR EL AUTOR** | Emmentaler/Feta: bemol, becuadro, sostenido | Estudio G1 derivado bajo GPL y excepción de incrustación; EM-G1-002 |
| EM-D018 | Archivar matrices independientes de primer G1 como referencia histórica | **DECISIÓN OPERATIVA** | Sustituidas por fuentes originales LilyPond licenciadas | Preservar EM-G1-001 sin emplearlo en la v0.2 |
| EM-D019 | Retener la gramática formal, pero separar componentes de la topología real de LilyPond | **PROPUESTA TÉCNICA** | Los outlines originales no son necesariamente cuatro trazos independientes | Estudiar fuente METAFONT antes de escribir derivados G2 |


## Regla crítica: morfología y semántica no son la misma álgebra

`S_{1/4}` y `S_{3/8}` propuestos tienen cada uno **tres trazos**.
No debe establecerse la regla falsa «un trazo más equivale a un
incremento fijo de cents».

El orden de alturas sigue a los racionales \(200p/q\).
La geometría sigue a una gramática de inclusión, supresión y
reflexión. Su conexión es el **registro versionado del perfil**.

## Documentación de los signos convencionales

Los siguientes nombres y códigos son de SMuFL, no de Esferas:

- `accidentalFlat` — U+E260
- `accidentalNatural` — U+E261
- `accidentalSharp` — U+E262
- `accidentalQuarterToneFlatStein` — U+E280
- `accidentalQuarterToneSharpStein` — U+E282
- `accidentalThreeQuarterTonesSharpStein` — U+E283

La identificación de SMuFL verifica **identidad del símbolo** pero
no autoriza a duplicar contornos propietarios específicos. El dibujo
de Esferas tendrá una procedencia independiente.

**Fuentes técnicas para cotejo**:

- https://w3c.github.io/smufl/latest/
- https://github.com/tr-igem/ekmelos/blob/main/metadata/glyphnames.json
- Christian Texier, *MIDIDESI*, sección «Tempera», pp. 18–19;
  p. 42 (nota de derechos). Documento histórico de trabajo,
  no fuente de contornos reproducidos.

## Pendientes que requieren revisión estética del autor

1. ¿Se adoptará definitivamente el modelo `V_L+V_R+H_S` para +⅜?
2. ¿Es visualmente suficiente `V_L+H_S` para +⅛ en tamaños de partitura?
3. ¿La tercera asta de +¾ reproduce la convención que el autor desea
   o conviene otra variante histórica exacta?
4. ¿Cómo generar los descendentes fraccionarios sin formas opacas y
   sin confundirse con el bemol inverso estándar?
5. ¿Con qué rasgo adicional diferenciar sextos y doceavos de octavos
   conservando economía de tinta?
6. ¿Qué anclajes, trazos y ajustes ópticos dan mejor integración
   con Leland como control externo?
7. ¿Qué nombre y licencia exactos llevará la fuente al publicarse?

## Congelación

**Regla de seguridad:** `G0_DOCUMENTOS_LISTOS` no es
`G7_FUENTE_AUTORIZADA`. Esta iteración solamente documenta criterios.
El código de generación v0.1, el TTF resultante y la aplicación del
monocordio permanecen sin rediseñar.

## Rectificación de procedencia (posterior a EM-D016)

La expresión «no duplicar contornos propietarios» sigue siendo obligatoria
para tipografías sin permiso; **GNU LilyPond no está en ese supuesto**,
pues sus contornos se distribuyen expresamente bajo GPL con excepción
de fuente o SIL OFL. Esferas emplea la opción GNU y declara la
derivación, con los avisos de copyright oficiales. El proyecto no
atribuye a sus colaboradores el diseño de las madres originales.

Referencia: [EM-G1-002](./EM-G1-002-LILYPOND_REFERENCIA.md).
