/**
 * Notación microtonal refinada — adaptación pedagógica de la lámina
 * proporcionada por el autor (referida por él a Danny Wier).
 *
 * Solo hay CINCO unidades seleccionables del tono temperado de 200 cents:
 * 1/2, 1/4, 1/6, 1/8 y 1/12. Los valores son fracciones exactas
 * (no los enteros redondeados ±33 / ±17 de la lámina).
 *
 * Una alteración no es la frecuencia. El modelo conserva una altura absoluta
 * respecto de la nota cromática de 12-TET (La4=440 Hz):
 *   cents totales = semitonos + fracción + cents residuales
 *
 * Los SVG de los signos se dibujan localmente sin fuentes privadas/SMuFL.
 * El octavo de tono no está identificado en la lámina de referencia:
 * se especifica textualmente como ⅛↑ o ⅛↓ para evitar una falsa atribución.
 */
export const REFERENCE_A4 = 440;
export const REFERENCE_C4_12TET = REFERENCE_A4 * 2 ** (-9 / 12);

export const NOTATION_SYSTEMS = Object.freeze([
  Object.freeze({
    id: "semitone", label: "Semitonos", fraction: "½",
    fractionCents: 100, family: "Alteración cromática",
    upSign: "sharp", downSign: "flat"
  }),
  Object.freeze({
    id: "quarter", label: "Cuartos de tono", fraction: "¼",
    fractionCents: 50, family: "Medio sostenido / bemol inverso hueco",
    upSign: "quarter-sharp", downSign: "reverse-flat-outline"
  }),
  Object.freeze({
    id: "sixth", label: "Sextos de tono", fraction: "⅙",
    fractionCents: 100 / 3, family: "Signos geométricos compactos (±33 ¢ aprox.)",
    upSign: "pentagon", downSign: "diamond"
  }),
  Object.freeze({
    id: "eighth", label: "Octavos de tono", fraction: "⅛",
    fractionCents: 25, family: "Indicador textual explícito",
    upSign: "eighth-up", downSign: "eighth-down"
  }),
  Object.freeze({
    id: "twelfth", label: "Doceavos de tono", fraction: "¹⁄₁₂",
    fractionCents: 50 / 3, family: "Símbolos geométricos (±17 ¢ aprox.)",
    upSign: "square", downSign: "triangle-half"
  })
]);

export const STANDARD_GLYPHS = Object.freeze({
  "-1": "flat", "0": "natural", "1": "sharp"
});

export function getSystem(id) {
  const result = NOTATION_SYSTEMS.find(unit => unit.id === id);
  if (!result) throw new RangeError("Fracción de tono desconocida.");
  return result;
}

export function centsToFrequency(referenceHz, cents) {
  if (!Number.isFinite(referenceHz) || referenceHz <= 0 ||
      !Number.isFinite(cents)) throw new RangeError("Frecuencia o cents inválidos.");
  return referenceHz * 2 ** (cents / 1200);
}

export function frequencyToCents(frequencyHz, referenceHz) {
  if (!Number.isFinite(frequencyHz) || frequencyHz <= 0 ||
      !Number.isFinite(referenceHz) || referenceHz <= 0) {
    throw new RangeError("Se requieren dos frecuencias positivas.");
  }
  return 1200 * Math.log2(frequencyHz / referenceHz);
}

function validCents(offsetCents) {
  if (!Number.isFinite(offsetCents)) throw new RangeError("Los cents deben ser finitos.");
}

/**
 * Elige una alteración cromática de -200 a +200 cents y a lo sumo
 * una fracción de la unidad seleccionada; minimiza el residuo.
 * En igualdad, favorece el mínimo número de símbolos.
 *
 * Ejemplos:
 * +64 en cuartos -> 0 + 50 + 14
 * +150 en cuartos -> 100 + 50 + 0
 * -16⅔ en doceavos -> 0 - 16⅔ + 0
 */
export function decomposeCents(offsetCents, systemId = "quarter") {
  validCents(offsetCents);
  const system = getSystem(systemId);
  let best = null;
  for (let chromaticSteps = -2; chromaticSteps <= 2; chromaticSteps++) {
    const unitSteps = systemId === "semitone" ? [0] : [-1, 0, 1];
    for (const step of unitSteps) {
      const semitoneCents = chromaticSteps * 100;
      const fractionalCents = step * system.fractionCents;
      const indicatedCents = semitoneCents + fractionalCents;
      const residualCents = offsetCents - indicatedCents;
      const symbols = Number(chromaticSteps !== 0) + Number(step !== 0);
      const candidate = {
        step, chromaticSteps, semitoneCents, fractionalCents,
        indicatedCents, residualCents, symbols
      };
      if (!best || Math.abs(candidate.residualCents) < Math.abs(best.residualCents) - 1e-9 ||
          (Math.abs(Math.abs(candidate.residualCents) - Math.abs(best.residualCents)) <= 1e-9 &&
           (candidate.symbols < best.symbols ||
            (candidate.symbols === best.symbols &&
             Math.abs(candidate.chromaticSteps) < Math.abs(best.chromaticSteps))))) {
        best = candidate;
      }
    }
  }
  const microSign = best.step > 0 ? system.upSign :
    best.step < 0 ? system.downSign : null;
  const standardSign = best.chromaticSteps === -2 ? "double-flat" :
    best.chromaticSteps === -1 ? "flat" :
    best.chromaticSteps === 1 ? "sharp" :
    best.chromaticSteps === 2 ? "double-sharp" : null;
  return Object.freeze({
    systemId, systemLabel:system.label, family:system.family,
    fraction:system.fraction, ...best,
    microSign, standardSign, glyphCodepoint:null, isSmufl:false,
    totalCents:offsetCents,
    fallback: best.step === 0 ? "" :
      (best.step > 0 ? "↑ " : "↓ ") + system.fraction + " tono"
  });
}

export function notationForNote(note, mode = "exact", systemId = "quarter") {
  if (!note || !Number.isFinite(note.frequencyHz) ||
      !Number.isFinite(note.centsFrom12TET) ||
      ![-1,0,1].includes(note.accidental)) {
    throw new TypeError("Nota pitagórica inválida.");
  }
  if (!["exact","contemporary"].includes(mode)) {
    throw new RangeError("Modo de notación desconocido.");
  }
  const total = note.centsFrom12TET;
  const plan = mode === "exact" ? {
    ...decomposeCents(0,systemId),residualCents:total,totalCents:total
  } : decomposeCents(total,systemId);
  return Object.freeze({
    ...plan, mode, name:note.name,
    baseAccidental:note.accidental,
    standardGlyph:STANDARD_GLYPHS[String(note.accidental)],
    centsFrom12TET:total,frequencyHz:note.frequencyHz
  });
}

export function demonstrationForOffset(offsetCents, systemId = "quarter") {
  const model = decomposeCents(offsetCents, systemId);
  return Object.freeze({
    ...model, baseName:"Do4 (12-TET)",
    referenceHz:REFERENCE_C4_12TET,
    frequencyHz:centsToFrequency(REFERENCE_C4_12TET, offsetCents)
  });
}

export function roundTo(value, decimals=2) {
  if (!Number.isFinite(value) || !Number.isInteger(decimals) ||
      decimals<0 || decimals>8) throw new RangeError("Precisión inválida.");
  return Math.round((value+Number.EPSILON)*10**decimals)/10**decimals;
}
