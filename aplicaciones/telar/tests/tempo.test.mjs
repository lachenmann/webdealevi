// La unidad de tempo: misma música, mismo cálculo en todas las salidas.

import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { generar, validar, negrasPorMinuto, ORDEN_UNIDADES, UNIDADES_TEMPO } from '../nucleo/motor.mjs';
import { EJEMPLOS, copiarProyecto } from '../nucleo/ejemplos.mjs';
import { asegurarMaterial } from '../nucleo/material.mjs';
import { exportarLilyPond } from '../nucleo/export-lilypond.mjs';
import { exportarMusicXML } from '../nucleo/export-musicxml.mjs';
import { exportarMIDI } from '../nucleo/export-midi.mjs';
import { grabar } from '../interfaz/grabado.mjs';
import { leerMIDI, leerXML, hijos, hijo } from './ayuda.mjs';

const proyecto = (unidadTempo, tempo = 60) => ({ ...copiarProyecto(EJEMPLOS.fagot.proyecto), unidadTempo, tempo });

const usDe = (bytes) => {
  const midi = leerMIDI(bytes);
  const e = midi.pistas.flatMap((p) => p.eventos).find((x) => x.meta === 0x51);
  return (e.datos[0] << 16) + (e.datos[1] << 8) + e.datos[2];
};

const CASOS = [['2.', 180], ['2', 120], ['4.', 90], ['4', 60], ['8.', 45], ['8', 30], ['16', 15]];

test('las unidades equivalen a la negra que corresponde', () => {
  const esperado = { '2.': 180, 2: 120, '4.': 90, 4: 60, '8.': 45, 8: 30, 16: 15 };
  for (const k of ORDEN_UNIDADES) assert.equal(negrasPorMinuto(60, k), esperado[k], k);
  assert.equal(ORDEN_UNIDADES.length, Object.keys(UNIDADES_TEMPO).length);
});

test('sin unidad se entiende la negra, como en los proyectos anteriores', () => {
  const a = generar(EJEMPLOS.fagot.proyecto);
  assert.equal(a.claveUnidad, '4');
  assert.equal(a.negrasPorMinuto, 48);
  assert.equal(asegurarMaterial({}).unidadTempo, '4');
  assert.equal(asegurarMaterial({ unidadTempo: '8' }).unidadTempo, '8');
  assert.match(exportarLilyPond(a), /\\tempo 4 = 48/);
});

test('la duración sigue a la unidad y la música no cambia', () => {
  const base = generar(proyecto('4', 60));
  const huella = (p) => p.voces[0].eventos.map((e) => `${e.inicio}|${e.dur}|${e.alturas}`).join(',');
  for (const [k, negras] of CASOS) {
    const p = generar(proyecto(k, 60));
    assert.equal(huella(p), huella(base), k);
    assert.ok(Math.abs(p.segundos - (base.segundos * 60) / negras) < 1e-9, k);
  }
});

test('MIDI: el tempo corresponde a la negra equivalente', () => {
  for (const [k, negras] of CASOS) {
    assert.equal(usDe(exportarMIDI(generar(proyecto(k, 60))).bytes), Math.round(60000000 / negras), k);
  }
});

test('LilyPond y MusicXML escriben la figura elegida', () => {
  const tipos = { 2: 'half', 4: 'quarter', 8: 'eighth', 16: '16th' };
  for (const [k, negras] of CASOS) {
    const part = generar(proyecto(k, 60));
    const ly = exportarLilyPond(part);
    assert.equal(ly.split(`\\tempo ${k} = 60`).length - 1, 2, `LilyPond ${k}`);
    const raiz = leerXML(exportarMusicXML(part));
    const dir = hijo(hijos(raiz, 'part')[0], 'measure').hijos.find((n) => n.nombre === 'direction');
    const met = hijo(hijo(dir, 'direction-type'), 'metronome');
    assert.equal(hijo(met, 'beat-unit').texto, tipos[UNIDADES_TEMPO[k].valor], k);
    assert.equal(hijos(met, 'beat-unit-dot').length, UNIDADES_TEMPO[k].puntos, k);
    assert.equal(hijo(met, 'per-minute').texto, '60');
    assert.equal(Number(hijo(dir, 'sound').attrs.tempo), negras, k);
  }
});

test('la partitura en pantalla dibuja la figura de metrónomo', () => {
  const glifos = { 2: '\uE1D3', 4: '\uE1D5', 8: '\uE1D7', 16: '\uE1D9' };
  for (const [k] of CASOS) {
    const { svg } = grabar(generar(proyecto(k, 60)), { ancho: 900, s: 7 });
    const u = UNIDADES_TEMPO[k];
    assert.ok(svg.includes(`>${glifos[u.valor]}${'\uE1E7'.repeat(u.puntos)}</text>`), k);
    assert.ok(svg.includes('>= 60</text>'), k);
    assert.ok(!/NaN/.test(svg));
  }
});

test('la validación rechaza unidades desconocidas y tempos fuera de lo representable', () => {
  assert.ok(validar({ ...proyecto('4'), unidadTempo: 'x' }).some((e) => e.ruta === 'unidadTempo'));
  assert.ok(validar({ ...proyecto('4'), unidadTempo: 'toString' }).some((e) => e.ruta === 'unidadTempo'));
  const lento = validar(proyecto('16', 10));
  assert.ok(lento.some((e) => e.ruta === 'tempo' && /negra = 2.5/.test(e.mensaje)), JSON.stringify(lento));
  assert.deepEqual(validar(proyecto('16', 16)), []);
  assert.deepEqual(validar(proyecto('2.', 300)), []);
});

const LY = process.env.LILYPOND || 'D:/lilypond-2.26.0/bin/lilypond.exe';
const PY = LY.replace(/lilypond\.exe$/, 'python.exe');
const M2L = LY.replace(/lilypond\.exe$/, 'musicxml2ly.py');

test('LilyPond real entiende cada unidad y su MIDI lleva el mismo tempo', { skip: !existsSync(LY) && `sin ${LY}`, timeout: 300000 }, () => {
  const dir = mkdtempSync(join(tmpdir(), 'telar-tempo-'));
  try {
    for (const [i, [k, negras]] of CASOS.entries()) {
      const pr = copiarProyecto(proyecto(k, 60));
      pr.tiempo.numCompases = 2;
      pr.tiempo.compases = '3/8 3/10';
      const part = generar(pr);
      const f = join(dir, `t${i}.ly`);
      writeFileSync(f, exportarLilyPond(part));
      const r = spawnSync(LY, ['-dno-print-pages', '-dmidi-extension=midi', '-o', join(dir, `t${i}`), f], { encoding: 'utf8', timeout: 90000 });
      assert.equal(r.status, 0, r.stderr);
      assert.ok(!/error|advertencia|warning/i.test(r.stderr.replace(/.*comprim.*/gi, '')), r.stderr);
      const propio = usDe(exportarMIDI(part).bytes);
      const suyo = usDe(readFileSync(join(dir, `t${i}.midi`)));
      assert.ok(Math.abs(propio - suyo) <= Math.ceil(propio / 1000), `${k}: ${propio} ≠ ${suyo}`);
      if (existsSync(M2L) && existsSync(PY)) {
        const xml = join(dir, `t${i}.musicxml`);
        const salida = join(dir, `t${i}-xml.ly`);
        writeFileSync(xml, exportarMusicXML(part));
        const c = spawnSync(PY, [M2L, '-o', salida, xml], { encoding: 'utf8', timeout: 60000 });
        assert.equal(c.status, 0, c.stderr);
        // musicxml2ly dibuja el metrónomo como texto, y deja en su MIDI la negra equivalente.
        assert.ok(readFileSync(salida, 'utf8').includes(`\\tempo 4 = ${negras}`), `musicxml2ly lee ${k} como negra = ${negras}`);
      }
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
