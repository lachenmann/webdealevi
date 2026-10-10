# Esferas Microtonal v0.2 — Protocolo tipográfico de control de calidad

**Identificador:** EM-QA-022  
**Versión:** 0.2-draft · **Estado:** `REQUISITOS PROPUESTOS`  
**Objetivo:** convertir la crítica de «fuente demasiado grande, tosca y
oscura» en pruebas reproducibles para papel, pantalla y semántica.

## 1. Alcance y prerrequisitos

Se emplean **dos tipos diferentes de comprobación**:

- **Aritmética/máquina:** verificar códigos, morfología definida, valores
  racionales y ausencia de errores de compilación.
- **Visual/musical:** verificar reconocimiento óptico por lectores,
  colisiones, balance, diferencias y carga negra.

Una compilación TrueType satisfactoria **no aprueba** una fuente musical.
El QA de v0.1 confirmó la validez del archivo, pero el autor rechazó su
estética. Ese rechazo es una condición de entrada de este protocolo.

## 2. Láminas comparativas mínimas

Se generarán **exactamente los mismos signos** en dos versiones para
comparar v0.1 con v0.2, más Leland/Bravura como *control*, no como
plantillas para copiar.

Cada signo se examinará en:

- **4 niveles de pauta**: espacio interlineal `s=7, 9, 12, 16 px`;
- **fondo blanco y negro**, con contrastes y control de opacidad;
- pantalla ordinaria con densidades `1×` y `2×`;
- impresión simulada o real **300 y 600 dpi**;
- filas de escala, acordes y proximidad a cabezas de notas.

Un espécimen ampliado a 112 px sirve para ver defectos del trazado,
pero **no** demuestra legibilidad a tamaño musical.

## 3. Métricas cuantitativas preliminares

| ID | Magnitud | Objetivo v0.2 |
| --- | --- | --- |
| M01 | `t_main/s` | entre 0.08 y 0.12, salvo correcciones justificadas |
| M02 | `t_secondary/s` | entre 0.055 y 0.09 |
| M03 | Altura óptica | según especie, objetivo 2.0s–3.1s |
| M04 | Distancia a la cabeza de nota | no menos de 0.20s en la maqueta patrón |
| M05 | Área de tinta del glifo | idealmente 25–40% menor que v0.1 a escala equivalente |
| M06 | Contraformas abiertas | preservadas a s=7 px y 300 dpi |
| M07 | Identificación del signo | sin depender de color ni de etiqueta de cents |
| M08 | Anchura y avance | medidos y consistentes, sin colisiones por defecto |

**M05 es una hipótesis de optimización**. Se medirá por área rasterizada
tras alinear *la misma pauta y altura óptica*. No se declarará aprobada
solo por reducir arbitrariamente el número de píxeles si empeora la lectura.

Los rangos de M01–M04 son parámetros iniciales para bocetos; no
se atribuyen a normas oficiales SMuFL ni a otra tipografía concreta.

## 4. Matriz de distinción de símbolos

Debe comprobarse cada pareja **sin etiquetas**. Se consideran
especialmente sensibles:

| Pareja | Motivo de riesgo |
| --- | --- |
| +1/8 frente a +1/4 | Distinguir un solo travesaño de dos |
| +1/4 frente a +3/8 | Ambos tienen tres trazos; composición distinta |
| +3/8 frente a +1/2 | Ausencia del travesaño inferior |
| +1/2 frente a +3/4 | Tercera asta sin congestión tipográfica |
| −1/4 frente a −1/2 | Panza inversa abierta contra bemol ordinario |
| +1/12 frente a +1/8 | Proximidad de valores; evitar detalles imperceptibles |
| +1/8 frente a +1/6 | El signo no puede diferir solo por 1 px |
| +1/6 frente a +1/4 | Preservar lectura incluso en pantalla pequeña |
| ±1/12 y ±1/6 | La dirección debe ser perceptible sin girar papel |
| Becuadro frente a medio sostenido | Mantener dos astas y travesaños del becuadro |

Los candidatos que no superen la comparación se devolverán al
diseño en lugar de aceptar su ambigüedad mediante una leyenda.

## 5. Reglas específicas por familia

### Becuadro: revisión obligatoria

- [ ] Dos astas de **extensión vertical diferente** y perfiles correctos.
- [ ] Dos conectores oblicuos separados y legibles.
- [ ] Aberturas preservadas, sin caja cerrada gruesa.
- [ ] La figura no se confunde con una «H», corchete ni doble sostenido.
- [ ] Su función de cancelación se describe como **contextual**.

### Cuartos de tono Stein–Zimmermann

- [ ] El medio sostenido mantiene el parentesco con el sostenido.
- [ ] El bemol inverso está **abierto y sin relleno**.
- [ ] El asta del bemol inverso y su panza están en los lados correctos.
- [ ] Los códigos SMuFL `E280` y `E282` son los esperados.
- [ ] No se reutiliza el glifo `E480` en lugar de `E280`.

### Octavos, sextos y doceavos

- [ ] No se conservan octágonos, rombos o cuadrados macizos de la v0.1
      como signos finales.
- [ ] Los símbolos son reconocibles y ligan su construcción a una
      de las matrices de signos musicales.
- [ ] Sus distintas orientaciones conservan lectura inequívoca.
- [ ] El código personalizado y la procedencia no se disfrazan de SMuFL.
- [ ] Los valores `25`, `100/3` y `50/3` cents permanecen exactos.

## 6. Tests programáticos

Una futura suite `test_design_v02` deberá probar:

1. que un glifo aprobado solo usa primitivas registradas;
2. que `S_{1/8}`, `S_{1/4}`, `S_{3/8}`, `S_{1/2}`,
   `S_{3/4}` tienen exactamente los conjuntos de tokens especificados;
3. que `S_{1/4}` y `S_{3/8}` no se confunden aunque ambos
   tengan cardinalidad tres;
4. que cada glifo canónico tiene semántica racional exacta única **dentro
   de su perfil**;
5. que la normalización de fracciones funciona para numeradores y
   denominadores enteros;
6. que las cadenas de contornos son cerradas como trayectorias
   tipográficas allí donde sea necesario, pero que la *figura* del
   bemol inverso presenta contraforma abierta;
7. que no hay contornos degenerados, campos de avance negativos
   inesperados ni cajas incorrectas;
8. que las tablas TrueType, `cmap`, métricas y metadatos son válidos;
9. que los archivos resultantes no incorporan ni transforman binarios
   de MIDIDESI u otras fuentes de terceros;
10. que el monocordio mantiene exactamente las mismas frecuencias
    antes y después del cambio tipográfico.

## 7. Verificación con músicos

Antes de seleccionar el diseño definitivo:

- al menos una prueba a ciegas con símbolos sin sus nombres;
- lectura en un fragmento de pentagrama que mezcle signos normales y
  microtonales (sin depender de un póster);
- revisión explícita de los signos con mejor y peor reconocimiento;
- comprobación de notación en modo impreso y digital;
- registro de alternativas y argumentos de legibilidad.

Las tasas porcentuales de reconocimiento no se inventarán: deben
medirse. Hasta entonces la columna «éxito visual» se marcará
`PENDIENTE`, no `PASS`.

## 8. Umbrales de aprobación

| Puerta | Comprobación | Estado actual |
| --- | --- | --- |
| G0 | Documentos v0.2 y valores exactos | **Aprobados por el autor** · 10-10-2026 |
| G1 | Tres signos madre de LilyPond derivadas y cotejadas | **APROBADO POR EL AUTOR** · cierre de EM-G1-002; 10-10-2026 |
| G2 | Familia ascendente de trazos | **G2.1 compilado y probado** · variantes LilyPond, revisión visual pendiente; octavos y tres octavos sin signo aprobado |
| G3 | Familia descendente y signos fraccionarios | Pendiente |
| G4 | Pruebas automáticas v0.2 | Suite G1 añadida; conformidad v0.2 completa pendiente |
| G5 | Impresión, pantallas y lectura a ciegas | Pendiente |
| G6 | Licencia GNU y revisión de titulares | Pendiente |
| G7 | Aprobación del autor para sustituir v0.1 | Pendiente |

La aprobación visual de G1 por el autor **no activa G7**. Se autoriza únicamente el trabajo G2; los signos fraccionarios candidatos requerirán su propia revisión visual.

## 9. Seguridad de publicación

- Mantener la generación v0.1 intacta y reproducible.
- Crear código nuevo de fuente v0.2 en archivos separados cuando se apruebe.
- No fusionar PR #5 ni modificar el motor del monocordio por completar
  solo la documentación.
- Los acuerdos NMA sobre perfiles matemáticos siguen en su propia rama;
  la forma de glifo y la altura acústica no deben acoplarse indebidamente.
