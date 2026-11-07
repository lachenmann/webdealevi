// Alturas en cuartos de tono y campos armónicos.
// Una altura es un entero q = MIDI × 2: Do4 = 120, La4 = 138.

import { ErrorTelar } from './ritmo.mjs';
import { mcm } from './fraccion.mjs';

const LETRAS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const NOMBRES = ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Si'];
const SEMITONOS = [0, 2, 4, 5, 7, 9, 11];
const ESP = { do: 0, re: 1, mi: 2, fa: 3, sol: 4, la: 5, si: 6 };
const ING = { c: 0, d: 1, e: 2, f: 3, g: 4, a: 5, b: 6 };

// Grafía única de las 24 clases: [índice de letra, alteración en tonos de semitono].
const GRAFIA = [
  [0, 0], [0, 0.5], [0, 1], [0, 1.5], [1, 0], [1, 0.5], [2, -1], [2, -0.5],
  [2, 0], [2, 0.5], [3, 0], [3, 0.5], [3, 1], [3, 1.5], [4, 0], [4, 0.5],
  [5, -1], [5, -0.5], [5, 0], [5, 0.5], [6, -1], [6, -0.5], [6, 0], [6, 0.5],
];
const SUFIJO_LY = { 0: '', 0.5: 'ih', 1: 'is', 1.5: 'isih', '-1': 'es', '-0.5': 'eh' };
const SIGNO_TXT = { 0: '', 0.5: '+', 1: '#', 1.5: '#+', '-1': 'b', '-0.5': '-' };

export const deletrear = (q) => {
  const clase = ((q % 24) + 24) % 24;
  const [letra, alter] = GRAFIA[clase];
  const octava = Math.floor(q / 24) - 1;
  return {
    q,
    letra,
    paso: LETRAS[letra],
    alter,
    octava,
    diatonico: octava * 7 + letra,
    ly: LETRAS[letra].toLowerCase() + SUFIJO_LY[alter],
    nombre: `${NOMBRES[letra]}${SIGNO_TXT[alter]}${octava}`,
  };
};

export const nombreAltura = (q) => deletrear(q).nombre;

/** «Do#4», «Sib3», «Re4+», «La-3», «C#5» → q */
export function leerAltura(texto) {
  const t = String(texto).trim().toLowerCase();
  const m = /^(do|re|mi|fa|sol|la|si|[a-g])(#|b)?([+-])?(-?\d)([+-])?$/.exec(t);
  if (!m) throw new ErrorTelar(`«${texto}» no es una altura. Ejemplos: Do4, Sol#3, Sib2, Re4+ (cuarto de tono arriba)`);
  const letra = ESP[m[1]] ?? ING[m[1]];
  const alter = (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  const cuarto = (m[3] || m[5]) === '+' ? 1 : (m[3] || m[5]) === '-' ? -1 : 0;
  const octava = Number(m[4]);
  return (SEMITONOS[letra] + alter + (octava + 1) * 12) * 2 + cuarto;
}

export const leerAlturas = (texto) => {
  const fichas = String(texto).trim().split(/[\s,;]+/).filter(Boolean);
  if (!fichas.length) throw new ErrorTelar('Escribe al menos una altura, por ejemplo Do4');
  return fichas.map(leerAltura);
};

export const frecuencia = (q) => 440 * 2 ** ((q / 2 - 69) / 12);
const aCuartos = (f) => Math.round(2 * (69 + 12 * Math.log2(f / 440)));
const centsDe = (f, q) => 1200 * Math.log2(f / frecuencia(q));

const ordenar = (notas) => {
  const vistos = new Map();
  for (const n of notas) if (!vistos.has(n.q)) vistos.set(n.q, n);
  return [...vistos.values()].sort((a, b) => a.q - b.q);
};

const Q_MIN = 2 * 12; // Do0
const Q_MAX = 2 * 120; // Do9

/* ---------- Series ---------- */

/** Nombre de una clase de altura, sin octava. */
export const nombreClase = (pc, modulo) => deletrear(120 + (modulo === 24 ? pc : pc * 2)).nombre.replace(/-?\d+$/, '');

/** «0 11 3», «Do Si Mib» o «Do+ Re#» → clases de altura en el módulo 12 o 24. */
export function leerSerie(texto, modulo) {
  const m = Number(modulo);
  if (m !== 12 && m !== 24) throw new ErrorTelar('El módulo es 12 (semitonos) o 24 (cuartos de tono)');
  const fichas = String(texto).trim().split(/[\s,;]+/).filter(Boolean);
  if (fichas.length < 2) throw new ErrorTelar('Una serie necesita al menos dos notas');
  if (fichas.length > 24) throw new ErrorTelar('Una serie admite 24 notas como máximo');
  const s = fichas.map((f) => {
    if (/^\d+$/.test(f)) {
      const n = Number(f);
      if (n >= m) throw new ErrorTelar(`«${f}» no cabe en el módulo ${m}: usa de 0 a ${m - 1}`);
      return n;
    }
    const q = leerAltura(/\d/.test(f) ? f : f.replace(/([+-]?)$/, '4$1'));
    if (m === 12 && q % 2 !== 0) throw new ErrorTelar(`«${f}» es un cuarto de tono: elige el módulo 24`);
    return m === 24 ? ((q % 24) + 24) % 24 : (((q / 2) % 12) + 12) % 12;
  });
  if (new Set(s).size !== s.length) throw new ErrorTelar('Una serie no repite notas');
  return s;
}

/* ---------- Multiplicación ---------- */

/** A×B: A transportado por cada intervalo de B respecto de su primera nota. */
export function multiplicarIntervalos(a, b) {
  const notas = [];
  for (const y of b) for (const x of a) notas.push({ q: x + (y - b[0]) });
  return ordenar(notas);
}

/** Modulación en anillo: todas las sumas y diferencias de frecuencias. */
export function multiplicarAnillo(a, b) {
  const notas = [];
  for (const x of a) {
    for (const y of b) {
      const fx = frecuencia(x), fy = frecuencia(y);
      for (const f of [fx + fy, Math.abs(fx - fy)]) {
        if (f < 16) continue;
        const q = aCuartos(f);
        notas.push({ q, cents: centsDe(f, q) });
      }
    }
  }
  return ordenar(notas);
}

/* ---------- Cribas ---------- */

/** Devuelve { pertenece(n), periodo }. Gramática: m@r, |, &, !, paréntesis. */
export function leerCriba(texto) {
  const s = String(texto);
  let i = 0;
  const saltar = () => { while (/\s/.test(s[i] ?? '')) i++; };
  const error = (msg) => new ErrorTelar(`Criba: ${msg} (posición ${i + 1} de «${s.trim()}»)`);

  const union = () => {
    let izq = interseccion();
    for (saltar(); s[i] === '|'; saltar()) {
      i++;
      const a = izq, b = interseccion();
      izq = { f: (n) => a.f(n) || b.f(n), periodo: mcm(a.periodo, b.periodo) };
    }
    return izq;
  };
  const interseccion = () => {
    let izq = unario();
    for (saltar(); s[i] === '&'; saltar()) {
      i++;
      const a = izq, b = unario();
      izq = { f: (n) => a.f(n) && b.f(n), periodo: mcm(a.periodo, b.periodo) };
    }
    return izq;
  };
  const unario = () => {
    saltar();
    if (s[i] === '!') {
      i++;
      const a = unario();
      return { f: (n) => !a.f(n), periodo: a.periodo };
    }
    if (s[i] === '(') {
      i++;
      const a = union();
      saltar();
      if (s[i] !== ')') throw error('falta «)»');
      i++;
      return a;
    }
    const m = /^(\d+)@(\d+)/.exec(s.slice(i));
    if (!m) throw error('esperaba un módulo como 5@2');
    i += m[0].length;
    const mod = Number(m[1]), res = Number(m[2]);
    if (mod < 1) throw error('el módulo debe ser al menos 1');
    return { f: (n) => ((n - res) % mod + mod) % mod === 0, periodo: mod };
  };

  saltar();
  if (i >= s.length) throw new ErrorTelar('Criba vacía. Ejemplo: 5@0 | 7@2');
  const r = union();
  saltar();
  if (i < s.length) throw error(`sobra «${s[i]}»`);
  return { pertenece: r.f, periodo: r.periodo };
}

export function campoCriba({ expresion, desde, hasta, unidad }) {
  const criba = leerCriba(expresion);
  const ini = leerAltura(desde), fin = leerAltura(hasta);
  if (fin <= ini) throw new ErrorTelar('La criba necesita un ámbito ascendente');
  const paso = unidad === 'cuarto' ? 1 : 2;
  const notas = [];
  for (let n = 0, q = ini; q <= fin; n++, q += paso) if (criba.pertenece(n)) notas.push({ q });
  return notas;
}

/* ---------- Espectros ---------- */

/** «1-8 11 13» → [1,...,8,11,13] */
export function leerParciales(texto) {
  const out = [];
  for (const f of String(texto).trim().split(/[\s,;]+/).filter(Boolean)) {
    const m = /^(\d+)(?:-(\d+))?$/.exec(f);
    if (!m) throw new ErrorTelar(`«${f}» no es un parcial. Ejemplo: 1-8 11 13`);
    const a = Number(m[1]), b = m[2] ? Number(m[2]) : a;
    if (a < 1 || b < a || b > 128) throw new ErrorTelar(`Parciales «${f}» fuera de 1–128`);
    for (let n = a; n <= b; n++) out.push(n);
  }
  if (!out.length) throw new ErrorTelar('Escribe al menos un parcial, por ejemplo 1-16');
  return out;
}

/** Parciales f·n^e redondeados al cuarto de tono, con la desviación en cents. */
export function campoEspectro({ fundamental, parciales, estiramiento }) {
  const f0 = frecuencia(leerAltura(fundamental));
  const e = Number(estiramiento);
  if (!Number.isFinite(e) || e <= 0.2 || e > 3) throw new ErrorTelar('El estiramiento debe estar entre 0,2 y 3 (1 = armónico)');
  const notas = [];
  for (const n of leerParciales(parciales)) {
    const f = f0 * n ** e;
    if (f > 16000) continue;
    const q = aCuartos(f);
    notas.push({ q, cents: centsDe(f, q), parcial: n });
  }
  return ordenar(notas);
}

/* ---------- Evaluación y registro ---------- */

export function evaluarCampo(c) {
  let notas;
  if (c.tipo === 'multiplicacion') {
    const a = leerAlturas(c.a), b = leerAlturas(c.b);
    notas = c.modo === 'anillo' ? multiplicarAnillo(a, b) : multiplicarIntervalos(a, b);
  } else if (c.tipo === 'criba') {
    notas = campoCriba(c);
  } else if (c.tipo === 'espectro') {
    notas = campoEspectro(c);
  } else if (c.tipo === 'serie') {
    // Todas las octavas: la voz elige su registro y el orden lo da el hilo de altura.
    const m = Number(c.modulo);
    const clases = leerSerie(c.notas, m);
    notas = [];
    for (let oct = 0; oct <= 10; oct++) for (const pc of clases) notas.push({ q: oct * 24 + (m === 24 ? pc : pc * 2) });
    notas = ordenar(notas);
  } else if (c.tipo === 'lista') {
    notas = ordenar(leerAlturas(c.notas).map((q) => ({ q })));
  } else {
    throw new ErrorTelar(`Tipo de campo desconocido: ${c.tipo}`);
  }
  notas = notas.filter((n) => n.q >= Q_MIN && n.q <= Q_MAX);
  if (!notas.length) throw new ErrorTelar('Este campo no produce ninguna altura utilizable');
  return notas;
}

/** Interpola entre campos: cada posición de A viaja hacia su homóloga de B. */
export function interpolarCampos(a, b, x) {
  if (x <= 0) return a;
  if (x >= 1) return b;
  const n = Math.max(a.length, b.length);
  const notas = [];
  for (let k = 0; k < n; k++) {
    const qa = a[Math.floor((k * a.length) / n)].q;
    const qb = b[Math.floor((k * b.length) / n)].q;
    notas.push({ q: Math.round(qa + (qb - qa) * x) });
  }
  return ordenar(notas);
}

export const plegar = (q, min, max) => {
  let r = q;
  while (r < min) r += 24;
  while (r > max) r -= 24;
  return r >= min && r <= max ? r : null;
};

/**
 * Alturas de un campo que caen en un ámbito. Si quedan menos de tres, se
 * pliegan por octavas las que estaban fuera, para que la voz tenga material.
 */
export function registrar(qs, min, max) {
  const dentro = [...new Set(qs.filter((q) => q >= min && q <= max))].sort((a, b) => a - b);
  if (dentro.length >= 3) return dentro;
  const todas = new Set(dentro);
  for (const q of qs) {
    const p = plegar(q, min, max);
    if (p !== null) todas.add(p);
  }
  return [...todas].sort((a, b) => a - b);
}

/* ---------- Instrumentos (en Do, sonido real) ---------- */

const inst = (nombre, abrev, grave, agudo, clave, programa, maxAcorde, timbre) => ({
  nombre, abrev, min: grave * 2, max: agudo * 2, clave, programa, maxAcorde, timbre,
});

export const INSTRUMENTOS = {
  flauta: inst('Flauta', 'Fl.', 60, 96, 'sol', 73, 1, 'soplo'),
  oboe: inst('Oboe', 'Ob.', 58, 91, 'sol', 68, 1, 'cana'),
  clarinete: inst('Clarinete', 'Cl.', 50, 91, 'sol', 71, 1, 'soplo'),
  fagot: inst('Fagot', 'Fg.', 34, 75, 'fa', 70, 1, 'cana'),
  violin: inst('Violín', 'Vn.', 55, 100, 'sol', 40, 2, 'cuerda'),
  viola: inst('Viola', 'Va.', 48, 88, 'do3', 41, 2, 'cuerda'),
  violonchelo: inst('Violonchelo', 'Vc.', 36, 81, 'fa', 42, 2, 'cuerda'),
  contrabajo: inst('Contrabajo', 'Cb.', 28, 67, 'fa', 43, 2, 'cuerda'),
  piano: inst('Piano', 'Pno.', 21, 108, 'sol', 0, 6, 'piano'),
  flautin: inst('Flautín', 'Fltn.', 74, 108, 'sol', 72, 1, 'soplo'),
  trompa: inst('Trompa', 'Tpa.', 41, 77, 'fa', 60, 1, 'metal'),
  trompeta: inst('Trompeta', 'Tpt.', 55, 86, 'sol', 56, 1, 'metal'),
  trombon: inst('Trombón', 'Tbn.', 40, 72, 'fa', 57, 1, 'metal'),
  tuba: inst('Tuba', 'Tba.', 28, 65, 'fa', 58, 1, 'metal'),
  arpa: inst('Arpa', 'Arp.', 24, 103, 'sol', 46, 6, 'piano'),
};

export const CLAVES = { sol: 'Sol', fa: 'Fa', do3: 'Do en 3.ª (viola)', do4: 'Do en 4.ª (tenor)' };

/** El instrumento de una voz, con el ámbito, la clave y la polifonía que elija el compositor. */
export function instrumentoDeVoz(v) {
  const base = INSTRUMENTOS[v.instrumento];
  if (!base) return base;
  const propio = (x) => x !== undefined && x !== null && String(x).trim() !== '';
  return {
    ...base,
    id: v.instrumento,
    min: propio(v.grave) ? leerAltura(v.grave) : base.min,
    max: propio(v.agudo) ? leerAltura(v.agudo) : base.max,
    clave: propio(v.clave) ? v.clave : base.clave,
    maxAcorde: propio(v.maxAcorde) ? Number(v.maxAcorde) : base.maxAcorde,
  };
}

/* ---------- Dinámicas y articulaciones ---------- */

export const DINAMICAS = ['ppp', 'pp', 'p', 'mp', 'mf', 'f', 'ff', 'fff'];
export const VELOCIDADES = [18, 30, 44, 58, 72, 88, 104, 120];

// Ficha que se escribe en el ciclo → nombre interno.
export const ARTICULACIONES = {
  '-': null,
  '.': 'staccato',
  '!': 'staccatissimo',
  _: 'tenuto',
  '>': 'acento',
  '^': 'marcato',
};
