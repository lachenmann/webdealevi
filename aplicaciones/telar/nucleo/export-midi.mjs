// Exportación a MIDI estándar (formato 1).
// Cada voz usa dos canales: uno sin desviar y otro con pitch bend de +50 cents,
// de modo que un acorde pueda mezclar semitonos y cuartos de tono.
// El formato solo admite denominadores potencia de 2: si la pieza tiene compases
// irracionales no se escribe compás, solo marcadores de texto con su etiqueta.

import { fr, mcmBig } from './fraccion.mjs';
import { notasSonoras } from './motor.mjs';

const PPQ_APROX = 15360;
const PPQ_MAX = 32767n;

const vlq = (n) => {
  const b = [n & 0x7f];
  for (n >>= 7; n > 0; n >>= 7) b.unshift((n & 0x7f) | 0x80);
  return b;
};
const u32 = (n) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
const u16 = (n) => [(n >>> 8) & 255, n & 255];
const texto = (t) => [...new TextEncoder().encode(t)];

/** Elige la resolución: exacta si cabe; si no, se redondea sin acumular deriva. */
export function resolucionDe(part) {
  let d = 1n;
  for (const c of part.compases) d = mcmBig(d, c.inicio.por(fr(4)).d);
  for (const v of part.voces) {
    for (const n of notasSonoras(v)) {
      d = mcmBig(d, n.inicio.por(fr(4)).d);
      d = mcmBig(d, n.inicio.mas(n.sonora).por(fr(4)).d);
    }
  }
  if (d <= PPQ_MAX) {
    // Múltiplo cómodo, para que los programas no reciban resoluciones mínimas.
    let ppq = d;
    while (ppq * 2n <= 3840n) ppq *= 2n;
    return { ppq: Number(ppq), exacta: true };
  }
  return { ppq: PPQ_APROX, exacta: false };
}

export const canalesDeVoz = (i) => {
  const salta = (c) => (c >= 9 ? c + 1 : c); // el canal 10 es percusión
  return [salta(i * 2), salta(i * 2 + 1)];
};

function pista(eventos) {
  eventos.sort((a, b) => a.tick - b.tick || a.orden - b.orden);
  const datos = [];
  let cursor = 0;
  for (const e of eventos) {
    datos.push(...vlq(e.tick - cursor), ...e.bytes);
    cursor = e.tick;
  }
  datos.push(0, 0xff, 0x2f, 0);
  return [...texto('MTrk'), ...u32(datos.length), ...datos];
}

const meta = (tipo, bytes) => [0xff, tipo, ...vlq(bytes.length), ...bytes];

export function exportarMIDI(part) {
  const { ppq, exacta } = resolucionDe(part);
  const tickDe = (t) => {
    const x = t.por(fr(4 * ppq));
    return Number((x.n * 2n + x.d) / (x.d * 2n)); // redondeo desde la posición absoluta
  };

  const irracionales = part.compases.some((c) => c.irracional);
  const conductor = [];
  const usPorNegra = Math.round(60000000 / part.negrasPorMinuto);
  conductor.push({ tick: 0, orden: 0, bytes: meta(0x03, texto(part.titulo)) });
  conductor.push({ tick: 0, orden: 1, bytes: meta(0x51, [(usPorNegra >> 16) & 255, (usPorNegra >> 8) & 255, usPorNegra & 255]) });
  let previo = null;
  for (const c of part.compases) {
    const tick = tickDe(c.inicio);
    if (c.etiqueta !== previo) {
      if (!irracionales) {
        conductor.push({ tick, orden: 2, bytes: meta(0x58, [c.num, Math.log2(c.den), 24, 8]) });
      } else {
        conductor.push({ tick, orden: 2, bytes: meta(0x06, texto(`${c.etiqueta} (c. ${c.indice + 1})`)) });
      }
      previo = c.etiqueta;
    }
  }
  const pistas = [pista(conductor)];

  for (const v of part.voces) {
    const [canalA, canalB] = canalesDeVoz(v.indice);
    const ev = [];
    ev.push({ tick: 0, orden: 0, bytes: meta(0x03, texto(v.nombre)) });
    for (const canal of [canalA, canalB]) {
      ev.push({ tick: 0, orden: 1, bytes: [0xc0 | canal, v.instrumento.programa] });
      // Fija el ámbito de pitch bend en ±2 semitonos (RPN 0).
      ev.push({ tick: 0, orden: 2, bytes: [0xb0 | canal, 101, 0] });
      ev.push({ tick: 0, orden: 3, bytes: [0xb0 | canal, 100, 0] });
      ev.push({ tick: 0, orden: 4, bytes: [0xb0 | canal, 6, 2] });
      ev.push({ tick: 0, orden: 5, bytes: [0xb0 | canal, 38, 0] });
    }
    // +50 cents = 8192 + 2048 con ámbito de ±200 cents.
    ev.push({ tick: 0, orden: 6, bytes: [0xe0 | canalB, 10240 & 0x7f, (10240 >> 7) & 0x7f] });
    for (const n of notasSonoras(v)) {
      const on = tickDe(n.inicio);
      const off = Math.max(on + 1, tickDe(n.inicio.mas(n.sonora)));
      for (const q of n.alturas) {
        const cuarto = q % 2 !== 0;
        const nota = (q - (cuarto ? 1 : 0)) / 2;
        const canal = cuarto ? canalB : canalA;
        ev.push({ tick: on, orden: 8, bytes: [0x90 | canal, nota, n.velocidad] });
        ev.push({ tick: off, orden: 7, bytes: [0x80 | canal, nota, 0] });
      }
    }
    pistas.push(pista(ev));
  }

  const cabecera = [...texto('MThd'), ...u32(6), ...u16(1), ...u16(pistas.length), ...u16(ppq)];
  return { bytes: new Uint8Array([...cabecera, ...pistas.flat()]), ppq, exacta, irracionales };
}
