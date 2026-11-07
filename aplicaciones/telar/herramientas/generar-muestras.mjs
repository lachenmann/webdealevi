// Genera interfaz/muestras-vsco.mjs: el índice de muestras de VSCO 2 CE (CC0) que usa Telar.
// No descarga audio: solo lee el árbol de archivos del repositorio.
//
//   gh api "repos/sgossner/VSCO-2-CE/git/trees/<commit>?recursive=1" > arbol.json
//   node herramientas/generar-muestras.mjs arbol.json <commit>
//
// `desfase` son los semitonos entre el nombre del archivo y el sonido real. Se midió
// con autocorrelación sobre las muestras: casi todas suenan una octava por encima de
// su nombre; el violín con arco, el arpa y el piano suenan como se llaman.

import { readFileSync, writeFileSync } from 'node:fs';

const [arbol, commit] = process.argv.slice(2);
if (!arbol || !commit) throw new Error('Uso: generar-muestras.mjs arbol.json commit');

const banco = (sostenida, corta = null) => ({ sostenida, corta });
const fuente = (ruta, desfase = 12) => ({ ruta, desfase });

const BANCOS = {
  flauta: banco(fuente('Woodwinds/Flute/susNV'), fuente('Woodwinds/Flute/stac')),
  oboe: banco(fuente('Woodwinds/Oboe/Sus'), fuente('Woodwinds/Oboe/Stacc')),
  clarinete: banco(fuente('Woodwinds/Clarinet/susLong'), fuente('Woodwinds/Clarinet/stac')),
  fagot: banco(fuente('Woodwinds/Bassoon/sus'), fuente('Woodwinds/Bassoon/stac')),
  flautin: banco(fuente('Woodwinds/Piccolo/Sus'), fuente('Woodwinds/Piccolo/Stac')),
  violin: banco(fuente('Strings/Solo Violin/Arco Vib', 0), fuente('Strings/Solo Violin/spic')),
  viola: banco(fuente('Strings/Viola Section/susvib'), fuente('Strings/Viola Section/spic')),
  violonchelo: banco(fuente('Strings/Cello Section/susvib'), fuente('Strings/Cello Section/spic')),
  contrabajo: banco(fuente('Strings/Solo Contrabass/SusNV'), fuente('Strings/Solo Contrabass/Spic')),
  trompa: banco(fuente('Brass/F Horn/sus'), fuente('Brass/F Horn/stac')),
  trompeta: banco(fuente('Brass/Trumpet/sus'), fuente('Brass/Trumpet/stac')),
  trombon: banco(fuente('Brass/Tenor Trombone/sus'), fuente('Brass/Tenor Trombone/stac')),
  tuba: banco(fuente('Brass/Tuba/sus'), fuente('Brass/Tuba/stac')),
  piano: banco(fuente('Keys/Upright Nr1', 0)),
  arpa: banco(fuente('Strings/Harp', 0)),
};

const SEMITONO = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
const FUERZA = { ppp: 0, pp: 1, p: 2, mp: 3, mf: 4, f: 5, ff: 6, fff: 7 };
const MAX_REPETICIONES = 2;

const notaDe = (n) => {
  const m = /[_ -]([A-G]#?)(-?\d)[_ .-]/.exec(n);
  return m ? (Number(m[2]) + 1) * 12 + SEMITONO[m[1]] : null;
};
const capaDe = (n) => {
  const v = /_v(\d+)/i.exec(n);
  if (v) return Number(v[1]);
  const d = /_(ppp|pp|p|mp|mf|ff|fff|f)[_.]/.exec(n);
  return d ? FUERZA[d[1]] : 1;
};

const archivos = JSON.parse(readFileSync(arbol, 'utf8')).tree.filter((x) => x.type === 'blob' && x.path.endsWith('.wav'));

function indexar({ ruta, desfase }) {
  const notas = new Map();
  let descartados = 0;
  for (const x of archivos) {
    if (!x.path.startsWith(`${ruta}/`)) continue;
    const nombre = x.path.slice(ruta.length + 1);
    if (nombre.includes('/')) continue;
    const m = notaDe(nombre);
    if (m === null) { descartados++; continue; }
    const real = m + desfase;
    if (!notas.has(real)) notas.set(real, new Map());
    const capas = notas.get(real);
    const c = capaDe(nombre);
    if (!capas.has(c)) capas.set(c, []);
    capas.get(c).push(nombre);
  }
  if (descartados) console.warn(`${ruta}: ${descartados} archivos sin nota reconocible`);
  if (!notas.size) throw new Error(`Sin muestras en ${ruta}`);
  return {
    ruta,
    notas: [...notas.entries()].sort((a, b) => a[0] - b[0]).map(([m, capas]) => [
      m,
      [...capas.entries()].sort((a, b) => a[0] - b[0]).map(([, l]) => l.sort().slice(0, MAX_REPETICIONES)),
    ]),
  };
}

const salida = {};
for (const [id, b] of Object.entries(BANCOS)) {
  salida[id] = { sostenida: indexar(b.sostenida), corta: b.corta ? indexar(b.corta) : null };
}

const destino = new URL('../interfaz/muestras-vsco.mjs', import.meta.url);
writeFileSync(destino, `// Generado por herramientas/generar-muestras.mjs. No editar a mano.
// Versilian Studios Chamber Orchestra 2 Community Edition, licencia CC0.
export const COMMIT_VSCO = '${commit}';
export const BANCOS_VSCO = ${JSON.stringify(salida)};
`);
console.log(`${Object.keys(salida).length} bancos escritos`);
