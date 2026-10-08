/**
 * Monocordio v1.2 — motor semántico de notación.
 *
 * Convenio:
 * - offsetCents es la desviación TOTAL respecto a la nota 12-TET indicada.
 * - un glifo fraccional representa un desplazamiento fijo de ±fractionCents.
 * - residualCents es la corrección ADICIONAL al glifo.
 * - la representación jamás altera la frecuencia fuente.
 *
 * Código SMuFL contrastado con la tabla oficial W3C:
 * Cuarto de tono Stein-Zimmermann E282 (subir), E280 (bajar).
 * Cuarto de tono Ferneyhough E48E (subir), E48F (bajar).
 * Tercios Ferneyhough E48A/E48B, dos tercios E48C/E48D;
 * bemol de tres cuartos de tono Grisey E486; sextos Sims E2A4/E2A1.
 * Para el octavo se presenta una descripción textual inequívoca.
 */
export const NOTATION_SYSTEMS = Object.freeze([
  Object.freeze({ id:"quarter", label:"Cuartos de tono", fractionCents:50,
    upGlyph:0xE282, downGlyph:0xE280, family:"Stein–Zimmermann", fraction:"¼" }),
  Object.freeze({ id:"quarter-ferneyhough", label:"Cuartos de tono (Ferneyhough)", fractionCents:50,
    upGlyph:0xE48E, downGlyph:0xE48F, family:"Ferneyhough (signos con cifra 4)", fraction:"¼" }),
  Object.freeze({ id:"sixth", label:"Sextos de tono", fractionCents:100/3,
    upGlyph:0xE2A4, downGlyph:0xE2A1, family:"Sims", fraction:"⅙" }),
  Object.freeze({ id:"eighth", label:"Octavos de tono", fractionCents:25,
    upGlyph:null, downGlyph:null, family:"Indicador textual", fraction:"⅛" }),
  Object.freeze({ id:"third", label:"Tercios de tono", fractionCents:200/3,
    upGlyph:0xE48A, downGlyph:0xE48B, family:"Ferneyhough", fraction:"⅓" }),
  Object.freeze({ id:"two-thirds", label:"Dos tercios de tono", fractionCents:400/3,
    upGlyph:0xE48C, downGlyph:0xE48D, family:"Ferneyhough", fraction:"⅔" }),
  Object.freeze({ id:"three-quarters-grisey", label:"Tres cuartos de tono", fractionCents:150,
    upGlyph:null, downGlyph:0xE486, family:"Grisey (bemol)", fraction:"¾" })
]);

export const STANDARD_GLYPHS = Object.freeze({ "-1":0xE260, "0":0xE261, "1":0xE262 });
export const REFERENCE_A4 = 440;
export const REFERENCE_C4_12TET = REFERENCE_A4 * 2 ** (-9/12);

export function getSystem(id) {
  const found = NOTATION_SYSTEMS.find(system => system.id === id);
  if (!found) throw new RangeError("Sistema de notación no reconocido.");
  return found;
}
export function centsToFrequency(referenceHz, cents) {
  if (!Number.isFinite(referenceHz) || referenceHz <= 0 || !Number.isFinite(cents)) {
    throw new RangeError("Frecuencia de referencia positiva y cents finitos.");
  }
  return referenceHz * 2 ** (cents / 1200);
}
export function frequencyToCents(frequencyHz, referenceHz) {
  if (!Number.isFinite(frequencyHz) || frequencyHz <= 0 ||
      !Number.isFinite(referenceHz) || referenceHz <= 0) {
    throw new RangeError("Se requieren dos frecuencias positivas y finitas.");
  }
  return 1200 * Math.log2(frequencyHz / referenceHz);
}

/** Elegir un único glifo fraccional solo si mejora la aproximación. */
export function decomposeCents(offsetCents, systemId = "quarter") {
  if (!Number.isFinite(offsetCents)) throw new RangeError("Cents no finitos.");
  const system = getSystem(systemId);
  const unit = system.fractionCents;
  const direction = offsetCents > 0 ? 1 : offsetCents < 0 ? -1 : 0;
  // Los empates se resuelven a favor de no introducir un símbolo.
  const useFraction = Math.abs(offsetCents) > unit / 2 + 1e-10;
  const multiplier = useFraction ? direction : 0;
  const indicatedCents = multiplier * unit;
  const residualCents = offsetCents - indicatedCents;
  return Object.freeze({
    systemId,
    systemLabel:system.label,
    family:system.family,
    fraction:system.fraction,
    step:multiplier,
    indicatedCents,
    residualCents,
    totalCents:offsetCents,
    glyphCodepoint:multiplier > 0 ? system.upGlyph : multiplier < 0 ? system.downGlyph : null,
    isSmufl:multiplier !== 0 && (multiplier > 0 ? system.upGlyph : system.downGlyph) !== null,
    fallback:multiplier === 0 ? "" : (multiplier > 0 ? "↑" : "↓") + system.fraction + " tono"
  });
}

/** Una altura pitagórica conserva su frecuencia en TODOS los modos. */
export function notationForNote(note, mode = "exact", systemId = "quarter") {
  if (!note || !Number.isFinite(note.frequencyHz) ||
      !Number.isFinite(note.centsFrom12TET) || ![-1,0,1].includes(note.accidental)) {
    throw new TypeError("Nota pitagórica inválida.");
  }
  if (mode !== "exact" && mode !== "contemporary") {
    throw new RangeError("Modo de notación desconocido.");
  }
  const deviation = note.centsFrom12TET;
  const split = mode === "exact"
    ? Object.freeze({ ...decomposeCents(0, systemId), residualCents:deviation, totalCents:deviation })
    : decomposeCents(deviation, systemId);
  return Object.freeze({
    ...split,
    mode,
    name:note.name,
    baseAccidental:note.accidental,
    standardGlyph:STANDARD_GLYPHS[String(note.accidental)],
    frequencyHz:note.frequencyHz,
    centsFrom12TET:deviation
  });
}

/** Para el laboratorio de escritura, Do4 de 12-TET es la base explícita. */
export function demonstrationForOffset(offsetCents, systemId = "quarter") {
  const notation=decomposeCents(offsetCents, systemId);
  return Object.freeze({
    ...notation,
    referenceHz:REFERENCE_C4_12TET,
    frequencyHz:centsToFrequency(REFERENCE_C4_12TET, offsetCents),
    baseName:"Do4 (12-TET)"
  });
}

export function roundTo(value, decimals=2) {
  if (!Number.isFinite(value) || !Number.isInteger(decimals) || decimals<0 || decimals>8) {
    throw new RangeError("Número o precisión inválidos.");
  }
  return Math.round((value+Number.EPSILON)*10**decimals)/10**decimals;
}
