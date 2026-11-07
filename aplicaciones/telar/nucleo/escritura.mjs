// Del árbol exacto a figuras escritas: valores, puntillos, ligaduras, tuplas y
// haces. Es la única fuente de la grafía: SVG, LilyPond y MusicXML la leen igual.

import { fr, mcd } from './fraccion.mjs';
import { dividir, escrituraDeCompas, sumaPesos } from './ritmo.mjs';
import { deletrear, DINAMICAS } from './armonia.mjs';

// Figuras simples, con uno y dos puntillos, de mayor a menor.
const TABLA = [];
for (let d = 1; d <= 128; d *= 2) {
  if (4 * d <= 128) TABLA.push({ v: fr(7, 4 * d), valor: d, puntos: 2 });
  if (2 * d <= 128) TABLA.push({ v: fr(3, 2 * d), valor: d, puntos: 1 });
  TABLA.push({ v: fr(1, d), valor: d, puntos: 0 });
}
TABLA.sort((a, b) => b.v.cmp(a.v));

/** Parte una duración escrita en figuras representables. */
export function partirEscrita(w) {
  const piezas = [];
  let resto = w;
  while (resto.n > 0n) {
    const f = TABLA.find((x) => x.v.cmp(resto) <= 0);
    if (!f) throw new Error(`Duración no representable: ${w}`);
    piezas.push(f);
    resto = resto.menos(f.v);
  }
  return piezas;
}

const nivelesHaz = (valor) => (valor >= 8 ? Math.log2(valor) - 2 : 0);

export const tuplaEstandar = ({ actual, normal }) => {
  let p = 1;
  while (p * 2 <= actual) p *= 2;
  return p === normal && actual !== normal;
};

export function escribirMedida(raiz, compas, inicioCompas, estado) {
  const figuras = [];
  const zonas = [];
  const { escrita, p } = escrituraDeCompas(compas);
  let factor = fr(1);
  let cursor = inicioCompas;
  let porAbrir = [];
  const activas = [];

  const abrir = (t) => {
    const nueva = { ...t, nivel: activas.length + 1 };
    activas.push(nueva);
    porAbrir.push(nueva);
  };
  const cerrar = () => {
    activas.pop();
    figuras[figuras.length - 1].cierraTuplas += 1;
  };

  const hoja = (n, W, f) => {
    const piezas = partirEscrita(W);
    const ev = n.evento && !n.evento.silencio ? n.evento : null;
    // Una nota que se prolonga por ligadura no puede ser corta: se retira el picado.
    if (ev && (piezas.length > 1 || ev.ligaSale) && (ev.articulacion === 'staccato' || ev.articulacion === 'staccatissimo')) {
      ev.articulacion = null;
    }
    piezas.forEach((pz, i) => {
      const real = pz.v.por(f);
      figuras.push({
        inicio: cursor,
        real,
        escrita: pz.v,
        valor: pz.valor,
        puntos: pz.puntos,
        silencio: !ev,
        alturas: ev ? ev.alturas : [],
        ligaEntra: ev ? (i > 0 || ev.liga) : false,
        ligaSale: ev ? (i < piezas.length - 1 || ev.ligaSale) : false,
        articulacion: ev && i === 0 && !ev.liga ? ev.articulacion : null,
        dinamicaEv: ev && i === 0 && !ev.liga ? ev.dinamica : null,
        abreTuplas: porAbrir,
        cierraTuplas: 0,
        tuplas: [...activas],
        haz: null,
      });
      porAbrir = [];
      cursor = cursor.mas(real);
    });
  };

  const grupo = (n, W, f, zonaRaiz) => {
    const { unidad, tupla } = dividir(W, sumaPesos(n.hijos));
    let f2 = f;
    if (tupla) {
      f2 = f.por(fr(tupla.normal, tupla.actual));
      abrir({ actual: tupla.actual, normal: tupla.normal, unidad, incompleta: false });
    }
    for (const h of n.hijos) {
      const desde = figuras.length;
      const Wh = unidad.por(fr(h.peso));
      if (h.hijos) grupo(h, Wh, f2, false);
      else hoja(h, Wh, f2);
      if (zonaRaiz) zonas.push([desde, figuras.length]);
    }
    if (tupla) cerrar();
  };

  if (compas.irracional) {
    factor = fr(p, compas.den);
    const g = mcd(compas.den, p); // 3/10 se rotula 5:4, no 10:8
    abrir({ actual: compas.den / g, normal: p / g, unidad: fr(1, p), incompleta: true });
    grupo(raiz, escrita, factor, true);
    cerrar();
  } else {
    grupo(raiz, escrita, factor, true);
  }

  zonas.forEach(([a, b]) => asignarHaces(figuras.slice(a, b)));
  marcarSignos(figuras);
  marcarDinamicas(figuras, estado);
  return figuras;
}

/** Une con haz las figuras breves de cada zona; la negra o mayor interrumpe. */
function asignarHaces(zona) {
  let tramo = [];
  const cerrarTramo = () => {
    while (tramo.length && tramo[0].silencio) tramo.shift();
    while (tramo.length && tramo[tramo.length - 1].silencio) tramo.pop();
    if (tramo.filter((f) => !f.silencio).length >= 2) ponerHaz(tramo);
    tramo = [];
  };
  for (const f of zona) {
    if (f.valor >= 8) tramo.push(f);
    else cerrarTramo();
  }
  cerrarTramo();
}

let contadorHaz = 0;

function ponerHaz(tramo) {
  const id = ++contadorHaz;
  const maxN = Math.max(...tramo.map((f) => nivelesHaz(f.valor)));
  tramo.forEach((f) => { f.haz = { id, niveles: {} }; });
  for (let L = 1; L <= maxN; L++) {
    let i = 0;
    while (i < tramo.length) {
      if (nivelesHaz(tramo[i].valor) < L) { i++; continue; }
      let j = i;
      while (j + 1 < tramo.length && nivelesHaz(tramo[j + 1].valor) >= L) j++;
      if (i === j) {
        tramo[i].haz.niveles[L] = i === 0 ? 'gancho-der' : 'gancho-izq';
      } else {
        for (let k = i; k <= j; k++) tramo[k].haz.niveles[L] = k === i ? 'empieza' : k === j ? 'termina' : 'sigue';
      }
      i = j + 1;
    }
  }
}

/**
 * Una alteración vale solo para su nota. El becuadro se escribe si esa misma
 * nota (letra y octava) ya apareció alterada en el compás.
 */
function marcarSignos(figuras) {
  const alteradas = new Set();
  for (const f of figuras) {
    f.notas = f.alturas.map((q) => {
      const d = deletrear(q);
      const clave = `${d.letra}.${d.octava}`;
      let signo = null;
      if (!f.ligaEntra) {
        if (d.alter !== 0) signo = d.alter;
        else if (alteradas.has(clave)) signo = 0;
      }
      return { ...d, signo };
    });
    if (!f.ligaEntra) {
      for (const n of f.notas) {
        if (n.alter !== 0) alteradas.add(`${n.letra}.${n.octava}`);
        else alteradas.delete(`${n.letra}.${n.octava}`);
      }
    }
  }
}

/** Solo se imprime la dinámica cuando cambia. */
function marcarDinamicas(figuras, estado) {
  for (const f of figuras) {
    f.dinamica = null;
    if (f.dinamicaEv !== null && f.dinamicaEv !== undefined && f.dinamicaEv !== estado.dinamica) {
      f.dinamica = DINAMICAS[f.dinamicaEv];
      estado.dinamica = f.dinamicaEv;
    }
  }
}

