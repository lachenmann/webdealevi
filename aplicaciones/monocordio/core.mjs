/**
 * Modelo matemático de un monocordio ideal.
 * Tensión y densidad lineal constantes: f / f0 = L / L' = 1 / x.
 * x representa la fracción vibrante de la cuerda completa.
 */
export const BASE_FREQUENCY = 220;
export const MIN_FRACTION = 0.25;

export const INTERVALS = Object.freeze([
  // Las fracciones representan LONGITUD VIBRANTE, no frecuencia.
  // Todas las razones tienen por factores primos únicamente 2 y 3.
  { id:"unisono", name:"Unísono", numerator:1, denominator:1, group:"fundamentales" },
  { id:"coma", name:"Coma pitagórica", numerator:524288, denominator:531441, group:"microintervalos" },
  { id:"limma", name:"Limma", numerator:243, denominator:256, group:"microintervalos" },
  { id:"apotome", name:"Apótome", numerator:2048, denominator:2187, group:"microintervalos" },
  { id:"tono", name:"Tono pitagórico", numerator:8, denominator:9, group:"escala" },
  { id:"tercera-menor", name:"Tercera menor pitagórica", numerator:27, denominator:32, group:"escala" },
  { id:"tercera-mayor", name:"Tercera mayor (ditono)", numerator:64, denominator:81, group:"escala" },
  { id:"cuarta", name:"Cuarta justa", numerator:3, denominator:4, group:"fundamentales" },
  { id:"quinta-disminuida", name:"Quinta disminuida", numerator:729, denominator:1024, group:"enarmonicos" },
  { id:"cuarta-aumentada", name:"Cuarta aumentada", numerator:512, denominator:729, group:"enarmonicos" },
  { id:"quinta", name:"Quinta justa", numerator:2, denominator:3, group:"fundamentales" },
  { id:"sexta-menor", name:"Sexta menor pitagórica", numerator:81, denominator:128, group:"escala" },
  { id:"sexta-mayor", name:"Sexta mayor pitagórica", numerator:16, denominator:27, group:"escala" },
  { id:"septima-menor", name:"Séptima menor pitagórica", numerator:9, denominator:16, group:"escala" },
  { id:"septima-mayor", name:"Séptima mayor pitagórica", numerator:128, denominator:243, group:"escala" },
  { id:"octava", name:"Octava", numerator:1, denominator:2, group:"fundamentales" },
  { id:"novena", name:"Novena mayor", numerator:4, denominator:9, group:"compuestos" },
  { id:"duodecima", name:"Duodécima", numerator:1, denominator:3, group:"compuestos" },
  { id:"doble-octava", name:"Doble octava", numerator:1, denominator:4, group:"compuestos" }
].map(item => Object.freeze({
  ...item, fraction:item.numerator/item.denominator
})));

export const INTERVAL_GROUPS = Object.freeze([
  Object.freeze({id:"fundamentales",label:"Consonancias fundamentales"}),
  Object.freeze({id:"escala",label:"Intervalos de la escala"}),
  Object.freeze({id:"microintervalos",label:"Microintervalos pitagóricos"}),
  Object.freeze({id:"enarmonicos",label:"Tritonos enarmónicos"}),
  Object.freeze({id:"compuestos",label:"Intervalos compuestos"})
]);

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
