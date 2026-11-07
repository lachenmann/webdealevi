// Decide qué muestra suena para cada nota, y a qué velocidad y volumen. Sin Web Audio:
// es lógica pura, y por eso se puede probar fuera del navegador.

import { frecuencia } from '../nucleo/armonia.mjs';
import { notasSonoras } from '../nucleo/motor.mjs';
import { BANCOS_VSCO, COMMIT_VSCO } from './muestras-vsco.mjs';

const BASE = `https://raw.githubusercontent.com/sgossner/VSCO-2-CE/${COMMIT_VSCO}/`;
const hz = (midi) => 440 * 2 ** ((midi - 69) / 12);

export const urlMuestra = (ruta, archivo) => `${BASE}${`${ruta}/${archivo}`.split('/').map(encodeURIComponent).join('/')}`;

/** Por debajo de esto una muestra sostenida no llega a hablar: se usa la corta. */
export const NOTA_BREVE = 0.17;

const dinamicaEfectiva = (din, art) => {
  const base = din ?? 4;
  const refuerzo = art === 'marcato' ? 2 : art === 'acento' ? 1 : 0;
  return Math.min(7, base + refuerzo);
};

/** Cada dinámica cae en una capa; dentro de ella, un ajuste suave de volumen. */
export function capaParaDinamica(din, totalCapas) {
  const indice = Math.min(totalCapas - 1, Math.floor(((din + 0.5) / 8) * totalCapas));
  const centro = ((indice + 0.5) / totalCapas) * 8 - 0.5;
  const db = (din - centro) * (totalCapas === 1 ? 3 : 2);
  return { indice, ganancia: 10 ** (db / 20) };
}

function masCercana(notas, midi) {
  let mejor = notas[0];
  for (const n of notas) if (Math.abs(n[0] - midi) < Math.abs(mejor[0] - midi)) mejor = n;
  return mejor;
}

/** La muestra de una fuente para una altura y una dinámica. */
function tomar(fuente, q, din, turno) {
  const [midi, capas] = masCercana(fuente.notas, q / 2);
  const { indice, ganancia } = capaParaDinamica(din, capas.length);
  const repeticiones = capas[indice];
  return {
    url: urlMuestra(fuente.ruta, repeticiones[turno % repeticiones.length]),
    velocidad: frecuencia(q) / hz(midi),
    ganancia,
  };
}

/**
 * Las capas de audio de una nota, o null si el instrumento no tiene banco.
 *  - picado y muy picado: muestra corta;
 *  - acento: sostenida más fuerte, con el ataque de la corta encima;
 *  - marcato: ataque de la corta más presente, y sostenida recortada;
 *  - tenuto y sin articulación: sostenida. Si la nota es muy breve, corta.
 */
export function planearNota({ id, q, dinamica, articulacion, segundos, escritos = segundos, turno = 0 }) {
  const banco = BANCOS_VSCO[id];
  if (!banco) return null;
  const din = dinamicaEfectiva(dinamica, articulacion);
  const { sostenida, corta } = banco;
  const picado = articulacion === 'staccato' || articulacion === 'staccatissimo';
  const soltar = corta ? 0.09 : 0.35;
  const sola = (f, duracion, extra = {}) => ({ ...tomar(f, q, din, turno), duracion, soltar, ...extra });

  if (corta && (picado || (segundos < NOTA_BREVE && !articulacion))) {
    return [sola(corta, articulacion === 'staccatissimo' ? Math.min(segundos, 0.14) : Math.max(segundos, 0.1))];
  }
  if (corta && articulacion === 'acento') {
    return [sola(sostenida, segundos), { ...tomar(corta, q, din, turno), duracion: Math.min(segundos, 0.2), soltar: 0.05, ganancia: 0.55 }];
  }
  if (corta && articulacion === 'marcato') {
    return [sola(sostenida, Math.max(0.1, segundos)), { ...tomar(corta, q, din, turno), duracion: Math.min(segundos, 0.25), soltar: 0.05, ganancia: 0.85 }];
  }
  if (articulacion === 'tenuto') return [sola(sostenida, Math.max(segundos, escritos))];
  return [sola(sostenida, segundos)];
}

/** Todo lo que debe sonar en una partitura, en orden de tiempo. */
export function planificar(part, silenciadas = new Set()) {
  const seg = (4 * 60) / part.negrasPorMinuto;
  const eventos = [];
  for (const v of part.voces) {
    if (silenciadas.has(v.indice)) continue;
    let turno = 0;
    for (const n of notasSonoras(v)) {
      const segundos = Math.max(0.03, n.sonora.aNumero() * seg);
      const escritos = n.escrita.aNumero() * seg;
      for (const q of n.alturas) {
        eventos.push({
          t: n.inicio.aNumero() * seg,
          d: segundos,
          q,
          f: frecuencia(q),
          v: n.velocidad / 127,
          articulacion: n.articulacion,
          timbre: v.instrumento.timbre,
          polifonia: n.alturas.length,
          capas: planearNota({ id: v.instrumento.id, q, dinamica: n.dinamica, articulacion: n.articulacion, segundos, escritos, turno: turno++ }),
        });
      }
    }
  }
  return eventos.sort((a, b) => a.t - b.t);
}

/** Segundos de cada archivo que hacen falta para esta partitura. */
export function necesidades(eventos, maximo = 7) {
  const mapa = new Map();
  for (const e of eventos) {
    for (const c of e.capas ?? []) {
      const s = Math.min(maximo, (c.duracion + c.soltar + 0.05) * c.velocidad);
      mapa.set(c.url, Math.max(mapa.get(c.url) ?? 0, s));
    }
  }
  return mapa;
}

// WAV de 24 bits y estéreo: la cota alta para pedir solo los bytes necesarios.
export const bytesParaSegundos = (s) => Math.ceil(s * 44100 * 2 * 3) + 4096;

/**
 * Un WAV recortado por una petición parcial declara más datos de los que trae.
 * Se corrigen las longitudes para que cualquier navegador lo pueda decodificar.
 */
export function ajustarWav(buffer) {
  const v = new DataView(buffer);
  if (buffer.byteLength < 44 || v.getUint32(0) !== 0x52494646 || v.getUint32(8) !== 0x57415645) {
    throw new Error('No es un archivo WAV');
  }
  let p = 12;
  let bloque = 1;
  while (p + 8 <= buffer.byteLength) {
    const id = v.getUint32(p);
    const largo = v.getUint32(p + 4, true);
    if (id === 0x666d7420 && p + 22 <= buffer.byteLength) bloque = v.getUint16(p + 8 + 12, true) || 1; // «fmt »
    if (id === 0x64617461) { // «data»
      const disponibles = buffer.byteLength - (p + 8);
      if (largo <= disponibles) return buffer;
      const util = disponibles - (disponibles % bloque);
      v.setUint32(p + 4, util, true);
      v.setUint32(4, p + 8 + util - 8, true);
      return buffer.slice(0, p + 8 + util);
    }
    p += 8 + largo + (largo % 2);
  }
  throw new Error('WAV sin datos de audio');
}
