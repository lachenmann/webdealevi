/**
 * Modelo matemático de un monocordio ideal.
 * Tensión y densidad lineal constantes: f / f0 = L / L' = 1 / x.
 * x representa la fracción vibrante de la cuerda completa.
 */
export const BASE_FREQUENCY = 220;
export const MIN_FRACTION = 0.25;

export const INTERVALS = Object.freeze([
  { id: "unisono", name: "Unísono", numerator: 1, denominator: 1 },
  { id: "octava", name: "Octava", numerator: 1, denominator: 2 },
  { id: "quinta", name: "Quinta justa", numerator: 2, denominator: 3 },
  { id: "cuarta", name: "Cuarta justa", numerator: 3, denominator: 4 },
  { id: "tono", name: "Tono pitagórico", numerator: 8, denominator: 9 }
].map(item => Object.freeze({ ...item, fraction: item.numerator / item.denominator })));

export function normalizeFraction(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(1, Math.max(MIN_FRACTION, n)) : 1;
}

export function frequencyForFraction(value, baseFrequency = BASE_FREQUENCY) {
  if (!Number.isFinite(baseFrequency) || baseFrequency <= 0) {
    throw new RangeError("La frecuencia fundamental debe ser positiva y finita.");
  }
  return baseFrequency / normalizeFraction(value);
}

export function findInterval(value, tolerance = 0.0006) {
  const fraction = normalizeFraction(value);
  return INTERVALS.find(interval => Math.abs(fraction - interval.fraction) <= tolerance) ?? null;
}

export function describeFraction(value, baseFrequency = BASE_FREQUENCY) {
  const fraction = normalizeFraction(value);
  const interval = findInterval(fraction);
  const exact = interval && Math.abs(fraction - interval.fraction) < 1e-9;
  return {
    fraction,
    lengthPercent: 100 * fraction,
    frequencyHz: frequencyForFraction(fraction, baseFrequency),
    relativeFrequency: 1 / fraction,
    intervalName: interval ? interval.name : "Posición libre",
    lengthRatio: exact ? `${interval.numerator}:${interval.denominator}` : fraction.toFixed(3) + ":1",
    frequencyRatio: exact ? `${interval.denominator}:${interval.numerator}` : (1 / fraction).toFixed(3) + ":1"
  };
}
