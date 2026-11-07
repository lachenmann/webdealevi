// Series, matrices rítmicas, tablas y paso del material a la partitura.

import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  materialInicial, asegurarMaterial, matrizSerie, esAgregado, intervalosDe, rotaciones, rotacionesTranspuestas,
  multiplicar, leerMultiplicadores, formasSerie, serieAzar, serieTodosIntervalos, leerProporciones, filasRitmicas,
  validarMaterial, partituraSerie, partituraRitmo, tablasSerie, tablasRitmo, tablasCampos, tablasHilos,
  aCSV, aTexto, aJSON, indicesSerie, llevarSerie, llevarRitmo,
} from '../nucleo/material.mjs';
import { leerSerie, nombreClase, evaluarCampo, INSTRUMENTOS } from '../nucleo/armonia.mjs';
import { ErrorTelar, leerPatron, leerPatrones } from '../nucleo/ritmo.mjs';
import { generar, notasSonoras, validar } from '../nucleo/motor.mjs';
import { EJEMPLOS, copiarProyecto } from '../nucleo/ejemplos.mjs';
import { fr, CERO } from '../nucleo/fraccion.mjs';
import { grabar } from '../interfaz/grabado.mjs';
import { exportarLilyPond } from '../nucleo/export-lilypond.mjs';
import { exportarMusicXML } from '../nucleo/export-musicxml.mjs';
import { exportarMIDI } from '../nucleo/export-midi.mjs';
import { leerMIDI, leerXML, notasDePista } from './ayuda.mjs';

const WEBERN = [0, 11, 3, 4, 8, 7, 9, 5, 6, 1, 2, 10];
const mod = (x, m) => ((x % m) + m) % m;

test('lectura de series: números, nombres y errores', () => {
  assert.deepEqual(leerSerie('0 11 3', 12), [0, 11, 3]);
  assert.deepEqual(leerSerie('Do Si Mib', 12), [0, 11, 3]);
  assert.deepEqual(leerSerie('Do+ Re Sol#', 24), [1, 4, 16]);
  assert.deepEqual(leerSerie('Do Do#-', 24), [0, 1]);
  for (const [t, m] of [['0 0', 12], ['0 12', 12], ['Do+ Re', 12], ['5', 12], ['x y', 12], ['0 1', 7]]) {
    assert.throws(() => leerSerie(t, m), ErrorTelar, `${t} / ${m}`);
  }
  assert.equal(nombreClase(1, 12), 'Do#');
  assert.equal(nombreClase(1, 24), 'Do+');
});

for (const [nombre, s, m] of [['12 notas', WEBERN, 12], ['24 notas', serieAzar(24, 5, 0), 24], ['parcial', [0, 3, 7, 10], 12]]) {
  test(`matriz (${nombre}): filas, columnas y diagonal`, () => {
    const x = matrizSerie(s, m);
    assert.deepEqual(x[0], s, 'la primera fila es la serie');
    const inv = intervalosDe(s, m).map((i) => mod(-i, m));
    x.forEach((f) => {
      assert.deepEqual(intervalosDe(f, m), intervalosDe(s, m), 'cada fila es una transposición');
      assert.equal(new Set(f).size, s.length);
    });
    s.forEach((_, j) => {
      const c = x.map((f) => f[j]);
      assert.deepEqual(intervalosDe(c, m), inv, 'cada columna es la inversión transpuesta');
      assert.equal(new Set(c).size, s.length);
    });
    x.forEach((f, i) => assert.equal(f[i], s[0], 'la diagonal repite la primera nota'));
  });
}

test('las 48 formas: retrógrados y etiquetas', () => {
  const f = formasSerie(WEBERN, 12);
  assert.equal(f.length, 48);
  const por = Object.fromEntries(f.map((x) => [x.nombre, x.notas]));
  assert.deepEqual(por.O0, WEBERN);
  assert.deepEqual(por.R0, [...WEBERN].reverse());
  assert.deepEqual(por.O3, WEBERN.map((x) => mod(x + 3, 12)));
  assert.deepEqual(por.I0, WEBERN.map((x) => mod(-x, 12)));
  assert.deepEqual(por.RI0, WEBERN.map((x) => mod(-x, 12)).reverse());
  for (const n of ['O', 'I', 'R', 'RI']) for (let t = 0; t < 12; t++) assert.ok(por[`${n}${t}`], `${n}${t}`);
});

test('rotaciones y multiplicaciones', () => {
  const r = rotaciones([0, 4, 7]);
  assert.deepEqual(r, [[0, 4, 7], [4, 7, 0], [7, 0, 4]]);
  assert.deepEqual(rotacionesTranspuestas([0, 4, 7], 12), [[0, 4, 7], [0, 3, 8], [0, 5, 9]]);
  const m5 = multiplicar(WEBERN, 5, 12);
  assert.ok(esAgregado(m5, 12), 'M5 conserva el agregado');
  assert.equal(m5[1], mod(5 * 11, 12));
  assert.throws(() => leerMultiplicadores('4', 12), ErrorTelar);
  assert.deepEqual(leerMultiplicadores('5 7', 12), [5, 7]);
  assert.ok(esAgregado(multiplicar(serieAzar(24, 1, 0), 5, 24), 24));
});

test('series generadas: agregado, determinismo y todos los intervalos', () => {
  assert.ok(esAgregado(serieAzar(12, 7, 0), 12));
  assert.deepEqual(serieAzar(12, 7, 3), serieAzar(12, 7, 3));
  assert.notDeepEqual(serieAzar(12, 7, 0), serieAzar(12, 7, 1));
  for (const m of [12, 24]) {
    for (let giro = 0; giro < 4; giro++) {
      const s = serieTodosIntervalos(m, 7, giro);
      assert.ok(s, `módulo ${m}`);
      assert.ok(esAgregado(s, m));
      assert.equal(new Set(intervalosDe(s, m)).size, m - 1, 'cada intervalo una vez');
    }
  }
});

test('matrices rítmicas: filas que rotan y anidan', () => {
  assert.deepEqual(filasRitmicas({ proporciones: '3 1 2', profundidad: 1 }), ['3 1 2', '1 2 3', '2 3 1']);
  const dos = filasRitmicas({ proporciones: '3 1 2', profundidad: 2 });
  assert.equal(dos[0], '3(1 2 3) 1(2 3 1) 2(3 1 2)');
  for (const f of dos) {
    const a = leerPatron(f);
    assert.equal(a.length, 3);
    assert.ok(a.every((n) => n.hijos?.length === 3));
  }
  const conSilencio = filasRitmicas({ proporciones: '2 -1', profundidad: 2 });
  assert.equal(leerPatrones(conSilencio.join('\n')).length, 2);
  assert.match(conSilencio[0], /^2\(/, 'un grupo no lleva signo');
  assert.match(conSilencio[0], /-1/);
  assert.throws(() => leerProporciones('3'), ErrorTelar);
  assert.throws(() => leerProporciones('0 1'), ErrorTelar);
});

test('la validación del material señala cada campo', () => {
  assert.deepEqual(validarMaterial(materialInicial()), []);
  const m = materialInicial();
  m.serie.notas = '0 0';
  m.serie.multiplicadores = '4';
  m.ritmo.proporciones = 'a';
  m.ritmo.compas = 'x';
  m.ritmo.profundidad = 9;
  const rutas = validarMaterial(m).map((e) => e.ruta);
  for (const r of ['material.serie.notas', 'material.serie.multiplicadores', 'material.ritmo.proporciones', 'material.ritmo.compas', 'material.ritmo.profundidad']) {
    assert.ok(rutas.includes(r), r);
  }
  const grande = materialInicial();
  grande.ritmo.proporciones = '1 2 3 4 5 6 7 8';
  grande.ritmo.profundidad = 4;
  assert.ok(validarMaterial(grande).some((e) => /máximo es 512/.test(e.mensaje)));
});

test('asegurarMaterial completa proyectos antiguos sin perder lo escrito', () => {
  const p = asegurarMaterial({ material: { serie: { notas: '0 1' } } });
  assert.equal(p.material.serie.notas, '0 1');
  assert.equal(p.material.serie.modulo, 12);
  assert.equal(p.material.ritmo.profundidad, 2);
  assert.ok(asegurarMaterial({}).material.ritmo);
});

test('la partitura de una serie escribe sus notas en orden', () => {
  for (const [s, m] of [[WEBERN, 12], [serieAzar(24, 2, 0), 24]]) {
    const mat = materialInicial();
    mat.serie.notas = s.join(' ');
    mat.serie.modulo = m;
    const part = partituraSerie(mat);
    assert.equal(part.compases.length, s.length);
    assert.equal(part.etiquetas.length, s.length);
    assert.equal(part.etiquetas[0], 'O0');
    const figs = part.voces[0].medidas[0].figuras;
    assert.deepEqual(figs.map((f) => mod(f.alturas[0], 24)), s.map((x) => (m === 24 ? x : x * 2)));
    assert.ok(figs.every((f) => !f.dinamica && !f.articulacion), 'material sin matices');
    mat.serie.pentagrama = 'todas';
    const todas = partituraSerie(mat);
    assert.equal(todas.compases.length, s.length * 4);
    const o3 = part.etiquetas.indexOf('O3');
    if (o3 >= 0) {
      assert.deepEqual(part.voces[0].medidas[o3].figuras.map((f) => mod(f.alturas[0], 24)), s.map((x) => mod((m === 24 ? x : x * 2) + (m === 24 ? 3 : 6), 24)));
    }
  }
});

test('la partitura de una matriz rítmica cumple las invariantes de compás', () => {
  for (const compas of ['4/4', '3/10', '5/12', '2+3/16']) {
    for (const profundidad of [1, 2, 3]) {
      const mat = materialInicial();
      mat.ritmo = { proporciones: '3 1 2', profundidad, compas };
      const part = partituraRitmo(mat);
      assert.equal(part.compases.length, 3);
      for (const m of part.voces[0].medidas) {
        const suma = m.figuras.reduce((a, f) => a.mas(f.real), CERO);
        assert.ok(suma.igual(fr(m.compas.num, m.compas.den)), `${compas}, profundidad ${profundidad}`);
      }
      assert.ok(!/NaN|undefined/.test(grabar(part, { ancho: 900, s: 7, sinCifras: false }).svg));
    }
  }
});

test('las duraciones de la tabla rítmica suman el compás', () => {
  const mat = materialInicial();
  mat.ritmo = { proporciones: '3 -1 2', profundidad: 2, compas: '3/10' };
  const part = partituraRitmo(mat);
  const [prop, pat, dur] = tablasRitmo(mat.ritmo, part);
  assert.deepEqual(prop.filas[1].slice(1), ['-1', '2', '3']);
  assert.equal(pat.filas.length, 3);
  for (const fila of dur.filas) {
    const suma = fila[1].split(' ').map((x) => x.replace(/[()]/g, '')).map((x) => {
      const [n, d = 1] = x.split('/').map(Number);
      return fr(n, d);
    }).reduce((a, b) => a.mas(b), CERO);
    assert.ok(suma.igual(fr(3, 10)), `${suma}`);
  }
});

test('tablas de series: nombres, números y matriz', () => {
  const ms = materialInicial().serie;
  const t = tablasSerie(ms);
  assert.match(t[0].titulo, /agregado completo/);
  assert.equal(t[1].filas.length, 13);
  assert.equal(t[1].filas[0][0], 'O0');
  assert.equal(t[1].filas[0][13], 'R0');
  assert.equal(t[1].filas[0][1], 'Do');
  assert.equal(t[1].filas[12][1], 'RI0');
  assert.equal(t.length, 5);
  const num = tablasSerie({ ...ms, vista: 'numeros' });
  assert.equal(num[1].filas[0][2], '11');
  assert.equal(tablasSerie({ ...ms, multiplicadores: '' }).length, 4);
});

test('tablas de campos y de hilos reflejan el modelo', () => {
  const [c] = tablasCampos([{ tipo: 'espectro', fundamental: 'La2', parciales: '1-8', estiramiento: 1, compases: 1 }]);
  assert.equal(c.filas[0][0], 'La2');
  assert.equal(c.filas[0][3], '110.00');
  assert.ok(c.filas.some((f) => f[5] === '7' && f[4].startsWith('+')));
  const part = generar(EJEMPLOS.criba.proyecto);
  const tablas = tablasHilos(part);
  assert.equal(tablas.length, part.voces.length);
  tablas.forEach((t, i) => {
    const ataques = part.voces[i].eventos.filter((e) => e.ataque !== null).length;
    assert.equal(t.filas.length, ataques);
    assert.ok(t.filas.some((f) => f[8] === 'filtrado'), 'el ejemplo filtra ataques');
  });
});

test('salidas de texto: CSV, alineado y JSON', () => {
  const tablas = [{ titulo: 'A;B', columnas: ['x', 'y"z'], filas: [['1', 'línea\ndos'], ['-1 +1', '']] }];
  const csv = aCSV(tablas);
  assert.ok(csv.startsWith('"A;B"\r\nx;"y""z"\r\n1;"línea\ndos"\r\n-1 +1;'), csv);
  const txt = aTexto([{ titulo: 'T', columnas: ['a', 'bbb'], filas: [['1', '2'], ['333', '4']] }]);
  assert.equal(txt, 'T\n=\na    bbb\n1    2\n333  4');
  assert.deepEqual(JSON.parse(aJSON(tablas))[0].filas[1], ['-1 +1', '']);
});

test('una serie llevada a la partitura se oye en orden en cada voz', () => {
  for (const [s, m] of [[WEBERN, 12], [serieAzar(24, 9, 0), 24]]) {
    const p = asegurarMaterial(copiarProyecto(EJEMPLOS.trio.proyecto));
    p.procesos = [];
    p.material.serie.notas = s.join(' ');
    p.material.serie.modulo = m;
    llevarSerie(p);
    assert.deepEqual(validar(p), []);
    assert.equal(p.campos.length, 1);
    const part = generar(p);
    for (const v of part.voces) {
      const clases = notasSonoras(v).map((n) => n.alturas[0]).map((q) => (m === 24 ? mod(q, 24) : mod(q / 2, 12)));
      assert.ok(clases.length > s.length);
      clases.forEach((c, i) => assert.equal(c, s[i % s.length], `${v.nombre}, ataque ${i}`));
    }
  }
});

test('los índices de la serie caben en el ámbito de cada instrumento', () => {
  for (const inst of Object.values(INSTRUMENTOS)) {
    const ind = indicesSerie(WEBERN, 12, inst);
    assert.ok(ind.every((i) => i >= 0), inst.nombre);
  }
  const notas = evaluarCampo({ tipo: 'serie', notas: '0 6', modulo: 12 }).map((n) => n.q);
  assert.ok(notas.includes(120) && notas.includes(132));
});

test('una matriz rítmica llevada a una voz rellena un compás por fila', () => {
  const p = asegurarMaterial(copiarProyecto(EJEMPLOS.trio.proyecto));
  p.procesos = [];
  llevarRitmo(p, 1);
  assert.equal(p.voces[1].ritmo.unidad, 'compas');
  assert.deepEqual(validar(p), []);
  assert.equal(p.voces[1].ritmo.patrones.split('\n').length, 3);
  const part = generar(p);
  const suma = part.voces[1].medidas[0].figuras.reduce((a, f) => a.mas(f.real), CERO);
  assert.ok(suma.igual(fr(1)));
});

test('el material no altera la generación de la pieza', () => {
  const huella = (p) => generar(p).voces.map((v) => v.eventos.map((e) => `${e.inicio}|${e.alturas}`).join(','));
  const a = copiarProyecto(EJEMPLOS.trio.proyecto);
  const b = asegurarMaterial(copiarProyecto(EJEMPLOS.trio.proyecto));
  b.material.serie.notas = '0 1 2';
  assert.deepEqual(huella(a), huella(b));
});

test('el material se exporta a MusicXML y MIDI legibles', () => {
  const mat = materialInicial();
  mat.serie.pentagrama = 'todas';
  mat.ritmo = { proporciones: '3 -1 2', profundidad: 3, compas: '3/10' };
  for (const part of [partituraSerie(mat), partituraRitmo(mat)]) {
    assert.ok(hijosParte(leerXML(exportarMusicXML(part))));
    const midi = leerMIDI(exportarMIDI(part).bytes);
    assert.equal(notasDePista(midi.pistas[1]).length, notasSonoras(part.voces[0]).length);
  }
});

const hijosParte = (raiz) => raiz.hijos.some((h) => h.nombre === 'part');

const LY = process.env.LILYPOND || 'D:/lilypond-2.26.0/bin/lilypond.exe';

test('LilyPond real compila el material sin avisos y con sus ataques', { skip: !existsSync(LY) && `sin ${LY}`, timeout: 300000 }, () => {
  const dir = mkdtempSync(join(tmpdir(), 'telar-mat-'));
  try {
    const m24 = materialInicial();
    m24.serie.notas = serieTodosIntervalos(24, 3, 0).join(' ');
    m24.serie.modulo = 24;
    const irr = materialInicial();
    irr.ritmo = { proporciones: '3 -1 2', profundidad: 3, compas: '3/10' };
    const casos = [['serie12', partituraSerie(materialInicial())], ['serie24', partituraSerie(m24)], ['ritmo', partituraRitmo(materialInicial())], ['ritmoirr', partituraRitmo(irr)]];
    for (const [nombre, part] of casos) {
      const f = join(dir, `${nombre}.ly`);
      writeFileSync(f, exportarLilyPond(part));
      const r = spawnSync(LY, ['-dno-print-pages', '-dmidi-extension=midi', '-o', join(dir, nombre), f], { encoding: 'utf8', timeout: 120000 });
      assert.equal(r.status, 0, r.stderr);
      const avisos = r.stderr.split('\n').filter((l) => /barcheck|error|advertencia|warning/i.test(l) && !/comprim|compress/i.test(l));
      assert.deepEqual(avisos, [], nombre);
      const midi = leerMIDI(readFileSync(join(dir, `${nombre}.midi`)));
      const pista = midi.pistas.find((p) => p.eventos.some((e) => e.tipo === 0x90));
      const esperados = notasSonoras(part.voces[0]).map((n) => n.inicio.por(fr(4 * midi.ppq)).aNumero());
      const reales = pista.eventos.filter((e) => e.tipo === 0x90 && e.b > 0).map((e) => e.tick);
      assert.equal(reales.length, esperados.length, nombre);
      reales.forEach((t, k) => assert.ok(Math.abs(t - esperados[k]) <= 2, `${nombre}: ataque ${k}`));
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
