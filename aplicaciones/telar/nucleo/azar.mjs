// Azar determinista: la misma semilla produce siempre la misma pieza, y cada
// decisión depende solo de sus claves, no del orden en que se hayan tomado otras.

const hash = (texto) => {
  let h = 0x811c9dc5;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
};

/** Número en [0, 1) fijado por la semilla y las claves. */
export function azarFijo(semilla, ...claves) {
  let t = (hash([semilla, ...claves].join('·')) + 0x6d2b79f5) >>> 0;
  let r = Math.imul(t ^ (t >>> 15), 1 | t);
  r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
  return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
}
