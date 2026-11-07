// Vista «Tejido»: cada fila es un hilo y cada columna un ataque. Se ve dónde
// se realinean los periodos, sin leer una sola nota.

import { DINAMICAS } from '../nucleo/armonia.mjs';

const COLUMNA = 9;
const FILA = 13;
const MARGEN = 104;
const MAX_ATAQUES = 400;

const NOMBRES = { altura: 'Altura', densidad: 'Densidad', dinamica: 'Dinámica', articulacion: 'Articulación' };
const COLOR = { altura: 200, densidad: 95, dinamica: 16, articulacion: 280 };

function tono(hilo, valor, valores) {
  const lista = [...new Set(valores)];
  const i = lista.indexOf(valor);
  const luz = 88 - (58 * i) / Math.max(1, lista.length - 1 || 1);
  return `hsl(${COLOR[hilo]} 55% ${lista.length === 1 ? 70 : luz}%)`;
}

const etiqueta = (hilo, v) => {
  if (hilo === 'dinamica') return DINAMICAS[v];
  if (hilo === 'articulacion') return v ?? 'sin articulación';
  return String(v);
};

export function dibujarTejido(part, proyecto) {
  const trozos = [];
  let y = 8;
  let anchoMax = 0;
  part.voces.forEach((voz, iv) => {
    const seg = voz.seguimiento.slice(0, MAX_ATAQUES);
    const n = seg.length;
    const ancho = MARGEN + n * COLUMNA + 8;
    anchoMax = Math.max(anchoMax, ancho);
    trozos.push(`<text x="0" y="${y + 11}" class="tj-voz">${esc(voz.nombre)}</text>`);
    y += 18;
    const cimaFilas = y;
    for (const hilo of ['altura', 'densidad', 'dinamica', 'articulacion']) {
      const definidos = seg.map((s) => s[hilo]);
      trozos.push(`<text x="${MARGEN - 8}" y="${y + 10}" text-anchor="end" class="tj-hilo">${NOMBRES[hilo]}</text>`);
      const leido = proyecto.voces[iv].hilos[hilo];
      const paso = Number(leido.paso) || 1;
      const largo = String(leido.valores).trim().split(/\s+/).length;
      seg.forEach((s, i) => {
        trozos.push(`<rect x="${MARGEN + i * COLUMNA}" y="${y}" width="${COLUMNA - 1}" height="${FILA - 2}" fill="${tono(hilo, s[hilo], definidos)}"><title>Ataque ${s.ataque + 1} · ${NOMBRES[hilo]}: ${esc(etiqueta(hilo, s[hilo]))}</title></rect>`);
      });
      // Marca de cada reinicio del ciclo.
      if ((leido.modo ?? 'ataque') === 'ataque') {
        const periodo = largo * paso;
        const fase = ((Number(leido.fase) || 0) * paso) % periodo;
        for (let i = (periodo - fase) % periodo; i < n; i += periodo) {
          trozos.push(`<rect x="${MARGEN + i * COLUMNA - 1}" y="${y - 1}" width="1.5" height="${FILA}" class="tj-marca"/>`);
        }
      }
      y += FILA;
    }
    // Realineación completa de los cuatro hilos.
    const ciclos = ['altura', 'densidad', 'dinamica', 'articulacion'].map((h) => proyecto.voces[iv].hilos[h]);
    if (ciclos.every((h) => (h.modo ?? 'ataque') === 'ataque')) {
      for (let i = 0; i < n; i++) {
        const coincide = ciclos.every((h) => {
          const periodo = String(h.valores).trim().split(/\s+/).length * (Number(h.paso) || 1);
          const fase = ((Number(h.fase) || 0) * (Number(h.paso) || 1)) % periodo;
          return (i + fase) % periodo === 0;
        });
        if (coincide) {
          trozos.push(`<rect x="${MARGEN + i * COLUMNA - 1}" y="${cimaFilas - 4}" width="2.5" height="${y - cimaFilas + 7}" class="tj-coincide"><title>Todos los hilos reinician a la vez (ataque ${i + 1})</title></rect>`);
        }
      }
    }
    y += 16;
  });
  const ancho = Math.max(anchoMax, 400);
  return `<svg xmlns="http://www.w3.org/2000/svg" class="tejido" viewBox="0 0 ${ancho} ${y}" width="${ancho}" height="${y}" role="img" aria-label="Tejido de hilos por voz">${trozos.join('')}</svg>`;
}

const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Tira proporcional de un patrón: cada nivel del árbol es una fila. */
export function dibujarTira(patron, ancho = 300) {
  const FILA_T = 12;
  const rects = [];
  let maxProf = 0;
  const paso = (nodos, x, w, prof) => {
    maxProf = Math.max(maxProf, prof);
    const S = nodos.reduce((a, n) => a + n.peso, 0);
    let cur = x;
    for (const n of nodos) {
      const wn = (w * n.peso) / S;
      if (n.hijos) {
        rects.push(`<rect x="${cur.toFixed(1)}" y="${prof * FILA_T}" width="${Math.max(wn - 1, 0.5).toFixed(1)}" height="${FILA_T - 2}" class="tr-grupo"/>`);
        paso(n.hijos, cur, wn, prof + 1);
      } else {
        const cl = n.tipo === 'silencio' ? 'tr-silencio' : n.tipo === 'liga' ? 'tr-liga' : 'tr-nota';
        rects.push(`<rect x="${cur.toFixed(1)}" y="${prof * FILA_T}" width="${Math.max(wn - 1, 0.5).toFixed(1)}" height="${FILA_T - 2}" class="${cl}"/>`);
      }
      cur += wn;
    }
  };
  paso(patron, 0, ancho, 0);
  const alto = (maxProf + 1) * FILA_T;
  return `<svg xmlns="http://www.w3.org/2000/svg" class="tira" viewBox="0 0 ${ancho} ${alto}" width="100%" height="${alto}" preserveAspectRatio="none" aria-hidden="true">${rects.join('')}</svg>`;
}

/** Curva de un proceso, en miniatura. */
export function dibujarCurva(proceso, curva, ancho = 150, alto = 34) {
  const puntos = [];
  for (let i = 0; i <= 60; i++) {
    const t = i / 60;
    const f = curva(proceso, t);
    if (f === null) continue;
    puntos.push(`${(t * ancho).toFixed(1)},${(alto - 3 - f * (alto - 6)).toFixed(1)}`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" class="curva" viewBox="0 0 ${ancho} ${alto}" width="${ancho}" height="${alto}" aria-hidden="true"><line x1="0" x2="${ancho}" y1="${alto - 2}" y2="${alto - 2}" class="curva-base"/><polyline points="${puntos.join(' ')}" class="curva-linea"/></svg>`;
}
