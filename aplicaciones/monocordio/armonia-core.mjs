/**
 * Laboratorio de la tetraktys y las medias musicales.
 * Un modelo acústico explícito, no una reconstrucción arqueológica.
 * Los términos 1,2,3,4 y 6,8,9,12 representan proporciones de FRECUENCIA.
 * Con tensión y densidad lineal constantes, la LONGITUD es inversa.
 */
import { BASE_FREQUENCY } from "./core.mjs";

export const TETRAKTYS_ROWS = Object.freeze([1, 2, 3, 4]);
export const MEAN_TERMS = Object.freeze([6, 8, 9, 12]);
export const TETRAKTYS_TOTAL = TETRAKTYS_ROWS.reduce((total, row) => total + row, 0);
export const MEAN_ENDPOINTS = Object.freeze([6, 12]);

function positiveFinite(value, label) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw new RangeError(label + " debe ser positivo y finito.");
  }
  return value;
}
function positiveInteger(value, label) {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new RangeError(label + " debe ser un entero positivo seguro.");
  }
  return value;
}
function gcd(a, b) {
  while (b !== 0) [a, b] = [b, a % b];
  return a;
}

export function simplifyRatio(numerator, denominator) {
  positiveInteger(numerator, "Numerador");
  positiveInteger(denominator, "Denominador");
  const divisor = gcd(numerator, denominator);
  const n = numerator / divisor, d = denominator / divisor;
  return Object.freeze({ numerator: n, denominator: d, value: n / d,
    text: n + ":" + d });
}

export function arithmeticMean(a, b) {
  positiveFinite(a, "Primer extremo");
  positiveFinite(b, "Segundo extremo");
  return (a + b) / 2;
}

export function harmonicMean(a, b) {
  positiveFinite(a, "Primer extremo");
  positiveFinite(b, "Segundo extremo");
  // Forma numéricamente estable para extremos positivos.
  return 2 / (1 / a + 1 / b);
}

export function geometricMean(a, b) {
  positiveFinite(a, "Primer extremo");
  positiveFinite(b, "Segundo extremo");
  return Math.sqrt(a) * Math.sqrt(b);
}

export function buildTetraktys(baseFrequency = BASE_FREQUENCY) {
  positiveFinite(baseFrequency, "Frecuencia base");
  return Object.freeze(TETRAKTYS_ROWS.map(number => {
    const frequency = simplifyRatio(number, 1);
    const length = simplifyRatio(1, number);
    return Object.freeze({
      id: "t" + number, number, rowDots: number, frequencyHz: baseFrequency * number,
      frequencyRatio: frequency.text, lengthRatio: length.text,
      vibratingFraction: length.value
    });
  }));
}

export function buildMeanSeries(baseFrequency = BASE_FREQUENCY) {
  positiveFinite(baseFrequency, "Frecuencia base");
  const names = Object.freeze({
    6: ["low", "Extremo inferior"],
    8: ["harmonic", "Media armónica"],
    9: ["arithmetic", "Media aritmética"],
    12: ["high", "Extremo superior"]
  });
  return Object.freeze(MEAN_TERMS.map(number => {
    const frequency = simplifyRatio(number, MEAN_TERMS[0]);
    const length = simplifyRatio(MEAN_TERMS[0], number);
    const [id, role] = names[number];
    return Object.freeze({
      id, number, role, frequencyHz: baseFrequency * number / MEAN_TERMS[0],
      frequencyRatio: frequency.text, lengthRatio: length.text,
      vibratingFraction: length.value
    });
  }));
}

export function meanIdentity() {
  const [a, b] = MEAN_ENDPOINTS;
  const harmonic = harmonicMean(a, b);
  const arithmetic = arithmeticMean(a, b);
  const geometric = geometricMean(a, b);
  return Object.freeze({
    lower: a, upper: b, harmonic, arithmetic, geometric,
    middleFrequencyRatio: simplifyRatio(arithmetic, harmonic),
    octaveFrequencyRatio: simplifyRatio(b, a),
    fourthFrequencyRatio: simplifyRatio(harmonic, a),
    fifthFrequencyRatio: simplifyRatio(arithmetic, a)
  });
}

export function frequencyRatioBetween(lower, upper) {
  return simplifyRatio(upper, lower);
}
