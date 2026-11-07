// Material en bruto: series, matrices rítmicas y tablas para trabajar fuera de
// Telar. Reutiliza el motor para la notación, de modo que un material cumple las
// mismas invariantes que una partitura.

import { mcd } from './fraccion.mjs';
import { azarFijo } from './azar.mjs';
import { ErrorTelar, leerCompas } from './ritmo.mjs';
import { evaluarCampo, frecuencia, leerSerie, nombreAltura, nombreClase, registrar, DINAMICAS, INSTRUMENTOS } from './armonia.mjs';
import { generar } from './motor.mjs';

export const materialInicial = () => ({
  serie: { notas: '0 11 3 4 8 7 9 5 6 1 2 10', modulo: 12, vista: 'nombres', pentagrama: 'O', multiplicadores: '5 7', giro: 0 },
  ritmo: { proporciones: '3 1 2', profundidad: 2, compas: '4/4' },
});

/** Los proyectos anteriores a este modo no traen material. */
export function asegurarMaterial(p) {
  const base = materialInicial();
  p.material = { serie: { ...base.serie, ...p.material?.serie }, ritmo: { ...base.ritmo, ...p.material?.ritmo } };
  return p;
}

const mod = (x, m) => ((x % m) + m) % m;

/* ---------- Series ---------- */

/** Matriz clásica: la fila 0 es la serie; la columna 0, su inversión. */
export const matrizSerie = (s, m) => s.map((fila) => s.map((x) => mod(x + s[0] - fila, m)));

export const esAgregado = (s, m) => s.length === m && new Set(s).size === m;

export const intervalosDe = (s, m) => s.slice(1).map((x, i) => mod(x - s[i], m));

export const rotaciones = (s) => s.map((_, i) => [...s.slice(i), ...s.slice(0, i)]);

/** Rotación transpuesta para que empiece en la primera nota de la serie. */
export const rotacionesTranspuestas = (s, m) => rotaciones(s).map((r) => r.map((x) => mod(x - r[0] + s[0], m)));

/** Multiplica los intervalos respecto de la primera nota. */
export const multiplicar = (s, k, m) => s.map((x) => mod(s[0] + k * (x - s[0]), m));

export function leerMultiplicadores(texto, m) {
  const fichas = String(texto).trim().split(/[\s,;]+/).filter(Boolean);
  return fichas.map((f) => {
    const k = Number(f);
    if (!Number.isInteger(k) || k < 2) throw new ErrorTelar(`«${f}»: un multiplicador es un entero mayor que 1`);
    if (mcd(k, m) !== 1) throw new ErrorTelar(`${k} comparte divisor con el módulo ${m}: repetiría notas. Prueba con ${m === 12 ? '5 o 7' : '5, 7, 11 o 13'}`);
    return k;
  });
}

/** Las cuatro familias de formas, cada una con sus transposiciones. */
export function formasSerie(s, m) {
  const matriz = matrizSerie(s, m);
  const etiqueta = (x) => mod(x - s[0], m);
  const formas = [];
  const filas = matriz.map((f) => ({ t: etiqueta(f[0]), notas: f }));
  const columnas = s.map((_, j) => matriz.map((f) => f[j])).map((c) => ({ t: etiqueta(c[0]), notas: c }));
  for (const { t, notas } of filas) formas.push({ nombre: `O${t}`, familia: 'O', t, notas });
  for (const { t, notas } of columnas) formas.push({ nombre: `I${t}`, familia: 'I', t, notas });
  for (const { t, notas } of filas) formas.push({ nombre: `R${t}`, familia: 'R', t, notas: [...notas].reverse() });
  for (const { t, notas } of columnas) formas.push({ nombre: `RI${t}`, familia: 'RI', t, notas: [...notas].reverse() });
  const orden = { O: 0, I: 1, R: 2, RI: 3 };
  return formas.sort((a, b) => orden[a.familia] - orden[b.familia] || a.t - b.t);
}

export function serieAzar(m, semilla, giro) {
  const s = Array.from({ length: m }, (_, i) => i);
  for (let i = m - 1; i > 0; i--) {
    const j = Math.floor(azarFijo(semilla, 'serie', m, giro, i) * (i + 1));
    [s[i], s[j]] = [s[j], s[i]];
  }
  return s;
}

/** Busca con retroceso una serie de todos los intervalos. Devuelve null si agota el límite. */
function buscarTodosIntervalos(m, semilla, giro, limite) {
  let pasos = 0;
  const ruta = [0];
  const notas = new Set([0]);
  const ints = new Set();
  const buscar = () => {
    if (ruta.length === m) return true;
    if (++pasos > limite) return false;
    const orden = Array.from({ length: m - 1 }, (_, i) => i + 1)
      .map((x) => [azarFijo(semilla, 'todos', m, giro, ruta.length, x, ruta[ruta.length - 1]), x])
      .sort((a, b) => a[0] - b[0]);
    for (const [, iv] of orden) {
      const sig = mod(ruta[ruta.length - 1] + iv, m);
      if (ints.has(iv) || notas.has(sig)) continue;
      ruta.push(sig); notas.add(sig); ints.add(iv);
      if (buscar()) return true;
      ruta.pop(); notas.delete(sig); ints.delete(iv);
    }
    return false;
  };
  return buscar() ? [...ruta] : null;
}

/**
 * Serie de todos los intervalos. En módulo 12 se busca, con mucha variedad; en
 * módulo 24 la búsqueda no es viable y se parte de la serie en cuña
 * (0, m-1, 1, m-2…), transformada por multiplicación, transposición y retrógrado,
 * que conservan la propiedad.
 */
export function serieTodosIntervalos(m, semilla, giro) {
  if (m === 12) {
    const hallada = buscarTodosIntervalos(m, semilla, giro, 20000);
    if (hallada) return hallada;
  }
  const cuna = Array.from({ length: m }, (_, i) => (i % 2 === 0 ? i / 2 : m - (i + 1) / 2));
  const primos = Array.from({ length: m }, (_, k) => k).filter((k) => mcd(k, m) === 1);
  const k = primos[Math.floor(azarFijo(semilla, 'cuna-k', m, giro) * primos.length)];
  const t = Math.floor(azarFijo(semilla, 'cuna-t', m, giro) * m);
  const serie = cuna.map((x) => mod(x * k + t, m));
  return azarFijo(semilla, 'cuna-r', m, giro) < 0.5 ? serie : serie.reverse();
}

/* ---------- Matrices rítmicas ---------- */

export function leerProporciones(texto) {
  const fichas = String(texto).trim().split(/[\s,;]+/).filter(Boolean);
  if (fichas.length < 2) throw new ErrorTelar('Escribe al menos dos proporciones, por ejemplo: 3 1 2');
  if (fichas.length > 8) throw new ErrorTelar('Máximo ocho proporciones');
  return fichas.map((f) => {
    if (!/^-?[1-9]\d?$/.test(f)) throw new ErrorTelar(`«${f}»: una proporción es un entero del 1 al 99; con signo menos, silencio`);
    return Number(f);
  });
}

/**
 * Cada fila rota la lista de proporciones, y cada proporción se divide en una
 * rotación de la misma lista, nivel tras nivel. El signo menos solo cuenta en
 * las hojas: un grupo anidado siempre suena por dentro.
 */
export function filasRitmicas({ proporciones, profundidad }) {
  const base = leerProporciones(proporciones);
  const n = base.length;
  const p = Number(profundidad);
  const celda = (valor, pos, nivel) => {
    if (nivel <= 1) return String(valor);
    const dentro = base.map((_, k) => celda(base[(pos + k) % n], pos + k + 1, nivel - 1));
    return `${Math.abs(valor)}(${dentro.join(' ')})`;
  };
  return base.map((_, i) => base.map((__, j) => celda(base[(i + j) % n], i + j + 1, p)).join(' '));
}

/* ---------- Validación ---------- */

export function validarMaterial(m) {
  const errores = [];
  const probar = (ruta, f) => {
    try { f(); } catch (e) {
      if (!(e instanceof ErrorTelar)) throw e;
      errores.push({ ruta, mensaje: e.message });
    }
  };
  const modulo = Number(m.serie.modulo);
  probar('material.serie.notas', () => leerSerie(m.serie.notas, modulo));
  probar('material.serie.multiplicadores', () => leerMultiplicadores(m.serie.multiplicadores, modulo));
  probar('material.ritmo.proporciones', () => leerProporciones(m.ritmo.proporciones));
  probar('material.ritmo.compas', () => leerCompas(m.ritmo.compas));
  const prof = Number(m.ritmo.profundidad);
  if (!Number.isInteger(prof) || prof < 1 || prof > 4) {
    errores.push({ ruta: 'material.ritmo.profundidad', mensaje: 'La profundidad va de 1 a 4' });
  } else {
    probar('material.ritmo.profundidad', () => {
      const hojas = leerProporciones(m.ritmo.proporciones).length ** prof;
      if (hojas > 512) throw new ErrorTelar(`Serían ${hojas} valores por fila; el máximo es 512. Baja la profundidad o usa menos proporciones`);
    });
  }
  return errores;
}

/* ---------- Partituras de material ---------- */

const hilo = (valores) => ({ valores, paso: 1, fase: 0, modo: 'ataque' });

const hilosNeutros = (altura) => ({
  altura: hilo(altura),
  densidad: hilo('1'),
  dinamica: hilo('-'),
  articulacion: hilo('-'),
});

export function partituraSerie(m, titulo = 'Serie') {
  const modulo = Number(m.serie.modulo);
  const s = leerSerie(m.serie.notas, modulo);
  const todas = formasSerie(s, modulo);
  const formas = m.serie.pentagrama === 'todas' ? todas : todas.filter((f) => f.familia === 'O');
  const notasRejilla = Array.from({ length: modulo }, (_, pc) => nombreAltura(120 + (modulo === 24 ? pc : pc * 2))).join(' ');
  const part = generar({
    version: 1,
    titulo,
    semilla: 1,
    tempo: 120,
    tiempo: { compases: `${s.length}/4`, numCompases: formas.length },
    transicion: 'corte',
    campos: [{ tipo: 'lista', notas: notasRejilla, compases: formas.length }],
    voces: [{
      nombre: 'Serie',
      instrumento: 'piano',
      ritmo: { patrones: '1', unidad: 'pulso', paso: 1, fase: 0 },
      hilos: hilosNeutros(formas.flatMap((f) => f.notas).join(' ')),
    }],
    procesos: [],
  });
  part.etiquetas = formas.map((f) => f.nombre);
  return part;
}

export function partituraRitmo(m, titulo = 'Matriz rítmica') {
  const filas = filasRitmicas(m.ritmo);
  const part = generar({
    version: 1,
    titulo,
    semilla: 1,
    tempo: 60,
    tiempo: { compases: m.ritmo.compas, numCompases: filas.length },
    transicion: 'corte',
    campos: [{ tipo: 'lista', notas: 'Si4', compases: filas.length }],
    voces: [{
      nombre: 'Ritmo',
      instrumento: 'violin',
      ritmo: { patrones: filas.join('\n'), unidad: 'compas', paso: 1, fase: 0 },
      hilos: hilosNeutros('0'),
    }],
    procesos: [],
  });
  part.etiquetas = filas.map((_, i) => `Fila ${i + 1}`);
  return part;
}

/* ---------- Tablas ---------- */

const nombreOSimbolo = (vista, m) => (pc) => (vista === 'numeros' ? String(pc) : nombreClase(pc, m));

export function tablasSerie(ms) {
  const m = Number(ms.modulo);
  const s = leerSerie(ms.notas, m);
  const ver = nombreOSimbolo(ms.vista, m);
  const matriz = matrizSerie(s, m);
  const et = (x) => mod(x - s[0], m);
  const tablas = [];
  tablas.push({
    titulo: esAgregado(s, m) ? 'Serie (agregado completo)' : `Serie (${s.length} de ${m} notas)`,
    columnas: ['', ...s.map((_, i) => String(i + 1))],
    filas: [
      ['Nota', ...s.map(ver)],
      ['Número', ...s.map(String)],
      ['Intervalo', '', ...intervalosDe(s, m).map(String)],
    ],
  });
  tablas.push({
    titulo: 'Matriz: filas O → y ← R; columnas I ↓ y ↑ RI',
    columnas: ['', ...s.map((_, j) => `I${et(matriz[0][j])}`), ''],
    filas: [
      ...matriz.map((f) => [`O${et(f[0])}`, ...f.map(ver), `R${et(f[0])}`]),
      ['', ...s.map((_, j) => `RI${et(matriz[0][j])}`), ''],
    ],
  });
  tablas.push({
    titulo: 'Rotaciones',
    columnas: ['', ...s.map((_, i) => String(i + 1))],
    filas: rotaciones(s).map((r, i) => [`Rot ${i}`, ...r.map(ver)]),
  });
  tablas.push({
    titulo: 'Rotaciones transpuestas a la primera nota',
    columnas: ['', ...s.map((_, i) => String(i + 1))],
    filas: rotacionesTranspuestas(s, m).map((r, i) => [`Rot ${i}`, ...r.map(ver)]),
  });
  const mult = leerMultiplicadores(ms.multiplicadores, m);
  if (mult.length) {
    tablas.push({
      titulo: 'Multiplicaciones de intervalos',
      columnas: ['', ...s.map((_, i) => String(i + 1))],
      filas: mult.map((k) => [`M${k}`, ...multiplicar(s, k, m).map(ver)]),
    });
  }
  return tablas;
}

export function tablasRitmo(mr, part) {
  const base = leerProporciones(mr.proporciones);
  const filas = filasRitmicas(mr);
  const n = base.length;
  const voz = part.voces[0];
  const eventosDe = (c) => voz.eventos.filter((e) => e.inicio.cmp(c.inicio) >= 0 && e.inicio.cmp(c.inicio.mas(c.real)) < 0);
  return [
    {
      titulo: 'Proporciones por fila',
      columnas: ['Fila', ...base.map((_, j) => String(j + 1))],
      filas: base.map((_, i) => [String(i + 1), ...base.map((__, j) => String(base[(i + j) % n]))]),
    },
    {
      titulo: `Patrones (compás ${mr.compas}), en sintaxis de Telar`,
      columnas: ['Fila', 'Patrón', 'Ataques'],
      filas: filas.map((f, i) => [String(i + 1), f, String(eventosDe(part.compases[i]).filter((e) => !e.silencio).length)]),
    },
    {
      titulo: 'Duraciones exactas (fracción de redonda; entre paréntesis, silencio)',
      columnas: ['Fila', 'Duraciones'],
      filas: part.compases.map((c, i) => [String(i + 1), eventosDe(c).map((e) => (e.silencio ? `(${e.dur})` : `${e.dur}`)).join(' ')]),
    },
  ];
}

export function tablasCampos(campos) {
  return campos.map((c, i) => ({
    titulo: `Campo ${i + 1}: ${c.tipo}`,
    columnas: ['Altura', 'Cuartos de tono', 'MIDI', 'Hz', 'Desviación (c)', 'Parcial'],
    filas: evaluarCampo(c).map((n) => [
      nombreAltura(n.q),
      String(n.q),
      String(n.q / 2),
      frecuencia(n.q).toFixed(2),
      n.cents === undefined ? '' : `${n.cents >= 0 ? '+' : ''}${n.cents.toFixed(1)}`,
      n.parcial === undefined ? '' : String(n.parcial),
    ]),
  }));
}

/** Cada ataque de cada voz, tal como queda tras los procesos. */
export function tablasHilos(part) {
  return part.voces.map((v) => {
    const filas = [];
    const eventos = v.eventos;
    const compasDe = (t) => part.compases.findLast((c) => c.inicio.cmp(t) <= 0).indice + 1;
    const hilos = new Map(v.seguimiento.map((s) => [s.ataque, s]));
    eventos.forEach((e, i) => {
      if (e.ataque === null) return;
      let dur = e.dur;
      for (let j = i + 1; j < eventos.length && eventos[j].liga && !eventos[j].silencio; j++) dur = dur.mas(eventos[j].dur);
      const s = hilos.get(e.ataque);
      filas.push([
        String(e.ataque + 1),
        String(compasDe(e.inicio)),
        String(e.inicio),
        String(dur),
        e.alturas.map(nombreAltura).join(' + '),
        String(s?.altura ?? ''),
        e.dinamica === null ? '' : DINAMICAS[e.dinamica],
        e.articulacion ?? '',
        e.silencio ? 'filtrado' : 'suena',
      ]);
    });
    return {
      titulo: v.nombre,
      columnas: ['Ataque', 'Compás', 'Inicio', 'Duración', 'Alturas', 'Índice', 'Dinámica', 'Articulación', 'Estado'],
      filas,
    };
  });
}

/* ---------- Salidas de texto ---------- */

const celdaCSV = (c) => (/[;"\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c);

/** Punto y coma como separador, el habitual en hojas de cálculo en español. */
export const aCSV = (tablas) => tablas
  .map((t) => [[t.titulo], t.columnas, ...t.filas].map((f) => f.map(celdaCSV).join(';')).join('\r\n'))
  .join('\r\n\r\n');

export function aTexto(tablas) {
  return tablas.map((t) => {
    const filas = [t.columnas, ...t.filas];
    const anchos = t.columnas.map((_, k) => Math.max(...filas.map((f) => String(f[k] ?? '').length)));
    const linea = (f) => f.map((c, k) => String(c ?? '').padEnd(anchos[k])).join('  ').trimEnd();
    return [t.titulo, '='.repeat(t.titulo.length), linea(t.columnas), ...t.filas.map(linea)].join('\n');
  }).join('\n\n');
}

export const aJSON = (tablas) => JSON.stringify(tablas.map((t) => ({
  titulo: t.titulo,
  columnas: t.columnas,
  filas: t.filas,
})), null, 2);

/* ---------- Del material a la partitura ---------- */

/** Índices del hilo de altura que recorren la serie cerca del centro del registro. */
export function indicesSerie(s, m, instrumento) {
  const campo = evaluarCampo({ tipo: 'serie', notas: s.join(' '), modulo: m });
  const lista = registrar(campo.map((n) => n.q), instrumento.min, instrumento.max);
  const centro = (instrumento.min + instrumento.max) / 2;
  const clase = (q) => (m === 24 ? mod(q, 24) : mod(q / 2, 12));
  return s.map((pc) => {
    let mejor = -1;
    lista.forEach((q, i) => {
      if (clase(q) === pc && (mejor < 0 || Math.abs(q - centro) < Math.abs(lista[mejor] - centro))) mejor = i;
    });
    return mejor;
  });
}

/** La serie pasa a ser el campo de la pieza, y cada voz la recorre en orden. */
export function llevarSerie(proyecto) {
  const { serie } = proyecto.material;
  const m = Number(serie.modulo);
  const s = leerSerie(serie.notas, m);
  proyecto.campos = [{ tipo: 'serie', notas: s.join(' '), modulo: m, compases: Number(proyecto.tiempo.numCompases) || 1 }];
  for (const v of proyecto.voces) {
    v.hilos.altura = { valores: indicesSerie(s, m, INSTRUMENTOS[v.instrumento]).join(' '), paso: 1, fase: 0, modo: 'ataque' };
  }
}

/** Las filas de la matriz pasan a ser los patrones de una voz, un compás por fila. */
export function llevarRitmo(proyecto, iv) {
  const filas = filasRitmicas(proyecto.material.ritmo);
  const v = proyecto.voces[iv];
  v.ritmo = { ...v.ritmo, patrones: filas.join('\n'), unidad: 'compas', paso: 1, fase: 0 };
}

