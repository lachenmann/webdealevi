// Exportación a MusicXML 4.0 (partwise).

import { fr, mcmBig } from './fraccion.mjs';
import { tuplaEstandar } from './escritura.mjs';

const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const TIPO = { 1: 'whole', 2: 'half', 4: 'quarter', 8: 'eighth', 16: '16th', 32: '32nd', 64: '64th', 128: '128th' };
const SIGNO = { 0: 'natural', 0.5: 'quarter-sharp', 1: 'sharp', 1.5: 'three-quarters-sharp', '-0.5': 'quarter-flat', '-1': 'flat' };
const ART = { staccato: 'staccato', staccatissimo: 'staccatissimo', tenuto: 'tenuto', acento: 'accent', marcato: 'strong-accent' };
const CLAVE = { sol: ['G', 2], fa: ['F', 4], do3: ['C', 3] };

/** Divisiones por negra: el mínimo que vuelve enteras todas las duraciones. */
export function divisionesDe(part) {
  let d = 1n;
  for (const v of part.voces) for (const m of v.medidas) for (const f of m.figuras) d = mcmBig(d, f.real.por(fr(4)).d);
  return d;
}

const tipoDeUnidad = (u) => TIPO[Number(u.d) / Number(u.n)] ?? 'eighth';

function notacionesTupla(f, abiertas) {
  const out = [];
  for (let i = 0; i < f.cierraTuplas; i++) {
    const t = abiertas.pop();
    out.push(`<tuplet type="stop" number="${t.nivel}"/>`);
  }
  return out;
}

function notaXml(f, n, indice, part, durDiv, abiertas, cierres) {
  const x = [];
  x.push('<note>');
  if (indice > 0) x.push('<chord/>');
  x.push('<pitch>', `<step>${n.paso}</step>`);
  if (n.alter !== 0) x.push(`<alter>${n.alter}</alter>`);
  x.push(`<octave>${n.octava}</octave>`, '</pitch>');
  x.push(`<duration>${durDiv}</duration>`);
  if (f.ligaEntra) x.push('<tie type="stop"/>');
  if (f.ligaSale) x.push('<tie type="start"/>');
  x.push('<voice>1</voice>', `<type>${TIPO[f.valor]}</type>`);
  for (let i = 0; i < f.puntos; i++) x.push('<dot/>');
  if (n.signo !== null) x.push(`<accidental>${SIGNO[n.signo]}</accidental>`);
  x.push(...modificacion(f));
  if (indice === 0) x.push(...haces(f));
  x.push(...notaciones(f, indice === 0, n, abiertas, cierres));
  x.push('</note>');
  return x.join('');
}

function modificacion(f) {
  if (!f.tuplas.length) return [];
  let a = 1, b = 1;
  for (const t of f.tuplas) { a *= t.actual; b *= t.normal; }
  return ['<time-modification>', `<actual-notes>${a}</actual-notes>`, `<normal-notes>${b}</normal-notes>`, '</time-modification>'];
}

function haces(f) {
  if (!f.haz) return [];
  const MAPA = { empieza: 'begin', sigue: 'continue', termina: 'end', 'gancho-der': 'forward hook', 'gancho-izq': 'backward hook' };
  return Object.entries(f.haz.niveles).map(([nivel, estado]) => `<beam number="${nivel}">${MAPA[estado]}</beam>`);
}

function notaciones(f, primera, n, abiertas, cierres) {
  const dentro = [];
  if (f.ligaEntra) dentro.push('<tied type="stop"/>');
  if (f.ligaSale) dentro.push('<tied type="start"/>');
  if (primera) {
    for (const t of f.abreTuplas) {
      const mostrar = t.incompleta || !tuplaEstandar(t) ? 'both' : 'actual';
      const tipo = tipoDeUnidad(t.unidad);
      dentro.push(`<tuplet type="start" number="${t.nivel}" bracket="yes" show-number="${mostrar}"><tuplet-actual><tuplet-number>${t.actual}</tuplet-number><tuplet-type>${tipo}</tuplet-type></tuplet-actual><tuplet-normal><tuplet-number>${t.normal}</tuplet-number><tuplet-type>${tipo}</tuplet-type></tuplet-normal></tuplet>`);
    }
    // Una tupla de una sola figura abre y cierra en la misma nota: primero abre.
    dentro.push(...cierres);
    if (f.articulacion) dentro.push(`<articulations><${ART[f.articulacion]}/></articulations>`);
  }
  return dentro.length ? ['<notations>', ...dentro, '</notations>'] : [];
}

function figuraXml(f, part, divs, abiertas) {
  const durDiv = f.real.por(fr(4)).por(fr(divs)).n.toString();
  // Las tuplas abren en orden exterior→interior, y cierran al revés.
  for (const t of f.abreTuplas) abiertas.push(t);
  const cierres = notacionesTupla(f, abiertas);
  if (f.silencio) {
    const x = ['<note>', '<rest/>', `<duration>${durDiv}</duration>`, '<voice>1</voice>', `<type>${TIPO[f.valor]}</type>`];
    for (let i = 0; i < f.puntos; i++) x.push('<dot/>');
    x.push(...modificacion(f), ...haces(f));
    const nota = notaciones({ ...f, ligaEntra: false, ligaSale: false }, true, null, abiertas, cierres);
    x.push(...nota, '</note>');
    return x.join('');
  }
  return f.notas.map((n, i) => notaXml(f, n, i, part, durDiv, abiertas, cierres)).join('');
}

export function exportarMusicXML(part) {
  const divs = divisionesDe(part);
  const x = [];
  x.push('<?xml version="1.0" encoding="UTF-8"?>');
  x.push('<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">');
  x.push('<score-partwise version="4.0">');
  x.push(`<work><work-title>${esc(part.titulo)}</work-title></work>`);
  x.push('<identification><encoding><software>Telar</software></encoding></identification>');
  x.push('<part-list>');
  part.voces.forEach((v) => {
    const id = `P${v.indice + 1}`;
    x.push(`<score-part id="${id}"><part-name>${esc(v.nombre)}</part-name><part-abbreviation>${esc(v.instrumento.abrev)}</part-abbreviation><score-instrument id="${id}-I1"><instrument-name>${esc(v.instrumento.nombre)}</instrument-name></score-instrument><midi-instrument id="${id}-I1"><midi-program>${v.instrumento.programa + 1}</midi-program></midi-instrument></score-part>`);
  });
  x.push('</part-list>');
  part.voces.forEach((v) => {
    x.push(`<part id="P${v.indice + 1}">`);
    let previo = null;
    v.medidas.forEach((m, i) => {
      x.push(`<measure number="${i + 1}">`);
      const cambio = m.compas.etiqueta !== previo;
      previo = m.compas.etiqueta;
      if (i === 0 || cambio) {
        x.push('<attributes>');
        if (i === 0) x.push(`<divisions>${divs}</divisions>`, '<key><fifths>0</fifths></key>');
        if (cambio) x.push(`<time><beats>${m.compas.num}</beats><beat-type>${m.compas.den}</beat-type></time>`);
        if (i === 0) {
          const [signo, linea] = CLAVE[v.instrumento.clave];
          x.push(`<clef><sign>${signo}</sign><line>${linea}</line></clef>`);
        }
        x.push('</attributes>');
      }
      if (i === 0 && v.indice === 0) {
        x.push(`<direction placement="above"><direction-type><metronome><beat-unit>quarter</beat-unit><per-minute>${part.tempo}</per-minute></metronome></direction-type><sound tempo="${part.tempo}"/></direction>`);
      }
      const abiertas = [];
      for (const f of m.figuras) {
        if (f.dinamica) x.push(`<direction placement="below"><direction-type><dynamics><${f.dinamica}/></dynamics></direction-type></direction>`);
        x.push(figuraXml(f, part, divs, abiertas));
      }
      x.push('</measure>');
    });
    x.push('</part>');
  });
  x.push('</score-partwise>', '');
  return x.join('\n');
}
