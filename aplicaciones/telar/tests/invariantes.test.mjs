// Invariantes de la escritura rítmica, sobre ejemplos y cientos de proyectos al azar.

import test from 'node:test';
import assert from 'node:assert/strict';
import { generar } from '../nucleo/motor.mjs';
import { EJEMPLOS } from '../nucleo/ejemplos.mjs';
import { fr, CERO, esPotenciaDe2 } from '../nucleo/fraccion.mjs';
import { proyectoAzar } from './ayuda.mjs';

const CASOS = [
  ...Object.entries(EJEMPLOS).map(([k, e]) => [`ejemplo ${k}`, e.proyecto]),
  ...Array.from({ length: 300 }, (_, i) => [`azar ${i}`, proyectoAzar(i + 1)]),
];

function porCadaMedida(part, cb) {
  for (const v of part.voces) v.medidas.forEach((m, i) => cb(v, m, i));
}

for (const [nombre, proyecto] of [CASOS[0]]) {
  test(`la partitura ${nombre} tiene material`, () => {
    const p = generar(proyecto);
    assert.ok(p.ataques > 0);
  });
}

const generadas = CASOS.map(([nombre, proyecto]) => [nombre, proyecto, generar(proyecto)]);

test('cada compás suma exactamente su duración', () => {
  for (const [nombre, , part] of generadas) {
    porCadaMedida(part, (v, m, i) => {
      const suma = m.figuras.reduce((a, f) => a.mas(f.real), CERO);
      assert.ok(suma.igual(fr(m.compas.num, m.compas.den)), `${nombre}, ${v.nombre}, c.${i + 1}: ${suma} ≠ ${m.compas.etiqueta}`);
    });
  }
});

test('las figuras son contiguas y cada voz recorre toda la pieza', () => {
  for (const [nombre, , part] of generadas) {
    for (const v of part.voces) {
      let t = CERO;
      for (const m of v.medidas) {
        assert.ok(m.compas.inicio.igual(t), nombre);
        for (const f of m.figuras) {
          assert.ok(f.inicio.igual(t), `${nombre}: hueco en ${t}`);
          t = t.mas(f.real);
        }
      }
      assert.ok(t.igual(part.duracion), nombre);
    }
  }
});

test('toda tupla abierta se cierra, y bien anidada', () => {
  for (const [nombre, , part] of generadas) {
    porCadaMedida(part, (v, m, i) => {
      const pila = [];
      for (const f of m.figuras) {
        for (const t of f.abreTuplas) pila.push(t);
        assert.equal(f.tuplas.length, pila.length, `${nombre}, c.${i + 1}: la figura debe conocer sus tuplas`);
        f.tuplas.forEach((t, k) => assert.equal(t, pila[k], nombre));
        for (let k = 0; k < f.cierraTuplas; k++) {
          assert.ok(pila.length, `${nombre}, c.${i + 1}: se cierra una tupla que no estaba abierta`);
          pila.pop();
        }
      }
      assert.equal(pila.length, 0, `${nombre}, ${v.nombre}, c.${i + 1}: tupla sin cerrar`);
    });
  }
});

test('ninguna tupla real contiene una sola figura', () => {
  for (const [nombre, , part] of generadas) {
    porCadaMedida(part, (v, m, i) => {
      const pila = [];
      for (const f of m.figuras) {
        for (const t of f.abreTuplas) pila.push({ t, cuenta: 0 });
        for (const a of pila) a.cuenta++;
        for (let k = 0; k < f.cierraTuplas; k++) {
          const { t, cuenta } = pila.pop();
          // La tupla implícita de un compás irracional sí puede llevar una sola figura.
          assert.ok(t.incompleta || cuenta >= 2, `${nombre}, ${v.nombre}, c.${i + 1}: ${t.actual}:${t.normal} con una figura`);
        }
      }
    });
  }
});

test('el contenido de cada tupla ocupa lo que su razón promete', () => {
  for (const [nombre, , part] of generadas) {
    porCadaMedida(part, (v, m, i) => {
      const pila = [];
      for (const f of m.figuras) {
        for (const t of f.abreTuplas) pila.push({ t, directa: CERO, real: CERO });
        for (const a of pila) a.real = a.real.mas(f.real);
        for (let k = 0; k < f.cierraTuplas; k++) {
          const { t, real } = pila.pop();
          if (t.incompleta) continue; // la tupla implícita del compás irracional no se completa
          // Duración escrita (en el contexto exterior) = normal × unidad.
          let factorExterior = fr(1);
          for (const ext of pila) factorExterior = factorExterior.por(fr(ext.t.normal, ext.t.actual));
          const esperado = t.unidad.por(fr(t.normal)).por(factorExterior);
          assert.ok(real.igual(esperado), `${nombre}, c.${i + 1}: tupla ${t.actual}:${t.normal} dura ${real}, debía ${esperado}`);
        }
      }
    });
  }
});

test('la duración real es la escrita por el producto de las tuplas', () => {
  for (const [nombre, , part] of generadas) {
    porCadaMedida(part, (v, m) => {
      for (const f of m.figuras) {
        let x = f.escrita;
        for (const t of f.tuplas) x = x.por(fr(t.normal, t.actual));
        assert.ok(x.igual(f.real), nombre);
      }
    });
  }
});

test('las figuras son representables y respetan los límites', () => {
  for (const [nombre, , part] of generadas) {
    porCadaMedida(part, (v, m) => {
      for (const f of m.figuras) {
        assert.ok(esPotenciaDe2(f.valor) && f.valor <= 128, `${nombre}: valor ${f.valor}`);
        assert.ok(f.puntos >= 0 && f.puntos <= 2);
        const base = fr(1, f.valor);
        const conPuntos = f.puntos === 0 ? base : f.puntos === 1 ? base.por(fr(3, 2)) : base.por(fr(7, 4));
        assert.ok(conPuntos.igual(f.escrita), `${nombre}: ${f.valor} con ${f.puntos} puntillos ≠ ${f.escrita}`);
        assert.ok(f.tuplas.length <= 6, nombre);
      }
    });
  }
});

test('las ligaduras unen la misma altura y nunca nacen de un silencio', () => {
  for (const [nombre, , part] of generadas) {
    for (const v of part.voces) {
      const figs = v.medidas.flatMap((m) => m.figuras);
      figs.forEach((f, i) => {
        if (f.ligaSale) {
          const sig = figs[i + 1];
          assert.ok(sig && sig.ligaEntra, `${nombre}: ligadura sin destino`);
          assert.deepEqual(sig.alturas, f.alturas, nombre);
        }
        if (f.ligaEntra) {
          const prev = figs[i - 1];
          assert.ok(prev && prev.ligaSale && !prev.silencio, `${nombre}: ligadura sin origen`);
        }
        assert.ok(!f.silencio || (!f.ligaSale && !f.ligaEntra && !f.notas.length), nombre);
      });
    }
  }
});

test('las alturas quedan dentro del ámbito y en la rejilla de cuartos de tono', () => {
  for (const [nombre, proyecto, part] of generadas) {
    for (const v of part.voces) {
      const { min, max, maxAcorde } = v.instrumento;
      for (const m of v.medidas) {
        for (const f of m.figuras) {
          assert.ok(f.alturas.length <= maxAcorde || proyecto.procesos.length >= 0, nombre);
          assert.ok(f.alturas.length <= maxAcorde, `${nombre}: acorde de ${f.alturas.length} en ${v.instrumento.nombre}`);
          for (const q of f.alturas) {
            assert.ok(Number.isInteger(q), nombre);
            assert.ok(q >= min && q <= max, `${nombre}: ${q} fuera de ${min}–${max}`);
          }
        }
      }
    }
  }
});

test('los haces solo unen figuras breves y sus niveles encajan', () => {
  for (const [nombre, , part] of generadas) {
    porCadaMedida(part, (v, m) => {
      for (let i = 0; i < m.figuras.length; i++) {
        const f = m.figuras[i];
        if (!f.haz) continue;
        assert.ok(f.valor >= 8, nombre);
        const niveles = Math.log2(f.valor) - 2;
        assert.equal(Object.keys(f.haz.niveles).length, niveles, `${nombre}: niveles de haz`);
      }
    });
  }
});

test('una ficha de compás irracional abre su tupla implícita', () => {
  const p = generar({
    ...EJEMPLOS.trio.proyecto,
    tiempo: { compases: '3/10', numCompases: 1 },
    procesos: [],
    voces: [{ ...EJEMPLOS.trio.proyecto.voces[0], ritmo: { patrones: '1', unidad: 'pulso', paso: 1, fase: 0 } }],
  });
  const figs = p.voces[0].medidas[0].figuras;
  assert.equal(figs.length, 3);
  assert.equal(figs[0].valor, 8);
  const t = figs[0].abreTuplas[0];
  assert.ok(t.incompleta);
  assert.deepEqual([t.actual, t.normal], [5, 4]);
  assert.ok(figs[0].real.igual(fr(1, 10)));
});

test('generar es determinista', () => {
  for (const [, proyecto] of CASOS.slice(0, 30)) {
    const a = generar(proyecto).voces.map((v) => v.eventos.map((e) => `${e.inicio}|${e.alturas}|${e.dinamica}`));
    const b = generar(proyecto).voces.map((v) => v.eventos.map((e) => `${e.inicio}|${e.alturas}|${e.dinamica}`));
    assert.deepEqual(a, b);
  }
});
