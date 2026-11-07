import test from 'node:test';
import assert from 'node:assert/strict';
import { leerPatron, leerPatrones, leerCompas, dividir, ErrorTelar } from '../nucleo/ritmo.mjs';
import {
  leerAltura, deletrear, nombreAltura, leerCriba, multiplicarIntervalos, multiplicarAnillo,
  campoEspectro, campoCriba, frecuencia, registrar, interpolarCampos, leerParciales,
} from '../nucleo/armonia.mjs';
import { fr } from '../nucleo/fraccion.mjs';
import { generar, leerHilo, valorDeHilo, periodosDe, validar, curvaProceso } from '../nucleo/motor.mjs';
import { EJEMPLOS, copiarProyecto } from '../nucleo/ejemplos.mjs';

test('patrones: pesos, grupos, silencios y ligas', () => {
  assert.deepEqual(leerPatron('1 2(1 1 1) -1 +1'), [
    { peso: 1, tipo: 'nota' },
    { peso: 2, hijos: [{ peso: 1, tipo: 'nota' }, { peso: 1, tipo: 'nota' }, { peso: 1, tipo: 'nota' }] },
    { peso: 1, tipo: 'silencio' },
    { peso: 1, tipo: 'liga' },
  ]);
  assert.equal(leerPatrones('1 1\n\n 2 3 ').length, 2);
  assert.deepEqual(leerPatron('2(3)'), [{ peso: 2, tipo: 'nota' }], 'un grupo de un hijo no divide');
});

test('patrones: los errores se explican', () => {
  for (const malo of ['', '1 (', '1 )', 'a', '0', '-2(1 1)', '2()']) {
    assert.throws(() => leerPatron(malo), ErrorTelar, malo);
  }
});

test('compases: agrupación e irracionalidad', () => {
  assert.deepEqual(leerCompas('2+3/16').grupos, [2, 3]);
  assert.deepEqual(leerCompas('7/16').grupos, [2, 2, 3]);
  assert.deepEqual(leerCompas('3/8').grupos, [1, 1, 1]);
  assert.equal(leerCompas('3/10').irracional, true);
  assert.equal(leerCompas('3/8').irracional, false);
  assert.throws(() => leerCompas('3-8'), ErrorTelar);
  assert.throws(() => leerCompas('3/0'), ErrorTelar);
});

test('división: tuplas habituales y no habituales', () => {
  const t = (W, S) => {
    const d = dividir(W, S);
    return d.tupla ? `${d.tupla.actual}:${d.tupla.normal}/${d.unidad}` : `${d.unidad}`;
  };
  assert.equal(t(fr(1, 4), 4), '1/16');
  assert.equal(t(fr(1, 4), 3), '3:2/1/8');
  assert.equal(t(fr(1, 4), 5), '5:4/1/16');
  assert.equal(t(fr(1, 4), 7), '7:4/1/16');
  assert.equal(t(fr(3, 8), 5), '5:3/1/8');
  assert.equal(t(fr(3, 8), 4), '4:3/1/8');
  assert.equal(t(fr(3, 8), 2), '2:3/1/8');
  assert.equal(t(fr(7, 8), 5), '5:7/1/8');
  assert.equal(t(fr(1, 2), 6), '6:4/1/8');
});

test('alturas: lectura y grafía', () => {
  assert.equal(leerAltura('Do4'), 120);
  assert.equal(leerAltura('La4'), 138);
  assert.equal(leerAltura('c4'), 120);
  assert.equal(leerAltura('Sib3'), leerAltura('A#3'));
  assert.equal(leerAltura('Re4+'), 125);
  assert.equal(leerAltura('Re-4'), 123);
  assert.equal(leerAltura('Sol#3+'), leerAltura('Sol#3') + 1);
  assert.throws(() => leerAltura('H9x'), ErrorTelar);
  assert.equal(deletrear(121).ly, 'cih');
  assert.equal(deletrear(123).ly, 'cisih');
  assert.equal(deletrear(127).ly, 'eeh');
  assert.equal(nombreAltura(138), 'La4');
  assert.ok(Math.abs(frecuencia(138) - 440) < 1e-9);
});

test('la grafía de las 24 clases reproduce la altura exacta', () => {
  const sem = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  for (let q = 40; q < 200; q++) {
    const d = deletrear(q);
    const midi = (d.octava + 1) * 12 + sem[d.paso] + d.alter;
    assert.equal(midi * 2, q, `q=${q}`);
    assert.equal(leerAltura(d.nombre), q, `${d.nombre}`);
  }
});

test('criba: unión, intersección, complemento y periodo', () => {
  const c = leerCriba('(3@0 | 4@1) & !2@0');
  const vals = [];
  for (let i = 0; i < 13; i++) if (c.pertenece(i)) vals.push(i);
  assert.deepEqual(vals, [1, 3, 5, 9]);
  assert.equal(c.periodo, 12);
  assert.throws(() => leerCriba('3@'), ErrorTelar);
  assert.throws(() => leerCriba('(3@0'), ErrorTelar);
  assert.throws(() => leerCriba('3@0 ^ 2@0'), ErrorTelar);
  const notas = campoCriba({ expresion: '2@0', desde: 'Do4', hasta: 'Do5', unidad: 'semitono' });
  assert.deepEqual(notas.map((n) => n.q), [120, 124, 128, 132, 136, 140, 144]);
  const cuartos = campoCriba({ expresion: '3@1', desde: 'Do4', hasta: 'Re4', unidad: 'cuarto' });
  assert.deepEqual(cuartos.map((n) => n.q), [121, 124]);
});

test('multiplicación de acordes', () => {
  // Do-Mi × Do-Re: el acorde A transportado por los intervalos de B.
  assert.deepEqual(multiplicarIntervalos([120, 128], [120, 124]).map((n) => n.q), [120, 124, 128, 132]);
  const anillo = multiplicarAnillo([138], [114]); // 440 y 220 Hz
  // suma 660 Hz y diferencia 220 Hz
  assert.ok(anillo.some((n) => n.q === 114));
  assert.ok(anillo.some((n) => Math.abs(frecuencia(n.q) - 660) < 12));
});

test('espectro: armónicos naturales en cuartos de tono, con su desviación', () => {
  const e = campoEspectro({ fundamental: 'La2', parciales: '1-8', estiramiento: 1 });
  const nombres = e.map((n) => nombreAltura(n.q));
  assert.deepEqual(nombres.slice(0, 4), ['La2', 'La3', 'Mi4', 'La4']);
  const septimo = e.find((n) => n.parcial === 7);
  assert.equal(nombreAltura(septimo.q), 'Fa#+5'); // armónico 7: 31 c bajo Sol, casi medio bemol
  for (const n of e) assert.ok(Math.abs(n.cents) <= 25.001, `el redondeo no supera 25 c: ${n.cents}`);
  assert.deepEqual(leerParciales('1-3 7'), [1, 2, 3, 7]);
  assert.throws(() => campoEspectro({ fundamental: 'La2', parciales: '1', estiramiento: 9 }), ErrorTelar);
});

test('registro e interpolación de campos', () => {
  assert.deepEqual(registrar([100, 110, 120, 130], 105, 125), [110, 120, 130 - 24, 100 + 24].sort((a, b) => a - b));
  const a = [{ q: 100 }, { q: 110 }];
  const b = [{ q: 120 }, { q: 130 }];
  assert.deepEqual(interpolarCampos(a, b, 0.5).map((n) => n.q), [110, 120]);
  assert.equal(interpolarCampos(a, b, 0), a);
  assert.equal(interpolarCampos(a, b, 1), b);
});

test('hilos: periodos independientes', () => {
  const h = leerHilo('altura', { valores: '0 1 2', paso: 2, fase: 1, modo: 'ataque' });
  assert.deepEqual([0, 1, 2, 3, 4, 5].map((i) => valorDeHilo(h, i, 0)), [1, 1, 2, 2, 0, 0]);
  const t = leerHilo('altura', { valores: '5 6', paso: 1.5, fase: 0, modo: 'tiempo' });
  assert.deepEqual([0, 1, 1.5, 3].map((n) => valorDeHilo(t, 0, n)), [5, 5, 6, 5]);
  assert.throws(() => leerHilo('dinamica', { valores: 'fuerte' }), ErrorTelar);
  assert.throws(() => leerHilo('articulacion', { valores: 'toString' }), ErrorTelar);
  const voz = EJEMPLOS.trio.proyecto.voces[0];
  const p = periodosDe(voz);
  assert.equal(p.altura, 7);
  assert.equal(p.dinamica, 15);
  assert.equal(p.comun, 105);
});

test('los hilos corren con periodos propios en la partitura', () => {
  const pr = copiarProyecto(EJEMPLOS.trio.proyecto);
  pr.procesos = [];
  pr.voces = [pr.voces[1]];
  pr.voces[0].ritmo.patrones = '1 1 1';
  pr.voces[0].hilos.dinamica = { valores: 'pp f mp', paso: 1, fase: 0, modo: 'ataque' };
  pr.voces[0].hilos.articulacion.valores = '- . _ > ^';
  const seg = generar(pr).voces[0].seguimiento;
  seg.forEach((s, i) => {
    assert.equal(s.dinamica, [1, 5, 3][i % 3]);
    assert.equal(s.articulacion, [null, 'staccato', 'tenuto', 'acento', 'marcato'][i % 5]);
  });
});

test('procesos: la rarefacción es monótona y no desplaza los hilos', () => {
  const base = copiarProyecto(EJEMPLOS.trio.proyecto);
  base.procesos = [];
  const con = (p) => {
    const x = copiarProyecto(base);
    x.procesos = [{ tipo: 'rarefaccion', voces: 'todas', inicio: 0, fin: 1, forma: 'lineal', desde: p, hasta: p }];
    return generar(x);
  };
  const sinFiltro = generar(base).voces[0].eventos;
  const poco = con(0.2).voces[0].eventos;
  const mucho = con(0.7).voces[0].eventos;
  const callados = (ev) => ev.filter((e) => e.silencio).length;
  assert.ok(callados(mucho) > callados(poco));
  // Todo lo que calla 0.2 también calla 0.7; lo que suena conserva su altura.
  poco.forEach((e, i) => { if (e.silencio) assert.ok(mucho[i].silencio); });
  mucho.forEach((e, i) => { if (!e.silencio) assert.deepEqual(e.alturas, sinFiltro[i].alturas); });
});

test('procesos: banda, transposición y curvas', () => {
  const p = copiarProyecto(EJEMPLOS.trio.proyecto);
  p.voces = [p.voces[0]];
  p.procesos = [{ tipo: 'banda', voces: 'todas', inicio: 0, fin: 1, forma: 'lineal', graveDesde: 'La4', graveHasta: 'La4', agudoDesde: 'Mi5', agudoHasta: 'Mi5', modo: 'silenciar' }];
  for (const e of generar(p).voces[0].eventos) {
    for (const q of e.alturas) assert.ok(q >= leerAltura('La4') && q <= leerAltura('Mi5'));
  }
  assert.equal(curvaProceso({ inicio: 0.5, fin: 1 }, 0.25), null);
  assert.equal(curvaProceso({ inicio: 0, fin: 1 }, 0.5), 0.5);
  assert.ok(Math.abs(curvaProceso({ inicio: 0, fin: 1, forma: 'campana' }, 0.5) - 1) < 1e-9);
});

test('la subdivisión añade tuplas y respeta los compases', () => {
  const p = copiarProyecto(EJEMPLOS.fagot.proyecto);
  p.procesos = [{ tipo: 'subdivision', voces: 'todas', inicio: 0, fin: 1, forma: 'lineal', desde: 1, hasta: 1, opciones: '7 11' }];
  const part = generar(p);
  const maxT = Math.max(...part.voces[0].medidas.flatMap((m) => m.figuras.map((f) => f.tuplas.length)));
  assert.ok(maxT >= 3);
});

test('validar señala la ruta del error', () => {
  const p = copiarProyecto(EJEMPLOS.trio.proyecto);
  p.voces[1].ritmo.patrones = '1 (';
  p.tiempo.compases = '4/4 mal';
  const rutas = validar(p).map((e) => e.ruta);
  assert.ok(rutas.includes('voces.1.ritmo.patrones'));
  assert.ok(rutas.includes('tiempo.compases'));
});
