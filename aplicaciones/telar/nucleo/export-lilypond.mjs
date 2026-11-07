// Exportación a LilyPond (notas neerlandesas, que incluyen cuartos de tono).

import { tuplaEstandar } from './escritura.mjs';

const escapar = (t) => String(t).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
const nombreVar = (i) => `voz${String.fromCharCode(65 + i)}`;

const octavaLy = (oct) => {
  const n = oct - 3;
  return n > 0 ? "'".repeat(n) : ','.repeat(-n);
};

const ART = { staccato: '-.', staccatissimo: '-!', tenuto: '--', acento: '->', marcato: '-^' };
const CLAVE = { sol: 'treble', fa: 'bass', do3: 'alto' };

const notaLy = (n) => `${n.ly}${octavaLy(n.octava)}${n.signo === 0 ? '!' : ''}`;

function figuraLy(f) {
  const dur = `${f.valor}${'.'.repeat(f.puntos)}`;
  if (f.silencio) return `r${dur}`;
  const altura = f.notas.length === 1 ? notaLy(f.notas[0]) : `<${f.notas.map(notaLy).join(' ')}>`;
  let s = `${altura}${dur}`;
  if (f.ligaSale) s += '~';
  if (f.articulacion) s += ART[f.articulacion];
  if (f.dinamica) s += `\\${f.dinamica}`;
  return s;
}

function abreTupla(t) {
  const texto = t.incompleta || !tuplaEstandar(t) ? '\\tweak text #tuplet-number::calc-fraction-text ' : '';
  return `${texto}\\tuplet ${t.actual}/${t.normal} {`;
}

function medidaLy(figuras) {
  const partes = [];
  let hazActual = null;
  figuras.forEach((f, i) => {
    for (const t of f.abreTuplas) partes.push(abreTupla(t));
    let s = figuraLy(f);
    if (f.haz) {
      if (hazActual !== f.haz.id) { s += '['; hazActual = f.haz.id; }
      const sig = figuras[i + 1];
      if (!sig || !sig.haz || sig.haz.id !== f.haz.id) { s += ']'; hazActual = null; }
    }
    partes.push(s);
    for (let k = 0; k < f.cierraTuplas; k++) partes.push('}');
  });
  return partes.join(' ');
}

export function exportarLilyPond(part) {
  const lineas = [
    '\\version "2.26.0"',
    '\\language "nederlands"',
    '',
    `\\header { title = "${escapar(part.titulo)}" tagline = "Telar" }`,
    '\\paper { #(set-paper-size "a4") left-margin = 15 right-margin = 12 ragged-last-bottom = ##t markup-system-spacing.padding = 8 system-system-spacing.padding = 6 }',
    '',
  ];
  for (const v of part.voces) {
    lineas.push(`${nombreVar(v.indice)} = {`);
    lineas.push(`  \\clef ${CLAVE[v.instrumento.clave]}`);
    lineas.push('  \\accidentalStyle forget');
    lineas.push('  \\autoBeamOff');
    let previo = null;
    v.medidas.forEach((m, i) => {
      const et = m.compas.etiqueta;
      const cambio = et !== previo ? `\\time ${et} ` : '';
      previo = et;
      lineas.push(`  ${cambio}${medidaLy(m.figuras)} | % c. ${i + 1}`);
    });
    lineas.push('}', '');
  }
  lineas.push('\\score {', '  <<');
  lineas.push(`    \\new Staff \\with { instrumentName = "${escapar(part.voces[0].instrumento.nombre)}" shortInstrumentName = "${escapar(part.voces[0].instrumento.abrev)}" } { \\tempo 4 = ${part.tempo} \\${nombreVar(0)} }`);
  for (const v of part.voces.slice(1)) {
    lineas.push(`    \\new Staff \\with { instrumentName = "${escapar(v.instrumento.nombre)}" shortInstrumentName = "${escapar(v.instrumento.abrev)}" } { \\${nombreVar(v.indice)} }`);
  }
  lineas.push('  >>');
  lineas.push('  \\layout {');
  lineas.push('    \\numericTimeSignature');
  lineas.push('    \\context { \\Score');
  lineas.push('      proportionalNotationDuration = #1/24');
  lineas.push('      \\override SpacingSpanner.uniform-stretching = ##t');
  lineas.push('      \\override TupletBracket.bracket-visibility = ##t');
  lineas.push('      \\override TupletBracket.direction = #UP');
  lineas.push('      tupletFullLength = ##f');
  lineas.push('    }');
  lineas.push('  }');
  // El MIDI de LilyPond no admite compases irracionales: se omite el compás, no las notas.
  lineas.push(`  \\midi { \\tempo 4 = ${part.tempo} \\context { \\Score \\remove "Time_signature_performer" } }`);
  lineas.push('}', '');
  return lineas.join('\n');
}
