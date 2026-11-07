// Compases y árboles rítmicos.
//
// Sintaxis de un patrón: pesos separados por espacios.
//   1 2(1 1 1) 1     tres partes; la central, doble, se divide en tres
//   -1               silencio de peso 1
//   +1               ligado a lo anterior
//   3(1 2(1 1) -1)   anidación libre

import { fr, esPotenciaDe2, esPotenciaDe2Fr, Fr } from './fraccion.mjs';

export class ErrorTelar extends Error {
  constructor(mensaje, ruta = null) {
    super(mensaje);
    this.name = 'ErrorTelar';
    this.ruta = ruta;
  }
}

export const VALOR_MINIMO = 128n; // la figura más breve es 1/128
export const MAX_TUPLAS = 6; // niveles de tupla simultáneos (límite de MusicXML)

/* ---------- Compases ---------- */

/** «3/10», «2+3/16» → { num, den, grupos, etiqueta, irracional } */
export function leerCompas(texto) {
  const m = /^(\d+(?:\+\d+)*)\/(\d+)$/.exec(String(texto).trim());
  if (!m) throw new ErrorTelar(`«${texto}» no es un compás. Ejemplos: 3/8, 3/10, 2+3/16`);
  const partes = m[1].split('+').map(Number);
  const num = partes.reduce((a, b) => a + b, 0);
  const den = Number(m[2]);
  if (num < 1 || num > 32 || partes.some((x) => x < 1)) throw new ErrorTelar(`«${texto}»: el numerador debe estar entre 1 y 32`);
  if (den < 1 || den > 64) throw new ErrorTelar(`«${texto}»: el denominador debe estar entre 1 y 64`);
  let grupos = partes;
  if (partes.length === 1) {
    if (den >= 16 && num > 3) {
      grupos = [];
      let resto = num;
      while (resto > 3) { grupos.push(2); resto -= 2; }
      grupos.push(resto);
    } else if (den >= 16) {
      grupos = [num];
    } else {
      grupos = Array(num).fill(1);
    }
  }
  return { num, den, grupos, etiqueta: `${num}/${den}`, irracional: !esPotenciaDe2(den) };
}

export function leerCompases(texto) {
  const fichas = String(texto).trim().split(/[\s,;]+/).filter(Boolean);
  if (!fichas.length) throw new ErrorTelar('Escribe al menos un compás, por ejemplo 4/4');
  return fichas.map(leerCompas);
}

/** Duración escrita de un compás y factor de su tupla implícita, si es irracional. */
export function escrituraDeCompas({ num, den }) {
  let p = 1;
  while (p * 2 <= den) p *= 2;
  return { escrita: fr(num, p), p };
}

/* ---------- Patrones ---------- */

export function leerPatron(texto) {
  const s = String(texto);
  let i = 0;
  const saltar = () => { while (i < s.length && /[\s,]/.test(s[i])) i++; };
  const error = (msg) => new ErrorTelar(`${msg} (posición ${i + 1} de «${s.trim()}»)`);

  const lista = (dentro) => {
    const nodos = [];
    for (;;) {
      saltar();
      if (i >= s.length) {
        if (dentro) throw error('Falta cerrar un paréntesis');
        return nodos;
      }
      if (s[i] === ')') {
        if (!dentro) throw error('Sobra un paréntesis de cierre');
        i++;
        return nodos;
      }
      nodos.push(nodo());
    }
  };

  const nodo = () => {
    let signo = '';
    if (s[i] === '-' || s[i] === '+') signo = s[i++];
    const ini = i;
    while (i < s.length && /\d/.test(s[i])) i++;
    const peso = i > ini ? Number(s.slice(ini, i)) : null;
    if (peso === 0) throw error('Un peso no puede ser 0');
    if (peso !== null && peso > 64) throw error('Un peso no puede pasar de 64');
    if (s[i] === '(') {
      if (signo) throw error('Un grupo no lleva signo: pon «-» o «+» en sus hojas');
      i++;
      const hijos = lista(true);
      if (!hijos.length) throw error('Grupo vacío');
      return simplificar({ peso: peso ?? 1, hijos });
    }
    if (peso === null) throw error(`Esperaba un número y encontré «${s[i] ?? 'el final'}»`);
    return { peso, tipo: signo === '-' ? 'silencio' : signo === '+' ? 'liga' : 'nota' };
  };

  const raiz = lista(false);
  if (!raiz.length) throw new ErrorTelar('Patrón vacío');
  return raiz;
}

/** Cada línea no vacía es un patrón. */
export function leerPatrones(texto) {
  const lineas = String(texto).split(/\n|\|/).map((l) => l.trim()).filter(Boolean);
  if (!lineas.length) throw new ErrorTelar('Escribe al menos un patrón, por ejemplo: 1 1 1');
  return lineas.map(leerPatron);
}

/** Un grupo de un solo hijo no divide nada. */
function simplificar(n) {
  if (n.hijos && n.hijos.length === 1) {
    const h = n.hijos[0];
    return h.hijos ? { peso: n.peso, hijos: h.hijos } : { peso: n.peso, tipo: h.tipo };
  }
  return n;
}

export const clonar = (n) => (n.hijos ? { peso: n.peso, hijos: n.hijos.map(clonar) } : { peso: n.peso, tipo: n.tipo });
export const sumaPesos = (hijos) => hijos.reduce((a, h) => a + h.peso, 0);

/* ---------- División de una duración escrita ---------- */

/**
 * Cómo se escribe una duración W (diádica) dividida en S unidades.
 * Sin tupla si cada unidad es una figura simple; si no, tupla S:M
 * con unidad u potencia de 2 tal que M·u = W y, si cabe, M ≤ S < 2M.
 */
export function dividir(W, S) {
  const u0 = W.entre(fr(S));
  if (esPotenciaDe2Fr(u0)) return { unidad: u0, tupla: null };
  let impar = W.n;
  while (impar % 2n === 0n) impar /= 2n;
  let M = Number(impar);
  let u = W.entre(fr(M));
  while (M * 2 <= S) { M *= 2; u = u.entre(fr(2)); }
  return { unidad: u, tupla: { actual: S, normal: M } };
}

/* ---------- Medidas ---------- */

/** Construye el árbol de un compás consumiendo patrones del ciclo. */
export function construirRaiz(compas, patrones, unidad, siguiente) {
  if (unidad === 'compas') {
    let hijos = patrones[siguiente()].map(clonar);
    // Un único elemento no divide el compás: lo llena sin tupla.
    while (hijos.length === 1 && hijos[0].hijos) hijos = hijos[0].hijos;
    if (hijos.length === 1) hijos[0].peso = compas.num;
    return { hijos };
  }
  const hijos = compas.grupos.map((g) => {
    const p = patrones[siguiente()];
    return simplificar({ peso: g, hijos: p.map(clonar) });
  });
  return { hijos };
}

/** Recorre las hojas en orden con su inicio y duración reales. */
export function recorrerHojas(raiz, inicio, real, cb) {
  const paso = (n, t, d) => {
    if (!n.hijos) { cb(n, t, d); return; }
    const S = sumaPesos(n.hijos);
    let cur = t;
    for (const h of n.hijos) {
      const dh = d.por(fr(h.peso, S));
      paso(h, cur, dh);
      cur = cur.mas(dh);
    }
  };
  paso(raiz, inicio, real);
}

const primerTipo = (n) => (n.hijos ? primerTipo(n.hijos[0]) : n.tipo);

/**
 * Impone los límites de escritura: 1/128 y seis tuplas anidadas.
 * Un grupo que los superaría se funde en una sola nota. Devuelve cuántos fundió.
 */
export function normalizarArbol(raiz, compas) {
  const { escrita } = escrituraDeCompas(compas);
  let fundidos = 0;
  const fundir = (n) => {
    n.tipo = primerTipo(n);
    delete n.hijos;
    fundidos++;
  };
  const visitar = (n, W, prof) => {
    if (!n.hijos) return;
    const S = sumaPesos(n.hijos);
    const { unidad, tupla } = dividir(W, S);
    const p2 = prof + (tupla ? 1 : 0);
    const excede = p2 > MAX_TUPLAS || n.hijos.some((h) => unidad.por(fr(h.peso)).d > VALOR_MINIMO);
    if (excede) {
      if (n === raiz) {
        raiz.hijos = [{ peso: compas.num, tipo: primerTipo(n) }];
        fundidos++;
        return;
      }
      fundir(n);
      return;
    }
    for (const h of n.hijos) visitar(h, unidad.por(fr(h.peso)), p2);
  };
  visitar(raiz, escrita, compas.irracional ? 1 : 0);
  return fundidos;
}

/** Une silencios: un grupo callado es un silencio; silencios hermanos se suman. */
export function colapsarSilencios(raiz, compas) {
  const callada = (h) => !h.hijos && h.tipo === 'silencio';
  const visitar = (n) => {
    if (!n.hijos) return;
    n.hijos.forEach(visitar);
    if (n !== raiz) {
      if (n.hijos.every(callada)) {
        n.tipo = 'silencio';
        n.evento = null;
        delete n.hijos;
        return;
      }
      const unidos = [];
      for (const h of n.hijos) {
        const ult = unidos[unidos.length - 1];
        if (ult && callada(ult) && callada(h)) ult.peso += h.peso;
        else unidos.push(h);
      }
      n.hijos = unidos;
    }
  };
  visitar(raiz);
  if (raiz.hijos.every(callada)) raiz.hijos = [{ peso: compas.num, tipo: 'silencio', evento: null }];
}

export const duracionDeCompas = ({ num, den }) => new Fr(num, den);
