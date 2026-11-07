// Los dos modos definen las mismas variables y conservan la legibilidad.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../estilos.css', import.meta.url), 'utf8');

const bloque = (selector) => {
  const i = css.indexOf(`${selector} {`);
  assert.ok(i >= 0, selector);
  const cuerpo = css.slice(css.indexOf('{', i) + 1, css.indexOf('}', i));
  return Object.fromEntries([...cuerpo.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
};

const claro = bloque(':root');
const oscuro = bloque(':root[data-theme="dark"]');

const luminancia = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contraste = (a, b) => {
  const [x, y] = [luminancia(a), luminancia(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

test('el modo oscuro redefine todos los colores del claro', () => {
  const colores = Object.entries(claro).filter(([, v]) => v.startsWith('#')).map(([k]) => k);
  assert.ok(colores.length > 10);
  for (const k of colores) assert.ok(k in oscuro, `falta ${k}`);
});

test('los colores fuera de las variables no fijan el tema', () => {
  const fuera = css.split('\n').filter((l) => !/^\s*--/.test(l) && !/:root/.test(l) && /#[0-9a-f]{3,8}\b/i.test(l));
  // La marca del tejido es la única excepción: va sobre celdas de color en ambos modos.
  assert.deepEqual(fuera.filter((l) => !l.includes('.tj-marca')), []);
});

for (const [nombre, t] of [['claro', claro], ['oscuro', oscuro]]) {
  test(`modo ${nombre}: contraste suficiente`, () => {
    const pares = [
      ['--tinta', '--papel', 4.5],
      ['--tinta', '--panel', 4.5],
      ['--tinta', '--control', 4.5],
      ['--tenue', '--papel', 4.5],
      ['--tenue', '--panel', 4.5],
      ['--tenue', '--tarjeta', 4.5],
      ['--nota', '--hoja', 7],
      ['--rotulo', '--hoja', 4.5],
      ['--pauta', '--hoja', 3],
      ['--error', '--error-fondo', 4.5],
      ['--sobre-hilo', '--hilo', 4.5],
    ];
    for (const [a, b, min] of pares) {
      const c = contraste(t[a], t[b]);
      assert.ok(c >= min, `${a} sobre ${b}: ${c.toFixed(2)} < ${min}`);
    }
  });
}
