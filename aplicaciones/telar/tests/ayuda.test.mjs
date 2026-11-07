// La ayuda no debe quedarse atrás: sus ejemplos se ejecutan y sus afirmaciones se contrastan.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { partituraDeEjemplo, alturasDeEjemplo } from '../interfaz/ayuda.mjs';
import { grabar } from '../interfaz/grabado.mjs';
import { leerCompas, leerPatron } from '../nucleo/ritmo.mjs';
import { leerAltura, leerSerie, leerCriba, leerParciales } from '../nucleo/armonia.mjs';
import { filasRitmicas, formasSerie } from '../nucleo/material.mjs';
import { CERO, fr } from '../nucleo/fraccion.mjs';

const leer = (n) => readFileSync(new URL(`../${n}`, import.meta.url), 'utf8');
const html = leer('ayuda.html');
const desescapar = (t) => t.replace(/&amp;/g, '&').replace(/&gt;/g, '>').replace(/&lt;/g, '<');

test('los ejemplos de ritmo de la ayuda se generan y suman su compás', () => {
  const ejemplos = [...html.matchAll(/data-patron="([^"]+)" data-compas="([^"]+)"/g)];
  assert.ok(ejemplos.length >= 3);
  for (const [, patron, compas] of ejemplos) {
    const part = partituraDeEjemplo(patron, compas);
    const c = leerCompas(compas);
    const suma = part.voces[0].medidas[0].figuras.reduce((a, f) => a.mas(f.real), CERO);
    assert.ok(suma.igual(fr(c.num, c.den)), patron);
    assert.ok(!/NaN|undefined/.test(grabar(part, { ancho: 560, s: 7 }).svg), patron);
    assert.ok(html.includes(`<code>${patron}</code>`), `el texto explica ${patron}`);
  }
});

test('los ejemplos de campos se calculan, y dan lo que la ayuda da a entender', () => {
  const campos = [...html.matchAll(/data-campo='([^']+)'/g)].map((m) => JSON.parse(desescapar(m[1])));
  assert.ok(campos.length >= 4);
  for (const c of campos) assert.ok(alturasDeEjemplo(c).length > 0, c.tipo);
  assert.equal(alturasDeEjemplo(campos[0]), 'Do4 Re4 Mi4 Fa#4 Sol4 Si4');
  const anillo = alturasDeEjemplo(campos[1]).split(' ');
  assert.equal(anillo.length, 2, 'suma y diferencia');
  assert.equal(alturasDeEjemplo(campos[4]).split(' ')[0], 'La2');
});

test('la sintaxis citada en la ayuda es válida', () => {
  for (const c of ['4/4', '3/8', '3/10', '6/8', '7/16', '3+3/8', '2+3/16']) assert.ok(html.includes(`<code>${c}`) || html.includes(c), c);
  assert.deepEqual(leerCompas('6/8').grupos.length, 6);
  assert.deepEqual(leerCompas('7/16').grupos, [2, 2, 3]);
  assert.equal(leerCompas('3+3/8').grupos.length, 2);
  assert.equal(leerCompas('2+3/16').grupos.length, 2);
  for (const p of ['3 1', '2(1 1 1)', '-1', '+1']) assert.ok(leerPatron(p).length >= 1, p);
  for (const a of ['Do4', 'Sib3', 'Re4+', 'La-3']) assert.ok(Number.isInteger(leerAltura(a)), a);
  assert.deepEqual(leerSerie('0 11 3', 12), leerSerie('Do Si Mib', 12));
  assert.equal(leerSerie('2 0', 24)[0], 2);
  assert.ok(leerCriba('(3@0 | 4@1) & !2@0').pertenece(1));
  assert.deepEqual(leerParciales('1-8 11 13').length, 10);
});

test('el ejemplo de matriz rítmica de la ayuda es el que produce Telar', () => {
  const [primera] = filasRitmicas({ proporciones: '3 1 2', profundidad: 2 });
  assert.equal(primera, '3(1 2 3) 1(2 3 1) 2(3 1 2)');
  assert.ok(html.includes(`<code>${primera}</code>`));
});

test('O3 es la serie tres unidades más arriba, como explica la ayuda', () => {
  // Con esta serie, la matriz contiene la transposición 3.
  const o3 = formasSerie([0, 9, 5], 12).find((f) => f.nombre === 'O3');
  assert.deepEqual(o3.notas, [3, 0, 8]);
  assert.ok(html.includes('<code>O3</code>'));
});

test('los enlaces internos de la ayuda llevan a una sección', () => {
  const ids = new Set([...html.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]));
  const enlaces = [...html.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]);
  assert.ok(enlaces.length >= 8);
  for (const e of enlaces) assert.ok(ids.has(e), e);
});

test('la app enlaza con la ayuda, y sus secciones existen', () => {
  const ids = new Set([...html.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]));
  assert.match(leer('index.html'), /href="\.\/ayuda\.html"/);
  const ui = leer('interfaz/ui.mjs');
  const secciones = /const SECCION_AYUDA = \{([^}]+)\}/.exec(ui)[1];
  const nombres = [...secciones.matchAll(/'([a-z]+)'/g)].map((m) => m[1]).filter((n) => n !== 'I');
  assert.ok(nombres.length >= 4);
  for (const n of nombres) assert.ok(ids.has(n), n);
  assert.match(leer('README.md'), /ayuda\.html/);
});
