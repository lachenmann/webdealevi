/**
 * Constructor de afinación pitagórica a partir de quintas 3:2.
 *
 * Cada quinta se reduce por potencias de dos a la octava [C4, C5).
 * La referencia de afinación es A4 = 440 Hz; de ello resulta
 * C4 = 440 · 16/27 Hz, ya que la nota A se obtiene con tres quintas.
 *
 * Especificación de notación: altura en clave de sol + alteración
 * convencional + corrección NUMÉRICA en cents frente a 12-TET.
 * No se emplean accidentales de cuarto de tono para diferencias
 * que no son de 50 cents.
 */
export const REFERENCE_A4 = 440;
export const PYTHAGOREAN_C4 = REFERENCE_A4 * 16 / 27;
export const STEP_MIN = -6;
export const STEP_MAX = 6;
export const DIATONIC_STEPS = Object.freeze([-1, 0, 1, 2, 3, 4, 5]);
const FIFTH_SPELLINGS = Object.freeze({
  "-6": ["G", -1], "-5": ["D", -1], "-4": ["A", -1],
  "-3": ["E", -1], "-2": ["B", -1], "-1": ["F", 0],
  "0": ["C", 0], "1": ["G", 0], "2": ["D", 0],
  "3": ["A", 0], "4": ["E", 0], "5": ["B", 0], "6": ["F", 1]
});
const SOLFEGE = Object.freeze({ C: "Do", D: "Re", E: "Mi", F: "Fa", G: "Sol", A: "La", B: "Si" });
const SEMITONE = Object.freeze({ C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 });
const SYMBOL = Object.freeze({ "-1": "♭", "0": "", "1": "♯" });

/** Fracción reducida de quinta(s), trasladada a la misma octava. */
export function ratioOfFifths(step) {
  if (!Number.isInteger(step) || step < STEP_MIN || step > STEP_MAX) {
    throw new RangeError("Se admiten de -6 a +6 quintas desde Do.");
  }
  let numerator = step >= 0 ? 3n ** BigInt(step) : 2n ** BigInt(-step);
  let denominator = step >= 0 ? 2n ** BigInt(step) : 3n ** BigInt(-step);
  while (numerator < denominator) numerator *= 2n;
  while (numerator >= denominator * 2n) denominator *= 2n;
  return Object.freeze({
    numerator: Number(numerator),
    denominator: Number(denominator),
    value: Number(numerator) / Number(denominator)
  });
}

export function makeNote(step) {
  const ratio = ratioOfFifths(step);
  const [letter, accidental] = FIFTH_SPELLINGS[String(step)];
  const semitones = SEMITONE[letter] + accidental;
  const frequencyHz = PYTHAGOREAN_C4 * ratio.value;
  const equalTemperamentHz = REFERENCE_A4 * Math.pow(2, (semitones - 9) / 12);
  const centsFrom12TET = 1200 * Math.log2(frequencyHz / equalTemperamentHz);
  return Object.freeze({
    fifthStep: step,
    name: letter + SYMBOL[String(accidental)] + "4",
    solfege: SOLFEGE[letter] + (accidental ? " " + (accidental === 1 ? "sostenido" : "bemol") : ""),
    letter,
    accidental,
    semitones,
    ratioNumerator: ratio.numerator,
    ratioDenominator: ratio.denominator,
    ratio: ratio.value,
    frequencyHz,
    equalTemperamentHz,
    centsFrom12TET
  });
}

export function makeCollection(steps) {
  const indices = new Set(steps);
  if (!indices.size || [...indices].some(s => !Number.isInteger(s) || s < STEP_MIN || s > STEP_MAX)) {
    throw new RangeError("Cada colección debe contener pasos enteros entre -6 y +6.");
  }
  return Object.freeze([...indices].map(makeNote).sort((a, b) => a.frequencyHz - b.frequencyHz));
}

export function nextFifth(steps, direction) {
  if (direction !== 1 && direction !== -1) throw new RangeError("La dirección debe ser +1 o -1.");
  const values = [...new Set(steps)];
  const next = direction === 1 ? Math.max(...values) + 1 : Math.min(...values) - 1;
  if (next < STEP_MIN || next > STEP_MAX) return null;
  return [...values, next];
}

/**
 * El Fa sostenido generado por seis quintas ascendentes difiere
 * del Sol bemol generado por seis quintas descendentes:
 * (3/2)^12 / 2^7 = 531441 / 524288.
 */
export const PYTHAGOREAN_COMMA = Object.freeze({
  numerator: 531441,
  denominator: 524288,
  cents: 1200 * Math.log2(531441 / 524288)
});
