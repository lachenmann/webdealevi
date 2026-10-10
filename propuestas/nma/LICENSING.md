# Política de licencias de NMA (borrador 0.1)

**Objetivo:** que los implementadores puedan estudiar, copiar, modificar,
redistribuir y ejecutar el software libre; que el estándar y su documentación
también puedan estudiarse, compartirse y revisarse libremente.

No implica afiliación, patrocinio, reconocimiento ni inclusión de la iniciativa
en el Proyecto GNU o en la Free Software Foundation.

## Distribución propuesta

| Material de NMA | Licencia | Observación |
| --- | --- | --- |
| Código, generadores, herramientas y pruebas | GNU GPL-3.0-or-later | Copyleft de software |
| Archivos JSON ejecutables o de conformidad | GNU GPL-3.0-or-later | Tratados como datos de software |
| RFC, especificación y manuales | GNU FDL-1.3-or-later | **Sin secciones invariantes** ni textos de cubierta |
| Fuente TTF/UFO/SFD diseñada íntegramente por el proyecto | GNU GPL-3.0-or-later + excepción GNU de incrustación de fuentes | **Aún no publicada bajo esta combinación** |
| Muestras históricas de MIDIDESI/Tempera | No distribuido | Documentación para referencia interna |
| Leland, Bravura y Ekmelos | Las licencias SIL OFL propias de cada fuente | No cabe reetiquetarlas como GPL |

## Aclaración importante: font embedding

La GNU GPL por sí sola puede imponer condiciones sobre documentos donde
se embeba una fuente GPL. La Free Software Foundation publica una **excepción
de incrustación de fuentes** para que crear, distribuir o imprimir documentos
que empleen una fuente con esa excepción no obligue, por sí solo, a
licenciar el documento completo bajo GPL.

Antes de la primera publicación del TTF final deberán completarse estos pasos:

1. Verificar originalidad y titularidad de todos los contornos y metadatos.
2. Incorporar la excepción oficial **sin alterar su redacción** en el aviso
   pertinente de la fuente y preservar la GPL íntegra.
3. Identificar a quienes poseen el copyright del programa generador, del
   diseño y de la fuente resultante.
4. Proveer los archivos fuente editables, scripts de compilación y una
   compilación reproducible.
5. Consultar con una persona especializada en licencias libres ante
   duda sobre incrustación web, uso de obras combinadas o compatibilidades.

**Fuente primaria:** https://www.gnu.org/licenses/gpl-faq.html#FontException

Se usa como modelo GNU FreeFont:
https://www.gnu.org/software/freefont/license.html

## Aviso para los RFC y la documentación

> Copyright (C) 2026, autores y contribuyentes de NMA
>
> Permission is granted to copy, distribute and/or modify this document
> under the terms of the GNU Free Documentation License, Version 1.3
> or any later version published by the Free Software Foundation;
> with no Invariant Sections, no Front-Cover Texts, and no Back-Cover Texts.
> A copy of the license is included in LICENSES/GFDL-1.3-or-later.txt.

El aviso identifica provisionalmente al colectivo de contribuyentes, pero
antes de una publicación oficial se establecerán los titulares concretos
y un archivo de atribuciones. No se asumirán cesiones implícitas.

## Aviso de código fuente

Los archivos fuente del proyecto llevan:
`SPDX-License-Identifier: GPL-3.0-or-later`.

Su texto íntegro está en `LICENSES/GPL-3.0-or-later.txt`.
Quien contribuya código deberá contar con derecho a licenciarlo en esos
términos. Se considerará un DCO público, sin imponer cesión de copyright
a la FSF ni afirmar integración en GNU.

## Fuentes exteriores, estándares y fragmentos

- Compatibilidad con SMuFL **no autoriza** usar libremente cualquier
  tipografía comercial; identificadores no son contornos.
- Todo signo adoptado de tradiciones anteriores tendrá una ficha
  de procedencia y un perfil semántico explícito.
- La documentación MIDIDESI describe las convenciones como precedente,
  pero no ofrece permiso claro para convertir o redistribuir sus archivos.
- Las fuentes bajo SIL OFL pueden utilizarse respetando **esa** licencia,
  pero no se integran automáticamente al código GPL como si compartieran
  el mismo régimen de derechos.

## Ubicación de textos completos

- [GNU GPL-3.0-or-later](LICENSES/GPL-3.0-or-later.txt)
- [GNU FDL-1.3-or-later](LICENSES/GFDL-1.3-or-later.txt)

Ambos textos se preservan íntegros, sin modificaciones.
