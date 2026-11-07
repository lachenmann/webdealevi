// De un proyecto (datos editables) a una partitura (datos exactos).
// compases → árboles → procesos rítmicos → ataques → hilos → procesos sobre
// eventos → silencios → escritura. Función pura: misma entrada, misma salida.

import { fr, CERO, mcm } from './fraccion.mjs';
import { azarFijo } from './azar.mjs';
import {
  ErrorTelar, leerCompases, leerPatrones, construirRaiz, recorrerHojas, normalizarArbol,
  colapsarSilencios, duracionDeCompas, escrituraDeCompas,
} from './ritmo.mjs';
import {
  INSTRUMENTOS, DINAMICAS, ARTICULACIONES, VELOCIDADES, evaluarCampo, interpolarCampos,
  registrar, plegar, leerAltura, leerCriba,
} from './armonia.mjs';
import { escribirMedida } from './escritura.mjs';

export const MAX_VOCES = 7; // cada voz usa dos canales MIDI

const fichas = (t) => String(t).trim().split(/\s+/).filter(Boolean);

/* ---------- Lectura de hilos ---------- */

export function leerHilo(tipo, hilo) {
  const vals = fichas(hilo.valores);
  if (!vals.length) throw new ErrorTelar('El ciclo está vacío');
  const valores = vals.map((v) => {
    if (tipo === 'altura') {
      if (!/^\d+$/.test(v)) throw new ErrorTelar(`«${v}»: las alturas se indican con índices enteros del campo (0, 1, 2…)`);
      return Number(v);
    }
    if (tipo === 'densidad') {
      if (!/^[1-9]$/.test(v)) throw new ErrorTelar(`«${v}»: la densidad es el número de notas por ataque (1–9)`);
      return Number(v);
    }
    if (tipo === 'dinamica') {
      if (v === '-') return null; // sin indicación
      const i = DINAMICAS.indexOf(v);
      if (i < 0) throw new ErrorTelar(`«${v}» no es una dinámica. Usa: ${DINAMICAS.join(' ')}, o - para ninguna`);
      return i;
    }
    if (!Object.hasOwn(ARTICULACIONES, v)) throw new ErrorTelar(`«${v}» no es una articulación. Usa: - (nada) . ! _ > ^`);
    return ARTICULACIONES[v];
  });
  const paso = Number(hilo.paso ?? 1);
  if (!(paso > 0)) throw new ErrorTelar('El paso debe ser mayor que 0');
  if ((hilo.modo ?? 'ataque') === 'ataque' && !Number.isInteger(paso)) throw new ErrorTelar('Por ataques, el paso debe ser entero');
  return { valores, paso, fase: Number(hilo.fase ?? 0) || 0, modo: hilo.modo ?? 'ataque' };
}

export function valorDeHilo(h, ataque, negras) {
  const pos = h.modo === 'tiempo' ? Math.floor(negras / h.paso + 1e-9) : Math.floor(ataque / h.paso);
  const n = h.valores.length;
  return h.valores[(((pos + h.fase) % n) + n) % n];
}

/** Periodo en ataques de cada hilo y momento en que todos se realinean. */
export function periodosDe(voz) {
  const salida = {};
  let comun = 1;
  let medible = true;
  for (const tipo of ['altura', 'densidad', 'dinamica', 'articulacion']) {
    const h = voz.hilos[tipo];
    let p = null;
    try {
      const l = leerHilo(tipo, h);
      if (l.modo === 'ataque') {
        p = l.valores.length * l.paso;
        comun = mcm(comun, p);
      } else {
        medible = false;
      }
    } catch { medible = false; }
    salida[tipo] = p;
  }
  salida.comun = medible ? comun : null;
  return salida;
}

/* ---------- Curvas ---------- */

export function curvaProceso(p, t) {
  const ini = Number(p.inicio ?? 0), fin = Number(p.fin ?? 1);
  if (t < ini || t > fin || fin <= ini) return null;
  const x = (t - ini) / (fin - ini);
  if (p.forma === 'exponencial') return x ** 2.5;
  if (p.forma === 'campana') return Math.sin(Math.PI * x);
  return x;
}

export const valorProceso = (p, t) => {
  const f = curvaProceso(p, t);
  return f === null ? null : Number(p.desde) + (Number(p.hasta) - Number(p.desde)) * f;
};

export const TIPOS_PROCESO = {
  subdivision: 'Subdivisión progresiva',
  fusion: 'Fusión de ataques',
  rarefaccion: 'Rarefacción',
  cribaAtaques: 'Criba de ataques',
  banda: 'Filtro de banda',
  transposicion: 'Transposición',
  compresion: 'Compresión interválica',
  dinamica: 'Deriva dinámica',
};

const afecta = (p, iv) => p.voces === 'todas' || p.voces === undefined || (Array.isArray(p.voces) && p.voces.includes(iv));

/* ---------- Validación ---------- */

export function validar(p) {
  const errores = [];
  const probar = (ruta, f) => {
    try { f(); } catch (e) {
      if (!(e instanceof ErrorTelar)) throw e;
      errores.push({ ruta, mensaje: e.message });
    }
  };
  const entero = (ruta, v, min, max, nombre) => {
    if (!Number.isInteger(Number(v)) || Number(v) < min || Number(v) > max) errores.push({ ruta, mensaje: `${nombre}: escribe un entero entre ${min} y ${max}` });
  };
  probar('tiempo.compases', () => leerCompases(p.tiempo.compases));
  entero('tiempo.numCompases', p.tiempo.numCompases, 1, 200, 'Compases');
  if (!(Number(p.tempo) >= 10 && Number(p.tempo) <= 300)) errores.push({ ruta: 'tempo', mensaje: 'El tempo debe estar entre 10 y 300' });
  if (!p.voces.length) errores.push({ ruta: 'voces', mensaje: 'Añade al menos una voz' });
  if (p.voces.length > MAX_VOCES) errores.push({ ruta: 'voces', mensaje: `Máximo ${MAX_VOCES} voces` });
  if (!p.campos.length) errores.push({ ruta: 'campos', mensaje: 'Añade al menos un campo' });
  p.voces.forEach((v, i) => {
    probar(`voces.${i}.ritmo.patrones`, () => leerPatrones(v.ritmo.patrones));
    entero(`voces.${i}.ritmo.paso`, v.ritmo.paso ?? 1, 1, 64, 'Paso');
    for (const tipo of ['altura', 'densidad', 'dinamica', 'articulacion']) {
      probar(`voces.${i}.hilos.${tipo}.valores`, () => leerHilo(tipo, v.hilos[tipo]));
    }
  });
  p.campos.forEach((c, i) => {
    entero(`campos.${i}.compases`, c.compases, 1, 200, 'Duración');
    probar(`campos.${i}`, () => evaluarCampo(c));
  });
  p.procesos.forEach((q, i) => {
    if (!(q.tipo in TIPOS_PROCESO)) errores.push({ ruta: `procesos.${i}`, mensaje: `Proceso desconocido: ${q.tipo}` });
    if (q.tipo === 'banda') {
      for (const k of ['graveDesde', 'graveHasta', 'agudoDesde', 'agudoHasta']) probar(`procesos.${i}.${k}`, () => leerAltura(q[k]));
    } else if (q.tipo === 'cribaAtaques') {
      probar(`procesos.${i}.expresion`, () => leerCriba(q.expresion));
    } else {
      if (!Number.isFinite(Number(q.desde))) errores.push({ ruta: `procesos.${i}.desde`, mensaje: 'Debe ser un número' });
      if (!Number.isFinite(Number(q.hasta))) errores.push({ ruta: `procesos.${i}.hasta`, mensaje: 'Debe ser un número' });
    }
    if (q.tipo === 'compresion') probar(`procesos.${i}.eje`, () => leerAltura(q.eje));
    if (q.tipo === 'subdivision') {
      if (!fichas(q.opciones).length || fichas(q.opciones).some((x) => !/^\d+$/.test(x) || Number(x) < 2 || Number(x) > 31)) {
        errores.push({ ruta: `procesos.${i}.opciones`, mensaje: 'Escribe enteros entre 2 y 31, por ejemplo: 3 5 7' });
      }
    }
    if (!(Number(q.inicio ?? 0) < Number(q.fin ?? 1))) errores.push({ ruta: `procesos.${i}.fin`, mensaje: 'La ventana debe terminar después de empezar' });
  });
  return errores;
}

/* ---------- Campos en el tiempo ---------- */

function secuenciaDeCampos(p, compases) {
  const bases = p.campos.map(evaluarCampo);
  const secciones = [];
  let ci = 0, n = 0;
  while (n < compases.length) {
    const largo = Number(p.campos[ci % bases.length].compases);
    const hastaC = Math.min(n + largo, compases.length);
    const ini = compases[n].inicio;
    const finCompas = n + largo; // la sección nominal, aunque la pieza acabe antes
    const ultimo = compases[hastaC - 1];
    const finReal = ultimo.inicio.mas(ultimo.real);
    secciones.push({ a: bases[ci % bases.length], b: bases[(ci + 1) % bases.length], ini, fin: finReal, nominal: finCompas });
    n = hastaC;
    ci++;
  }
  return (t) => {
    let s = secciones[0];
    for (const x of secciones) if (x.ini.cmp(t) <= 0) s = x;
    if (p.transicion !== 'interpolar' || bases.length < 2) return s.a;
    const x = t.menos(s.ini).entre(s.fin.menos(s.ini)).aNumero();
    return interpolarCampos(s.a, s.b, x);
  };
}

/* ---------- Voz ---------- */

function aplicarProcesosRitmicos(p, iv, medidas, total) {
  p.procesos.forEach((q, ip) => {
    if (!afecta(q, iv) || (q.tipo !== 'subdivision' && q.tipo !== 'fusion')) return;
    const opciones = q.tipo === 'subdivision' ? fichas(q.opciones).map(Number) : [];
    let n = 0;
    let anterior = false;
    for (const m of medidas) {
      recorrerHojas(m.raiz, m.inicio, m.real, (h, t) => {
        const prob = valorProceso(q, t.aNumero() / total);
        const r = azarFijo(p.semilla, 'ritmo', ip, iv, n);
        if (q.tipo === 'subdivision') {
          if (prob !== null && r < prob && h.tipo === 'nota') {
            const k = opciones[Math.floor(azarFijo(p.semilla, 'opcion', ip, iv, n) * opciones.length)];
            h.hijos = Array.from({ length: k }, () => ({ peso: 1, tipo: 'nota' }));
            delete h.tipo;
          }
        } else if (h.tipo === 'nota' && anterior && prob !== null && r < prob) {
          h.tipo = 'liga';
        }
        anterior = h.hijos ? true : h.tipo !== 'silencio';
        n++;
      });
    }
  });
}

function aplicarProcesosDeEventos(p, iv, eventos, total) {
  p.procesos.forEach((q, ip) => {
    if (!afecta(q, iv)) return;
    if (q.tipo === 'subdivision' || q.tipo === 'fusion') return;
    const criba = q.tipo === 'cribaAtaques' ? leerCriba(q.expresion) : null;
    const graves = q.tipo === 'banda' ? [leerAltura(q.graveDesde), leerAltura(q.graveHasta)] : null;
    const agudos = q.tipo === 'banda' ? [leerAltura(q.agudoDesde), leerAltura(q.agudoHasta)] : null;
    const eje = q.tipo === 'compresion' ? leerAltura(q.eje) : 0;
    for (const ev of eventos) {
      if (ev.silencio || ev.liga) continue;
      const t = ev.inicio.aNumero() / total;
      const f = curvaProceso(q, t);
      if (f === null) continue;
      const v = Number(q.desde) + (Number(q.hasta) - Number(q.desde)) * f;
      switch (q.tipo) {
        case 'rarefaccion':
          if (azarFijo(p.semilla, 'raref', ip, iv, ev.ataque) < v) ev.silencio = true;
          break;
        case 'cribaAtaques':
          if (!criba.pertenece(ev.ataque)) ev.silencio = true;
          break;
        case 'banda': {
          const lo = Math.round(graves[0] + (graves[1] - graves[0]) * f);
          const hi = Math.round(agudos[0] + (agudos[1] - agudos[0]) * f);
          const r = [];
          for (const a of ev.alturas) {
            if (a >= lo && a <= hi) r.push(a);
            else if (q.modo === 'plegar') {
              const pl = plegar(a, lo, hi);
              if (pl !== null) r.push(pl);
            }
          }
          if (r.length) ev.alturas = r; else ev.silencio = true;
          break;
        }
        case 'transposicion':
          ev.alturas = ev.alturas.map((a) => a + Math.round(v * 2));
          break;
        case 'compresion':
          ev.alturas = ev.alturas.map((a) => Math.round(eje + (a - eje) * v));
          break;
        case 'dinamica':
          if (ev.dinamica !== null) ev.dinamica = Math.max(0, Math.min(DINAMICAS.length - 1, ev.dinamica + Math.round(v)));
          break;
        default:
      }
    }
  });
}

function generarVoz(p, iv, compases, total, campoEn, avisos) {
  const v = p.voces[iv];
  const instrumento = INSTRUMENTOS[v.instrumento];
  if (!instrumento) throw new ErrorTelar(`Instrumento desconocido: ${v.instrumento}`, `voces.${iv}.instrumento`);
  const patrones = leerPatrones(v.ritmo.patrones);
  const unidad = v.ritmo.unidad === 'compas' ? 'compas' : 'pulso';
  const pasoP = Number(v.ritmo.paso ?? 1);
  const faseP = Number(v.ritmo.fase ?? 0) || 0;
  let cuenta = 0;
  const siguiente = () => {
    const i = Math.floor(cuenta / pasoP) + faseP;
    cuenta++;
    return ((i % patrones.length) + patrones.length) % patrones.length;
  };
  const medidas = compases.map((c) => ({ compas: c, inicio: c.inicio, real: c.real, raiz: construirRaiz(c, patrones, unidad, siguiente) }));

  aplicarProcesosRitmicos(p, iv, medidas, total);
  let fundidos = 0;
  for (const m of medidas) fundidos += normalizarArbol(m.raiz, m.compas);
  if (fundidos) avisos.push(`${v.nombre}: ${fundidos} grupo(s) fundidos por superar el valor mínimo 1/128 o seis tuplas anidadas.`);

  // Hojas → eventos.
  const eventos = [];
  let ataque = 0;
  for (const m of medidas) {
    recorrerHojas(m.raiz, m.inicio, m.real, (h, t, d) => {
      const prev = eventos[eventos.length - 1];
      const ev = { inicio: t, dur: d, silencio: false, liga: false, ligaSale: false, alturas: [], dinamica: null, articulacion: null, ataque: null };
      if (h.tipo === 'silencio') ev.silencio = true;
      else if (h.tipo === 'liga') {
        if (prev && !prev.silencio) ev.liga = true;
        else ev.silencio = true;
      }
      if (!ev.silencio && !ev.liga) ev.ataque = ataque++;
      h.evento = ev;
      eventos.push(ev);
    });
  }

  // Tejido de hilos.
  const hilos = {};
  for (const t of ['altura', 'densidad', 'dinamica', 'articulacion']) hilos[t] = leerHilo(t, v.hilos[t]);
  let avisoVacio = false;
  const seguimiento = [];
  for (const ev of eventos) {
    if (ev.silencio || ev.liga) continue;
    const negras = ev.inicio.por(fr(4)).aNumero();
    const campo = campoEn(ev.inicio);
    const lista = registrar(campo.map((n) => n.q), instrumento.min, instrumento.max);
    if (!lista.length) { ev.silencio = true; avisoVacio = true; continue; }
    const idx = valorDeHilo(hilos.altura, ev.ataque, negras);
    const dens = Math.min(valorDeHilo(hilos.densidad, ev.ataque, negras), instrumento.maxAcorde, lista.length);
    const pos = idx % lista.length;
    const notas = [];
    for (let k = 0; k < dens; k++) {
      const a = pos + k * 2;
      notas.push(a < lista.length ? lista[a] : lista[Math.max(0, pos - (a - lista.length + 1) * 2) % lista.length]);
    }
    ev.alturas = notas;
    ev.dinamica = valorDeHilo(hilos.dinamica, ev.ataque, negras);
    ev.articulacion = valorDeHilo(hilos.articulacion, ev.ataque, negras);
    seguimiento.push({ ataque: ev.ataque, inicio: ev.inicio, altura: idx, densidad: dens, dinamica: ev.dinamica, articulacion: ev.articulacion });
  }
  if (avisoVacio) avisos.push(`${v.nombre}: el campo no tiene alturas en su ámbito en algún momento.`);

  aplicarProcesosDeEventos(p, iv, eventos, total);

  // Ámbito, orden y coherencia de ligaduras tras los filtros.
  for (let i = 0; i < eventos.length; i++) {
    const ev = eventos[i];
    if (ev.liga) {
      const prev = eventos[i - 1];
      if (prev.silencio) { ev.silencio = true; ev.liga = false; }
      else { ev.alturas = prev.alturas; ev.dinamica = prev.dinamica; prev.ligaSale = true; }
    } else if (!ev.silencio) {
      const dentro = ev.alturas.map((a) => plegar(a, instrumento.min, instrumento.max)).filter((a) => a !== null);
      ev.alturas = [...new Set(dentro)].sort((a, b) => a - b);
      if (!ev.alturas.length) ev.silencio = true;
    }
    if (ev.silencio) { ev.alturas = []; ev.dinamica = null; ev.articulacion = null; }
  }
  for (const m of medidas) {
    recorrerHojas(m.raiz, m.inicio, m.real, (h) => {
      if (h.evento?.silencio) h.tipo = 'silencio';
    });
    colapsarSilencios(m.raiz, m.compas);
  }

  // Escritura.
  const estado = { dinamica: null };
  const salida = medidas.map((m) => ({ compas: m.compas, figuras: escribirMedida(m.raiz, m.compas, m.inicio, estado), raiz: m.raiz }));
  return { indice: iv, nombre: v.nombre, instrumento, medidas: salida, eventos, seguimiento };
}

/* ---------- Partitura ---------- */

export function generar(p) {
  const errores = validar(p);
  if (errores.length) throw new ErrorTelar(errores[0].mensaje, errores[0].ruta);
  const metros = leerCompases(p.tiempo.compases);
  const compases = [];
  let t = CERO;
  for (let i = 0; i < Number(p.tiempo.numCompases); i++) {
    const m = metros[i % metros.length];
    const real = duracionDeCompas(m);
    compases.push({ ...m, indice: i, inicio: t, real, escrita: escrituraDeCompas(m).escrita });
    t = t.mas(real);
  }
  const total = t.aNumero();
  const campoEn = secuenciaDeCampos(p, compases);
  const avisos = [];
  const voces = p.voces.map((_, iv) => generarVoz(p, iv, compases, total, campoEn, avisos));
  const ataques = voces.reduce((a, v) => a + v.eventos.filter((e) => !e.silencio && !e.liga).length, 0);
  return {
    titulo: p.titulo || 'Telar',
    tempo: Number(p.tempo),
    compases,
    voces,
    duracion: t,
    avisos,
    ataques,
    segundos: t.aNumero() * 4 * 60 / Number(p.tempo),
  };
}

/* ---------- Interpretación: lo que suena en audio y MIDI ---------- */

const GATE = { staccato: fr(1, 2), staccatissimo: fr(1, 4), tenuto: fr(1), acento: fr(9, 10), marcato: fr(7, 10) };
const REFUERZO = { acento: 14, marcato: 22 };

export function notasSonoras(voz) {
  const salida = [];
  const ev = voz.eventos;
  for (let i = 0; i < ev.length; i++) {
    const e = ev[i];
    if (e.silencio || e.liga) continue;
    let dur = e.dur;
    for (let j = i + 1; j < ev.length && ev[j].liga && !ev[j].silencio; j++) dur = dur.mas(ev[j].dur);
    const gate = GATE[e.articulacion] ?? fr(19, 20);
    const vel = Math.min(127, VELOCIDADES[e.dinamica ?? 4] + (REFUERZO[e.articulacion] ?? 0));
    salida.push({ inicio: e.inicio, escrita: dur, sonora: dur.por(gate), alturas: e.alturas, velocidad: vel });
  }
  return salida;
}
