// Lee los archivos exportados con lectores independientes y los contrasta con la partitura.
// Si hay LilyPond instalado, además compila los ejemplos y compara su MIDI con el modelo.

import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { generar, notasSonoras } from '../nucleo/motor.mjs';
import { EJEMPLOS } from '../nucleo/ejemplos.mjs';
import { exportarLilyPond } from '../nucleo/export-lilypond.mjs';
import { exportarMusicXML, divisionesDe } from '../nucleo/export-musicxml.mjs';
import { exportarMIDI, canalesDeVoz } from '../nucleo/export-midi.mjs';
import { fr } from '../nucleo/fraccion.mjs';
import { leerXML, hijos, hijo, leerMIDI, notasDePista, proyectoAzar } from './ayuda.mjs';

const CASOS = [
  ...Object.entries(EJEMPLOS).map(([k, e]) => [k, generar(e.proyecto)]),
  ...Array.from({ length: 120 }, (_, i) => [`azar${i}`, generar(proyectoAzar(i + 1000))]),
];

test('MusicXML: bien formado y cada compás suma exactamente su duración', () => {
  for (const [nombre, part] of CASOS) {
    const raiz = leerXML(exportarMusicXML(part));
    assert.equal(raiz.nombre, 'score-partwise');
    const divs = BigInt(divisionesDe(part));
    const partes = hijos(raiz, 'part');
    assert.equal(partes.length, part.voces.length, nombre);
    partes.forEach((pt, ip) => {
      const medidas = hijos(pt, 'measure');
      assert.equal(medidas.length, part.compases.length, nombre);
      medidas.forEach((m, im) => {
        const c = part.compases[im];
        let suma = 0n;
        for (const n of hijos(m, 'note')) {
          if (!hijo(n, 'chord')) suma += BigInt(hijo(n, 'duration').texto);
          assert.ok(BigInt(hijo(n, 'duration').texto) > 0n, nombre);
        }
        const esperado = fr(4).por(fr(divs)).por(fr(c.num, c.den));
        assert.equal(esperado.d, 1n, `${nombre}: duración fraccionaria`);
        assert.equal(suma, esperado.n, `${nombre}, parte ${ip + 1}, c.${im + 1}`);
      });
    });
  }
});

test('MusicXML: toda tupla que empieza termina, nivel por nivel', () => {
  for (const [nombre, part] of CASOS) {
    const raiz = leerXML(exportarMusicXML(part));
    for (const pt of hijos(raiz, 'part')) {
      for (const m of hijos(pt, 'measure')) {
        const abiertos = {};
        for (const n of hijos(m, 'note')) {
          const not = hijo(n, 'notations');
          if (!not) continue;
          for (const t of hijos(not, 'tuplet')) {
            const k = t.attrs.number;
            if (t.attrs.type === 'start') {
              assert.ok(!abiertos[k], `${nombre}: nivel ${k} ya estaba abierto`);
              abiertos[k] = true;
            } else {
              assert.ok(abiertos[k], `${nombre}: nivel ${k} cierra sin abrir`);
              abiertos[k] = false;
            }
          }
        }
        assert.ok(Object.values(abiertos).every((x) => !x), `${nombre}: tupla sin cerrar`);
      }
    }
  }
});

test('MusicXML: alturas con cuartos de tono y orden de elementos', () => {
  const part = generar(EJEMPLOS.espectro.proyecto);
  const raiz = leerXML(exportarMusicXML(part));
  const notas = hijos(raiz, 'part').flatMap((p) => hijos(p, 'measure').flatMap((m) => hijos(m, 'note')));
  const alters = notas.map((n) => hijo(n, 'pitch')).filter(Boolean).map((p) => hijo(p, 'alter')?.texto).filter(Boolean);
  assert.ok(alters.some((a) => a === '0.5' || a === '1.5' || a === '-0.5'), 'debe haber cuartos de tono');
  const ORDEN = ['chord', 'pitch', 'rest', 'duration', 'tie', 'voice', 'type', 'dot', 'accidental', 'time-modification', 'beam', 'notations'];
  for (const n of notas) {
    const pos = n.hijos.map((h) => ORDEN.indexOf(h.nombre));
    assert.ok(pos.every((x) => x >= 0));
    assert.deepEqual(pos, [...pos].sort((a, b) => a - b), 'orden del esquema');
  }
});

test('MIDI: estructura, posiciones y pitch bend', () => {
  for (const [nombre, part] of CASOS) {
    const { bytes, ppq, exacta, irracionales } = exportarMIDI(part);
    const midi = leerMIDI(bytes);
    assert.equal(midi.formato, 1);
    assert.equal(midi.ppq, ppq);
    assert.equal(midi.pistas.length, part.voces.length + 1);
    const conductor = midi.pistas[0].eventos;
    assert.ok(conductor.some((e) => e.meta === 0x51), 'tempo');
    if (irracionales) assert.ok(!conductor.some((e) => e.meta === 0x58), `${nombre}: sin compás falso`);
    else assert.ok(conductor.some((e) => e.meta === 0x58), `${nombre}: compás`);

    part.voces.forEach((v, iv) => {
      const notas = notasDePista(midi.pistas[iv + 1]);
      const esperadas = notasSonoras(v).flatMap((n) => n.alturas.map((q) => ({ n, q })));
      assert.equal(notas.length, esperadas.length, `${nombre}: número de notas`);
      const [ca, cb] = canalesDeVoz(iv);
      const ordenadas = esperadas
        .map(({ n, q }) => ({ tick: n.inicio.por(fr(4 * ppq)).aNumero(), q, n }))
        .sort((a, b) => Math.round(a.tick) - Math.round(b.tick) || (a.q - (a.q % 2)) - (b.q - (b.q % 2)));
      for (let i = 0; i < notas.length; i++) {
        const dist = Math.abs(notas[i].inicio - ordenadas[i].tick);
        assert.ok(exacta ? dist === 0 : dist <= 0.5, `${nombre}: ataque a ${dist} ticks de su posición`);
      }
      // La grafía de cuartos de tono va al canal desviado.
      for (const n of notas) assert.ok(n.canal === ca || n.canal === cb, nombre);
      const qs = ordenadas.map((o) => o.q).sort((a, b) => a - b);
      const reconstruidas = notas.map((n) => n.nota * 2 + (n.canal === cb ? 1 : 0)).sort((a, b) => a - b);
      assert.deepEqual(reconstruidas, qs, `${nombre}: alturas`);
      const bend = midi.pistas[iv + 1].eventos.find((e) => e.tipo === 0xe0);
      assert.equal(bend.canal, cb);
      assert.equal(bend.a + bend.b * 128, 10240, '+50 cents con ámbito ±2');
    });
  }
});

test('LilyPond: llaves equilibradas y duraciones coherentes', () => {
  for (const [nombre, part] of CASOS) {
    const ly = exportarLilyPond(part);
    let prof = 0;
    for (const ch of ly.replace(/"[^"]*"/g, '').replace(/%.*$/gm, '')) {
      if (ch === '{') prof++;
      if (ch === '}') { prof--; assert.ok(prof >= 0, nombre); }
    }
    assert.equal(prof, 0, `${nombre}: llaves`);
    const abre = (ly.match(/\\tuplet/g) || []).length;
    const tuplas = part.voces.flatMap((v) => v.medidas.flatMap((m) => m.figuras.flatMap((f) => f.abreTuplas))).length;
    assert.equal(abre, tuplas, nombre);
    const hazAbre = (ly.match(/\[/g) || []).length;
    const hazCierra = (ly.match(/\]/g) || []).length;
    assert.equal(hazAbre, hazCierra, `${nombre}: haces`);
  }
});

/* ---------- Con LilyPond real ---------- */

const LY = process.env.LILYPOND || 'D:/lilypond-2.26.0/bin/lilypond.exe';

test('LilyPond real: compila sin avisos y su MIDI coincide con el modelo', { skip: !existsSync(LY) && `sin ${LY}`, timeout: 600000 }, () => {
  const dir = mkdtempSync(join(tmpdir(), 'telar-'));
  try {
    const casos = [
      ...Object.entries(EJEMPLOS).map(([k, e]) => [k, generar(e.proyecto)]),
      ...[1, 2, 3, 4, 5, 6].map((i) => [`azar${i}`, generar(proyectoAzar(i + 1000))]),
    ];
    for (const [nombre, part] of casos) {
      const archivo = join(dir, `${nombre}.ly`);
      writeFileSync(archivo, exportarLilyPond(part));
      const r = spawnSync(LY, ['-dno-print-pages', '-dmidi-extension=midi', '-o', join(dir, nombre), archivo], { encoding: 'utf8', timeout: 180000 });
      assert.equal(r.status, 0, `${nombre}: ${r.stderr}`);
      const problemas = r.stderr.split('\n')
        .filter((l) => /barcheck|error|programming|unterminated|fracaso|advertencia|warning/i.test(l))
        .filter((l) => !/comprim|compress/i.test(l)); // una página llena no es un defecto de la música
      assert.deepEqual(problemas, [], nombre);

      const midi = leerMIDI(readFileSync(join(dir, `${nombre}.midi`)));
      const pistas = midi.pistas.filter((p) => p.eventos.some((e) => e.tipo === 0x90));
      const voces = part.voces.filter((v) => notasSonoras(v).length);
      assert.equal(pistas.length, voces.length, `${nombre}: pistas con notas`);
      voces.forEach((v, i) => {
        const esperados = [...new Set(notasSonoras(v).map((n) => n.inicio.por(fr(4 * midi.ppq)).aNumero()))].sort((a, b) => a - b);
        const reales = [...new Set(pistas[i].eventos.filter((e) => e.tipo === 0x90 && e.b > 0).map((e) => e.tick))].sort((a, b) => a - b);
        assert.equal(reales.length, esperados.length, `${nombre}, ${v.nombre}: ataques`);
        reales.forEach((t, k) => assert.ok(Math.abs(t - esperados[k]) <= 2, `${nombre}: ataque ${k}: ${t} ≠ ${esperados[k]}`));
      });
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

/* ---------- MusicXML leído por un programa ajeno: musicxml2ly ---------- */

const PY = LY.replace(/lilypond\.exe$/, 'python.exe');
const M2L = LY.replace(/lilypond\.exe$/, 'musicxml2ly.py');
const hayM2L = existsSync(M2L) && existsSync(PY);

test('musicxml2ly importa el MusicXML y sus ataques coinciden con el modelo', { skip: !hayM2L && 'sin musicxml2ly', timeout: 600000 }, () => {
  const dir = mkdtempSync(join(tmpdir(), 'telar-xml-'));
  try {
    const casos = [
      ...Object.entries(EJEMPLOS).map(([k, e]) => [k, generar(e.proyecto)]),
      ...[11, 12, 13, 14].map((i) => [`azar${i}`, generar(proyectoAzar(i + 1000))]),
    ];
    for (const [nombre, part] of casos) {
      const xml = join(dir, `${nombre}.musicxml`);
      const ly = join(dir, `${nombre}-xml.ly`);
      writeFileSync(xml, exportarMusicXML(part));
      const c = spawnSync(PY, [M2L, '-o', ly, xml], { encoding: 'utf8', timeout: 120000 });
      assert.equal(c.status, 0, `${nombre}: ${c.stderr}`);
      // musicxml2ly deja el MIDI comentado; su opción --midi añade un \score que encadena las partes.
      writeFileSync(ly, readFileSync(ly, 'utf8').replace(/% (\\midi \{[^\n]*\})/, '$1'));
      const r = spawnSync(LY, ['-dno-print-pages', '-dmidi-extension=midi', '-o', join(dir, `${nombre}-xml`), ly], { encoding: 'utf8', timeout: 180000 });
      assert.equal(r.status, 0, `${nombre}: ${r.stderr}`);
      assert.deepEqual(r.stderr.split('\n').filter((l) => /barcheck|comprobaci[oó]n de comp|error/i.test(l)), [], nombre);
      const midi = leerMIDI(readFileSync(join(dir, `${nombre}-xml.midi`)));
      const pistas = midi.pistas.filter((p) => p.eventos.some((e) => e.tipo === 0x90));
      const voces = part.voces.filter((v) => notasSonoras(v).length);
      assert.equal(pistas.length, voces.length, nombre);
      voces.forEach((v, i) => {
        const esperados = [...new Set(notasSonoras(v).map((n) => n.inicio.por(fr(4 * midi.ppq)).aNumero()))].sort((a, b) => a - b);
        const reales = [...new Set(pistas[i].eventos.filter((e) => e.tipo === 0x90 && e.b > 0).map((e) => e.tick))].sort((a, b) => a - b);
        assert.equal(reales.length, esperados.length, `${nombre}, ${v.nombre}: ataques`);
        reales.forEach((t, k) => assert.ok(Math.abs(t - esperados[k]) <= 2, `${nombre}, ${v.nombre}: ataque ${k}: ${t} ≠ ${esperados[k]}`));
      });
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
