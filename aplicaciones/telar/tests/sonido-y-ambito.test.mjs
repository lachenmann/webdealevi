// Proyecto en blanco, alturas directas, ámbito por voz y elección de muestras.

import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { generar, validar, notasSonoras, leerHilo } from '../nucleo/motor.mjs';
import { EJEMPLOS, copiarProyecto, proyectoEnBlanco } from '../nucleo/ejemplos.mjs';
import { INSTRUMENTOS, CLAVES, instrumentoDeVoz, leerAltura, frecuencia } from '../nucleo/armonia.mjs';
import { ErrorTelar } from '../nucleo/ritmo.mjs';
import { asegurarMaterial } from '../nucleo/material.mjs';
import { exportarLilyPond } from '../nucleo/export-lilypond.mjs';
import { exportarMusicXML } from '../nucleo/export-musicxml.mjs';
import { exportarMIDI } from '../nucleo/export-midi.mjs';
import { grabar } from '../interfaz/grabado.mjs';
import { BANCOS_VSCO, COMMIT_VSCO } from '../interfaz/muestras-vsco.mjs';
import { planearNota, planificar, necesidades, capaParaDinamica, ajustarWav, bytesParaSegundos, urlMuestra, NOTA_BREVE } from '../interfaz/muestras.mjs';
import { leerMIDI, leerXML, hijos, hijo } from './ayuda.mjs';

const voz = (extra = {}, hilos = {}) => {
  const p = proyectoEnBlanco();
  Object.assign(p.voces[0], extra);
  Object.assign(p.voces[0].hilos.altura, hilos);
  return p;
};

test('el proyecto en blanco es válido y genera música', () => {
  const p = proyectoEnBlanco();
  assert.deepEqual(validar(p), []);
  const part = generar(p);
  assert.equal(part.compases.length, 4);
  assert.equal(part.ataques, 16);
  assert.equal(part.voces[0].eventos[0].alturas[0], leerAltura('Do4'));
  assert.ok(!/NaN/.test(grabar(part, { ancho: 800, s: 7 }).svg));
  assert.ok(exportarLilyPond(part).includes('\\time 4/4'));
});

test('alturas directas: suenan en orden, sin pasar por el campo, y se mezclan con índices', () => {
  const part = generar(voz({}, { valores: 'Re4+ Sib3 0 La5' }));
  const notas = notasSonoras(part.voces[0]).map((n) => n.alturas[0]);
  assert.deepEqual(notas.slice(0, 4), [leerAltura('Re4+'), leerAltura('Sib3'), leerAltura('Do4'), leerAltura('La5')]);
  assert.deepEqual(notas.slice(4, 8), notas.slice(0, 4));
  assert.throws(() => leerHilo('altura', { valores: 'Do4 xyz' }), ErrorTelar);
});

test('una altura directa fuera de ámbito se pliega y la interfaz lo avisa', () => {
  const part = generar(voz({ instrumento: 'flauta' }, { valores: 'Do2' }));
  assert.equal(part.voces[0].eventos[0].alturas[0], leerAltura('Do4'));
  assert.ok(part.avisos.some((a) => /fuera del ámbito/.test(a)));
  const ampliada = generar(voz({ instrumento: 'flauta', grave: 'Do2' }, { valores: 'Do2' }));
  assert.equal(ampliada.voces[0].eventos[0].alturas[0], leerAltura('Do2'));
  assert.deepEqual(ampliada.avisos, []);
});

test('el ámbito por voz amplía y recorta el del instrumento', () => {
  const base = copiarProyecto(EJEMPLOS.fagot.proyecto);
  base.procesos = [];
  base.campos = [{ tipo: 'lista', notas: 'Do1 Do2 Do3 Do4 Do5 Do6 Do7', compases: 10 }];
  base.voces[0].hilos.altura.valores = '0 3 6 1 5';
  base.voces[0].grave = 'Do1';
  base.voces[0].agudo = 'Do7';
  const part = generar(base);
  assert.equal(part.voces[0].instrumento.min, leerAltura('Do1'));
  assert.equal(part.voces[0].instrumento.max, leerAltura('Do7'));
  const qs = part.voces[0].eventos.flatMap((e) => e.alturas);
  assert.ok(qs.some((q) => q < INSTRUMENTOS.fagot.min || q > INSTRUMENTOS.fagot.max), 'usa el ámbito ampliado');
  assert.ok(qs.every((q) => q >= leerAltura('Do1') && q <= leerAltura('Do7')));
  const estrecho = copiarProyecto(base);
  estrecho.voces[0].grave = 'La3';
  estrecho.voces[0].agudo = 'Mi4';
  for (const q of generar(estrecho).voces[0].eventos.flatMap((e) => e.alturas)) {
    assert.ok(q >= leerAltura('La3') && q <= leerAltura('Mi4'));
  }
  assert.equal(instrumentoDeVoz({ instrumento: 'fagot', grave: '', agudo: '' }).min, INSTRUMENTOS.fagot.min);
});

test('notas simultáneas por voz: un viento puede tocar acordes si se le permite', () => {
  const p = copiarProyecto(EJEMPLOS.trio.proyecto);
  p.procesos = [];
  p.voces = [p.voces[1]];
  p.voces[0].hilos.densidad = { valores: '3', paso: 1, fase: 0, modo: 'ataque' };
  const maxDe = (x) => Math.max(...generar(x).voces[0].eventos.map((e) => e.alturas.length));
  assert.equal(maxDe(p), 1, 'el fagot es monódico por defecto');
  p.voces[0].maxAcorde = 3;
  assert.equal(maxDe(p), 3);
});

test('la validación del ámbito señala cada campo', () => {
  const rutas = (extra) => validar(voz(extra)).map((e) => e.ruta);
  assert.ok(rutas({ grave: 'xx' }).includes('voces.0.grave'));
  assert.ok(rutas({ agudo: 'xx' }).includes('voces.0.agudo'));
  assert.ok(rutas({ grave: 'Do6', agudo: 'Do5' }).includes('voces.0.agudo'));
  assert.ok(rutas({ clave: 'luna' }).includes('voces.0.clave'));
  assert.ok(rutas({ clave: 'toString' }).includes('voces.0.clave'));
  assert.ok(rutas({ maxAcorde: 12 }).includes('voces.0.maxAcorde'));
  assert.ok(rutas({ agudo: 'Do10' }).includes('voces.0.agudo'), 'fuera de MIDI');
  assert.deepEqual(rutas({ grave: '', agudo: '', clave: '', maxAcorde: '' }), []);
});

test('la clave elegida llega a todas las salidas', () => {
  const part = generar(voz({ instrumento: 'fagot', clave: 'do4' }, { valores: 'Do4' }));
  assert.equal(part.voces[0].instrumento.clave, 'do4');
  assert.match(exportarLilyPond(part), /\\clef tenor/);
  const raiz = leerXML(exportarMusicXML(part));
  const clef = hijo(hijo(hijo(hijos(raiz, 'part')[0], 'measure'), 'attributes'), 'clef');
  assert.deepEqual([hijo(clef, 'sign').texto, hijo(clef, 'line').texto], ['C', '4']);
  assert.ok(!/NaN/.test(grabar(part, { ancho: 800, s: 7 }).svg));
  for (const k of Object.keys(CLAVES)) {
    assert.ok(!/NaN/.test(grabar(generar(voz({ clave: k })), { ancho: 800, s: 7 }).svg), k);
  }
  assert.equal(asegurarMaterial(proyectoEnBlanco()).voces[0].instrumento, 'piano');
});

test('el MIDI respeta un ámbito ampliado hasta sus límites', () => {
  const part = generar(voz({ grave: 'Do0', agudo: 'Sol9' }, { valores: 'Do0 Sol9' }));
  const midi = leerMIDI(exportarMIDI(part).bytes);
  const notas = midi.pistas[1].eventos.filter((e) => e.tipo === 0x90).map((e) => e.a);
  assert.ok(notas.includes(12) && notas.includes(127), notas.join(','));
});

/* ---------- Banco de muestras ---------- */

test('todos los instrumentos tienen banco, y el índice está bien formado', () => {
  assert.match(COMMIT_VSCO, /^[0-9a-f]{40}$/);
  for (const id of Object.keys(INSTRUMENTOS)) assert.ok(BANCOS_VSCO[id], `falta banco de ${id}`);
  for (const [id, b] of Object.entries(BANCOS_VSCO)) {
    for (const f of [b.sostenida, b.corta].filter(Boolean)) {
      assert.ok(f.notas.length >= 3, `${id}: ${f.ruta}`);
      for (const [midi, capas] of f.notas) {
        assert.ok(midi >= 12 && midi <= 120, `${id}: nota ${midi}`);
        assert.ok(capas.length >= 1 && capas.every((l) => l.length >= 1));
      }
    }
  }
});

test('el índice cubre el ámbito habitual de cada instrumento con poca transposición', () => {
  for (const [id, inst] of Object.entries(INSTRUMENTOS)) {
    const midis = BANCOS_VSCO[id].sostenida.notas.map((n) => n[0]);
    for (let m = inst.min / 2; m <= inst.max / 2; m++) {
      const d = Math.min(...midis.map((x) => Math.abs(x - m)));
      assert.ok(d <= 9, `${id}: nota ${m} queda a ${d} semitonos de su muestra`);
    }
  }
});

test('las capas siguen a la dinámica, de suave a fuerte', () => {
  for (const total of [1, 2, 3, 4]) {
    let previa = -1;
    for (let din = 0; din < 8; din++) {
      const { indice, ganancia } = capaParaDinamica(din, total);
      assert.ok(indice >= previa && indice < total, `${total} capas, din ${din}`);
      assert.ok(ganancia > 0.25 && ganancia < 3.5);
      previa = indice;
    }
    assert.equal(capaParaDinamica(0, total).indice, 0);
    assert.equal(capaParaDinamica(7, total).indice, total - 1);
  }
  const url = (din) => planearNota({ id: 'clarinete', q: leerAltura('Re4'), dinamica: din, articulacion: null, segundos: 1 })[0].url;
  assert.match(url(0), /_v1_/);
  assert.match(url(7), /_v3_/);
});

test('la velocidad de reproducción da la altura exacta, también en cuartos de tono', () => {
  for (const nombre of ['Do4', 'Do4+', 'Re4', 'Re#4+', 'Sol4-']) {
    const q = leerAltura(nombre);
    const [c] = planearNota({ id: 'clarinete', q, dinamica: 4, articulacion: null, segundos: 1 });
    const midiMuestra = BANCOS_VSCO.clarinete.sostenida.notas.map((n) => n[0]).reduce((a, b) => (Math.abs(b - q / 2) < Math.abs(a - q / 2) ? b : a));
    const hzMuestra = 440 * 2 ** ((midiMuestra - 69) / 12);
    assert.ok(Math.abs(hzMuestra * c.velocidad - frecuencia(q)) < 1e-9, nombre);
    assert.ok(c.velocidad > 0.7 && c.velocidad < 1.4, `${nombre}: ${c.velocidad}`);
  }
});

test('cada articulación elige su muestra', () => {
  const nota = (articulacion, segundos = 1) => planearNota({ id: 'fagot', q: leerAltura('Do3'), dinamica: 4, articulacion, segundos, escritos: 1.2 });
  const es = (c, t) => c.url.includes(`/Bassoon/${t}/`);
  assert.ok(es(nota(null)[0], 'sus'));
  assert.ok(es(nota('staccato', 0.5)[0], 'stac'));
  assert.ok(es(nota('staccatissimo', 0.5)[0], 'stac'));
  assert.ok(nota('staccatissimo', 0.5)[0].duracion < nota('staccato', 0.5)[0].duracion);
  assert.equal(nota('tenuto', 1)[0].duracion, 1.2, 'el tenuto llena la duración escrita');
  const acento = nota('acento');
  assert.equal(acento.length, 2);
  assert.ok(es(acento[0], 'sus') && es(acento[1], 'stac'));
  assert.equal(nota('marcato').length, 2);
  assert.ok(nota('marcato')[1].ganancia > acento[1].ganancia);
  assert.ok(es(nota(null, NOTA_BREVE - 0.01)[0], 'stac'), 'una nota muy breve usa la corta');
});

test('sin muestra corta, siempre suena la sostenida', () => {
  for (const art of [null, 'staccato', 'acento', 'marcato']) {
    const c = planearNota({ id: 'piano', q: leerAltura('Do4'), dinamica: 4, articulacion: art, segundos: 0.5 });
    assert.equal(c.length, 1, String(art));
    assert.match(c[0].url, /Upright/);
  }
  assert.equal(planearNota({ id: 'kazoo', q: 120, dinamica: 4, articulacion: null, segundos: 1 }), null);
});

test('la dinámica y el acento cambian lo que suena', () => {
  const g = (din, art) => planearNota({ id: 'violin', q: leerAltura('La4'), dinamica: din, articulacion: art, segundos: 1 })[0];
  assert.notEqual(g(0, null).url, g(7, null).url);
  const sinAcento = g(3, null);
  const conAcento = g(3, 'acento');
  assert.ok(conAcento.url !== sinAcento.url || conAcento.ganancia > sinAcento.ganancia);
});

test('las URL apuntan a una versión fija y codifican los espacios', () => {
  const u = urlMuestra('Strings/Solo Violin/Arco Vib', 'LLVln_ArcoVib_A4_f.wav');
  assert.equal(u, `https://raw.githubusercontent.com/sgossner/VSCO-2-CE/${COMMIT_VSCO}/Strings/Solo%20Violin/Arco%20Vib/LLVln_ArcoVib_A4_f.wav`);
  assert.ok(urlMuestra('Woodwinds/Flute/stac', 'x_A#3.wav').endsWith('x_A%233.wav'));
});

test('la planificación cubre la partitura y solo pide lo necesario', () => {
  const part = generar(EJEMPLOS.trio.proyecto);
  const e = planificar(part);
  const total = part.voces.reduce((a, v) => a + notasSonoras(v).reduce((x, n) => x + n.alturas.length, 0), 0);
  assert.equal(e.length, total);
  assert.ok(e.every((x, i) => i === 0 || e[i - 1].t <= x.t));
  assert.ok(e.every((x) => x.capas?.length >= 1 && x.capas.every((c) => c.velocidad > 0 && Number.isFinite(c.ganancia))));
  assert.equal(planificar(part, new Set([0, 1, 2])).length, 0);
  const n = necesidades(e);
  assert.ok(n.size > 0);
  for (const s of n.values()) assert.ok(s > 0 && s <= 7);
  // Una unidad de tempo más lenta alarga las notas y pide más audio.
  const lenta = generar({ ...EJEMPLOS.trio.proyecto, unidadTempo: '8' });
  assert.ok(planificar(lenta)[0].d > planificar(part)[0].d);
});

const wav = (declarados, reales, bloque = 4) => {
  const b = new ArrayBuffer(44 + reales);
  const v = new DataView(b);
  const txt = (p, t) => [...t].forEach((c, i) => v.setUint8(p + i, c.charCodeAt(0)));
  txt(0, 'RIFF'); v.setUint32(4, 36 + declarados, true); txt(8, 'WAVE');
  txt(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 2, true);
  v.setUint32(24, 44100, true); v.setUint32(28, 44100 * bloque, true); v.setUint16(32, bloque, true); v.setUint16(34, 16, true);
  txt(36, 'data'); v.setUint32(40, declarados, true);
  return b;
};

test('un WAV recortado se corrige; uno completo no se toca', () => {
  const completo = wav(100, 100);
  assert.equal(ajustarWav(completo), completo);
  const cortado = ajustarWav(wav(100000, 1002));
  const v = new DataView(cortado);
  assert.equal(cortado.byteLength, 44 + 1000, 'alineado al bloque de muestra');
  assert.equal(v.getUint32(40, true), 1000);
  assert.equal(v.getUint32(4, true), 36 + 1000);
  assert.throws(() => ajustarWav(new ArrayBuffer(100)));
  assert.ok(bytesParaSegundos(1) > 264600);
});

const LY = process.env.LILYPOND || 'D:/lilypond-2.26.0/bin/lilypond.exe';

test('LilyPond real compila ámbito ampliado, clave de tenor e instrumentos nuevos', { skip: !existsSync(LY) && `sin ${LY}`, timeout: 200000 }, () => {
  const dir = mkdtempSync(join(tmpdir(), 'telar-amb-'));
  try {
    const p = copiarProyecto(EJEMPLOS.trio.proyecto);
    p.tiempo.numCompases = 4;
    p.voces = ['trompa', 'arpa', 'tuba', 'flautin'].map((instrumento, i) => ({ ...p.voces[i % 3], nombre: instrumento, instrumento, grave: i === 0 ? 'Do1' : '', clave: i === 0 ? 'do4' : '' }));
    const part = generar(p);
    const f = join(dir, 'a.ly');
    writeFileSync(f, exportarLilyPond(part));
    const r = spawnSync(LY, ['-dno-print-pages', '-o', join(dir, 'a'), f], { encoding: 'utf8', timeout: 120000 });
    assert.equal(r.status, 0, r.stderr);
    assert.deepEqual(r.stderr.split('\n').filter((l) => /barcheck|error|advertencia|warning/i.test(l) && !/comprim|compress/i.test(l)), []);
    assert.ok(readFileSync(f, 'utf8').includes('\\clef tenor'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
