// La partitura en SVG, sin navegador: estructura, números válidos y mapa de tiempo.

import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { generar } from '../nucleo/motor.mjs';
import { EJEMPLOS } from '../nucleo/ejemplos.mjs';
import { grabar, grabarCampo } from '../interfaz/grabado.mjs';
import { dibujarTejido, dibujarTira } from '../interfaz/tejido.mjs';
import { evaluarCampo } from '../nucleo/armonia.mjs';
import { leerPatron } from '../nucleo/ritmo.mjs';
import { proyectoAzar } from './ayuda.mjs';

const CASOS = [
  ...Object.values(EJEMPLOS).map((e) => e.proyecto),
  ...Array.from({ length: 60 }, (_, i) => proyectoAzar(i + 5000)),
];

test('el grabado no produce números inválidos', () => {
  for (const proyecto of CASOS) {
    const part = generar(proyecto);
    for (const s of [5, 7, 11]) {
      const g = grabar(part, { ancho: 900, s });
      assert.ok(!/NaN|Infinity|undefined/.test(g.svg), `${proyecto.titulo}, s=${s}`);
      assert.ok(g.alto > 0 && g.sistemas >= 1);
    }
    assert.ok(!/NaN|undefined/.test(dibujarTejido(part, proyecto)), proyecto.titulo);
  }
});

test('todo compás y toda tupla aparecen en el SVG', () => {
  for (const proyecto of CASOS.slice(0, 20)) {
    const part = generar(proyecto);
    const { svg } = grabar(part, { ancho: 900, s: 7 });
    const rotulos = (svg.match(/class="tn"/g) || []).length;
    const tuplas = part.voces.flatMap((v) => v.medidas.flatMap((m) => m.figuras.flatMap((f) => f.abreTuplas))).length;
    assert.equal(rotulos, tuplas, proyecto.titulo);
    const finales = (svg.match(/stroke-width="[\d.]+"\/>/g) || []).length;
    assert.ok(finales > part.compases.length);
  }
});

test('el mapa de tiempo es monótono y cubre toda la pieza', () => {
  for (const proyecto of CASOS) {
    const part = generar(proyecto);
    const { mapa } = grabar(part, { ancho: 900, s: 7 });
    let t = -1;
    for (const sistema of mapa) {
      let xPrevio = -Infinity;
      for (const p of sistema.puntos) {
        assert.ok(p.t >= t - 1e-9, proyecto.titulo);
        assert.ok(p.x >= xPrevio, `${proyecto.titulo}: x retrocede`);
        t = p.t;
        xPrevio = p.x;
      }
    }
    assert.ok(Math.abs(t - part.duracion.aNumero()) < 1e-9, proyecto.titulo);
  }
});

test('dos figuras seguidas de una voz nunca se pisan', () => {
  for (const proyecto of CASOS.slice(0, 30)) {
    const part = generar(proyecto);
    const { mapa } = grabar(part, { ancho: 900, s: 7 });
    const xDe = new Map(mapa.flatMap((m) => m.puntos.map((p) => [p.t.toFixed(9), p.x])));
    for (const v of part.voces) {
      for (const m of v.medidas) {
        for (let i = 1; i < m.figuras.length; i++) {
          const a = xDe.get(m.figuras[i - 1].inicio.aNumero().toFixed(9));
          const b = xDe.get(m.figuras[i].inicio.aNumero().toFixed(9));
          assert.ok(b - a >= 7 * 1.2, `${proyecto.titulo}: separación ${b - a}`);
        }
      }
    }
  }
});

test('las vistas previas de campos y ritmos se dibujan', () => {
  const campo = grabarCampo(evaluarCampo({ tipo: 'espectro', fundamental: 'Do2', parciales: '1-16', estiramiento: 1 }));
  assert.match(campo, /<svg/);
  assert.ok(!/NaN/.test(campo));
  assert.match(dibujarTira(leerPatron('1 2(1 -1 3(1 1)) +1')), /tr-silencio/);
});

test('la fuente de la notación existe donde la hoja de estilo la busca', () => {
  const css = readFileSync(new URL('../estilos.css', import.meta.url), 'utf8');
  const ruta = /url\("([^"]+Leland[^"]+)"\)/.exec(css)[1];
  assert.ok(existsSync(new URL(`../${ruta}`, import.meta.url)), ruta);
  assert.ok(!/alevi/i.test(css), 'Telar no usa la fuente piloto Alevi Microtonal');
});
