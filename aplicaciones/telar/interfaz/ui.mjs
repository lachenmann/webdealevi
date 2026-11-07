// Interfaz: cuatro pasos a la izquierda, la tela a la derecha.

import { generar, validar, periodosDe, TIPOS_PROCESO, curvaProceso, MAX_VOCES } from '../nucleo/motor.mjs';
import { INSTRUMENTOS, evaluarCampo, leerCriba, nombreAltura } from '../nucleo/armonia.mjs';
import { leerPatrones, ErrorTelar } from '../nucleo/ritmo.mjs';
import { EJEMPLOS, EJEMPLO_INICIAL, copiarProyecto } from '../nucleo/ejemplos.mjs';
import { exportarLilyPond } from '../nucleo/export-lilypond.mjs';
import { exportarMusicXML } from '../nucleo/export-musicxml.mjs';
import { exportarMIDI } from '../nucleo/export-midi.mjs';
import { grabar, grabarCampo } from './grabado.mjs';
import { dibujarTejido, dibujarTira, dibujarCurva } from './tejido.mjs';
import { Reproductor } from './audio.mjs';

const CLAVE_GUARDADO = 'telar.proyecto.v1';
const $ = (id) => document.getElementById(id);

const h = (tag, attrs = {}, ...hijos) => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === false || v === null || v === undefined) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'html') el.innerHTML = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of hijos.flat(Infinity)) if (c !== null && c !== undefined && c !== false) el.append(c);
  return el;
};

/* ---------- Estado ---------- */

let proyecto;
let partitura = null;
let vista = { mapa: [] };
let historial = [];
let rehacer = [];
let temporizador = null;
const silenciadas = new Set();
let zoom = 7;

const leerRuta = (ruta) => ruta.split('.').reduce((o, k) => (o === undefined ? o : o[k]), proyecto);
const ponerRuta = (ruta, valor) => {
  const partes = ruta.split('.');
  const ult = partes.pop();
  partes.reduce((o, k) => o[k], proyecto)[ult] = valor;
};

function recordar() {
  const foto = JSON.stringify(proyecto);
  if (historial[historial.length - 1] === foto) return;
  historial.push(foto);
  if (historial.length > 100) historial.shift();
  rehacer = [];
  actualizarHistorial();
}

function actualizarHistorial() {
  $('deshacer').disabled = historial.length < 2;
  $('rehacer').disabled = !rehacer.length;
}

function restaurar(foto) {
  proyecto = JSON.parse(foto);
  pintarPaneles();
  regenerar();
  actualizarHistorial();
}

function guardar() {
  try { localStorage.setItem(CLAVE_GUARDADO, JSON.stringify(proyecto)); } catch { /* sin almacenamiento */ }
}

function cargarGuardado() {
  try {
    const t = localStorage.getItem(CLAVE_GUARDADO);
    if (!t) return null;
    const p = JSON.parse(t);
    return p && p.version === 1 ? p : null;
  } catch {
    return null;
  }
}

/* ---------- Campos de formulario ---------- */

function entrada(ruta, etiqueta, { tipo = 'text', ayuda, opciones, area, min, max, paso, numero, clase } = {}) {
  const id = `c-${ruta.replace(/\./g, '-')}`;
  const valor = leerRuta(ruta);
  let control;
  const cambio = (e) => {
    const v = numero ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value;
    ponerRuta(ruta, v);
    programarRegeneracion();
  };
  const fin = () => recordar();
  if (opciones) {
    control = h('select', { id, 'data-ruta': ruta, onchange: (e) => { cambio(e); recordar(); pintarPaneles(); } },
      opciones.map(([v, t]) => h('option', { value: v, selected: String(v) === String(valor) }, t)));
  } else if (area) {
    control = h('textarea', { id, 'data-ruta': ruta, rows: area, spellcheck: 'false', oninput: cambio, onchange: fin });
    control.value = valor ?? '';
  } else {
    control = h('input', { id, type: tipo, 'data-ruta': ruta, min, max, step: paso, spellcheck: 'false', autocomplete: 'off', oninput: cambio, onchange: fin });
    control.value = valor ?? '';
  }
  return h('div', { class: `campo${clase ? ` ${clase}` : ''}` },
    h('label', { for: id }, etiqueta),
    control,
    ayuda ? h('p', { class: 'ayuda' }, ayuda) : null,
    h('p', { class: 'error-campo', 'data-error': ruta, hidden: true }));
}

const paso = (numero, titulo, resumen, abierto, ...contenido) =>
  h('details', { class: 'paso', open: abierto, 'data-paso': numero },
    h('summary', {}, h('span', { class: 'paso-num' }, numero), h('span', { class: 'paso-tit' }, titulo), h('span', { class: 'paso-res' }, resumen)),
    h('div', { class: 'paso-cuerpo' }, contenido));

/* ---------- Paneles ---------- */

const pasosAbiertos = new Set(['1', '2']);
const tarjetasAbiertas = new Set(['voz-0']);

function pintarPaneles() {
  const foco = document.activeElement?.id;
  document.querySelectorAll('details[data-paso]').forEach((d) => {
    if (d.open) pasosAbiertos.add(d.dataset.paso); else pasosAbiertos.delete(d.dataset.paso);
  });
  document.querySelectorAll('details[data-tarjeta]').forEach((d) => {
    if (d.open) tarjetasAbiertas.add(d.dataset.tarjeta); else tarjetasAbiertas.delete(d.dataset.tarjeta);
  });
  const panel = $('taller');
  panel.replaceChildren(panelTiempo(), panelVoces(), panelCampos(), panelProcesos());
  $('titulo-pieza').value = proyecto.titulo ?? '';
  $('semilla').value = proyecto.semilla ?? 1;
  actualizarPrevias();
  marcarErrores();
  if (foco && $(foco)) $(foco).focus();
}

function panelTiempo() {
  return paso('1', 'Urdimbre', 'compases y tempo', pasosAbiertos.has('1'),
    entrada('tiempo.compases', 'Ciclo de compases', {
      ayuda: 'Se repite hasta completar la pieza. Valen compases irracionales: 3/10 son tres décimos de redonda. 2+3/16 fija la agrupación.',
    }),
    h('div', { class: 'fila' },
      entrada('tiempo.numCompases', 'Compases', { tipo: 'number', numero: true, min: 1, max: 200 }),
      entrada('tempo', 'Negra =', { tipo: 'number', numero: true, min: 10, max: 300 })));
}

function panelVoces() {
  const vs = proyecto.voces.map((v, i) => tarjetaVoz(v, i));
  return paso('2', 'Hilos', 'ritmo y parámetros por voz', pasosAbiertos.has('2'),
    h('p', { class: 'guia' }, 'Cada voz combina un ciclo de ritmos con ciclos independientes de altura, densidad, dinámica y articulación. Si sus longitudes no coinciden, los parámetros se desfasan y tardan en volver a alinearse.'),
    vs,
    h('button', {
      class: 'boton-suave',
      type: 'button',
      disabled: proyecto.voces.length >= MAX_VOCES,
      onclick: () => {
        const base = copiarProyecto(proyecto.voces[proyecto.voces.length - 1] ?? EJEMPLOS.trio.proyecto.voces[0]);
        base.nombre = `Voz ${proyecto.voces.length + 1}`;
        proyecto.voces.push(base);
        tarjetasAbiertas.add(`voz-${proyecto.voces.length - 1}`);
        recordar();
        pintarPaneles();
        regenerar();
      },
    }, '+ Añadir voz'));
}

const quitar = (lista, i, destino) => (e) => {
  e.preventDefault();
  lista.splice(i, 1);
  if (destino === 'voz') {
    for (const q of proyecto.procesos) {
      if (Array.isArray(q.voces)) q.voces = q.voces.filter((x) => x !== i).map((x) => (x > i ? x - 1 : x));
    }
  }
  recordar();
  pintarPaneles();
  regenerar();
};

function tarjetaVoz(v, i) {
  const r = `voces.${i}`;
  const hiloFila = (tipo, etiqueta, ayuda) => {
    const modo = v.hilos[tipo].modo ?? 'ataque';
    return h('div', { class: 'hilo' },
      entrada(`${r}.hilos.${tipo}.valores`, etiqueta, { ayuda }),
      h('div', { class: 'fila fila-hilo' },
        entrada(`${r}.hilos.${tipo}.modo`, 'Avanza por', { opciones: [['ataque', 'ataques'], ['tiempo', 'tiempo']] }),
        entrada(`${r}.hilos.${tipo}.paso`, modo === 'tiempo' ? 'Cada (negras)' : 'Cada', { tipo: 'number', numero: true, min: modo === 'tiempo' ? 0.25 : 1, paso: modo === 'tiempo' ? 0.25 : 1 }),
        entrada(`${r}.hilos.${tipo}.fase`, 'Fase', { tipo: 'number', numero: true, min: 0, paso: 1 })));
  };
  return h('details', { class: 'tarjeta', 'data-tarjeta': `voz-${i}`, open: tarjetasAbiertas.has(`voz-${i}`) },
    h('summary', {},
      h('span', { class: 'tarjeta-tit' }, v.nombre || `Voz ${i + 1}`),
      h('span', { class: 'tarjeta-res', 'data-periodos': i }),
      h('button', { class: 'quitar', type: 'button', 'aria-label': `Quitar ${v.nombre}`, title: 'Quitar voz', disabled: proyecto.voces.length < 2, onclick: quitar(proyecto.voces, i, 'voz') }, '×')),
    h('div', { class: 'fila' },
      entrada(`${r}.nombre`, 'Nombre'),
      entrada(`${r}.instrumento`, 'Instrumento', { opciones: Object.entries(INSTRUMENTOS).map(([k, x]) => [k, x.nombre]) })),
    entrada(`${r}.ritmo.patrones`, 'Ritmos (un patrón por línea)', {
      area: 4,
      ayuda: 'Pesos relativos. 2(1 1 1) es una duración de peso 2 dividida en tres. -1 es silencio y +1 liga con lo anterior.',
    }),
    h('div', { class: 'tiras', 'data-tiras': i }),
    h('div', { class: 'fila' },
      entrada(`${r}.ritmo.unidad`, 'Cada patrón llena', { opciones: [['pulso', 'un pulso'], ['compas', 'un compás']] }),
      entrada(`${r}.ritmo.paso`, 'Cambia cada', { tipo: 'number', numero: true, min: 1 }),
      entrada(`${r}.ritmo.fase`, 'Fase', { tipo: 'number', numero: true, min: 0 })),
    hiloFila('altura', 'Altura', 'Índices del campo armónico en el registro del instrumento: 0 es la nota más grave.'),
    hiloFila('densidad', 'Densidad', `Notas por ataque, limitadas a ${INSTRUMENTOS[v.instrumento]?.maxAcorde ?? 1} en este instrumento.`),
    hiloFila('dinamica', 'Dinámica', 'ppp pp p mp mf f ff fff'),
    hiloFila('articulacion', 'Articulación', '- nada · . picado · ! muy picado · _ tenuto · > acento · ^ marcato'));
}

const NOMBRE_CAMPO = { multiplicacion: 'Multiplicación', criba: 'Criba', espectro: 'Espectro', lista: 'Lista de alturas' };

const CAMPO_NUEVO = {
  multiplicacion: { tipo: 'multiplicacion', modo: 'intervalos', a: 'Do4 Mi4 Sol#4', b: 'Re4 Fa4', compases: 4 },
  criba: { tipo: 'criba', expresion: '5@0 | 7@2', desde: 'Do3', hasta: 'Do6', unidad: 'semitono', compases: 4 },
  espectro: { tipo: 'espectro', fundamental: 'Do2', parciales: '1-16', estiramiento: 1, compases: 4 },
  lista: { tipo: 'lista', notas: 'Do4 Re4+ Fa4 Sol#4', compases: 4 },
};

function panelCampos() {
  const tarjetas = proyecto.campos.map((c, i) => {
    const r = `campos.${i}`;
    const cuerpo = [];
    if (c.tipo === 'multiplicacion') {
      cuerpo.push(entrada(`${r}.modo`, 'Modo', { opciones: [['intervalos', 'Interválica: A transportado por los intervalos de B'], ['anillo', 'Frecuencial: sumas y diferencias (anillo)']] }));
      cuerpo.push(h('div', { class: 'fila' }, entrada(`${r}.a`, 'Acorde A'), entrada(`${r}.b`, 'Acorde B')));
      cuerpo.push(h('p', { class: 'ayuda' }, 'Do4, Sol#3, Sib2. Con + o − se sube o baja un cuarto de tono: Re4+.'));
    } else if (c.tipo === 'criba') {
      cuerpo.push(entrada(`${r}.expresion`, 'Expresión', { ayuda: 'm@r es la clase de resto r módulo m. Se combinan con | (unión), & (intersección), ! (complemento) y paréntesis.' }));
      cuerpo.push(h('div', { class: 'fila' },
        entrada(`${r}.desde`, 'Desde'),
        entrada(`${r}.hasta`, 'Hasta'),
        entrada(`${r}.unidad`, 'Rejilla', { opciones: [['semitono', 'semitonos'], ['cuarto', 'cuartos de tono']] })));
    } else if (c.tipo === 'espectro') {
      cuerpo.push(h('div', { class: 'fila' },
        entrada(`${r}.fundamental`, 'Fundamental'),
        entrada(`${r}.parciales`, 'Parciales', {}),
        entrada(`${r}.estiramiento`, 'Estiramiento', { tipo: 'number', numero: true, min: 0.5, max: 2, paso: 0.01 })));
      cuerpo.push(h('p', { class: 'ayuda' }, 'Cada parcial n suena a f·nᵉ; con e = 1 es armónico. Se redondea al cuarto de tono: pasa el puntero sobre una nota para ver su desviación.'));
    } else {
      cuerpo.push(entrada(`${r}.notas`, 'Alturas'));
    }
    return h('details', { class: 'tarjeta', 'data-tarjeta': `campo-${i}`, open: tarjetasAbiertas.has(`campo-${i}`) || proyecto.campos.length === 1 },
      h('summary', {},
        h('span', { class: 'tarjeta-tit' }, `${i + 1}. ${NOMBRE_CAMPO[c.tipo]}`),
        h('span', { class: 'tarjeta-res', 'data-campo-res': i }),
        h('button', { class: 'quitar', type: 'button', title: 'Quitar campo', 'aria-label': `Quitar campo ${i + 1}`, disabled: proyecto.campos.length < 2, onclick: quitar(proyecto.campos, i) }, '×')),
      cuerpo,
      entrada(`${r}.compases`, 'Dura (compases)', { tipo: 'number', numero: true, min: 1, clase: 'corto' }),
      h('p', { class: 'error-campo', 'data-error': r, hidden: true }),
      h('div', { class: 'campo-previa', 'data-campo': i }));
  });
  return paso('3', 'Campos', 'de dónde salen las alturas', pasosAbiertos.has('3'),
    entrada('transicion', 'Entre un campo y el siguiente', { opciones: [['corte', 'Corte: cambia de golpe'], ['interpolar', 'Interpolación: viaja poco a poco']] }),
    tarjetas,
    h('div', { class: 'acciones-anadir' },
      Object.entries(NOMBRE_CAMPO).map(([k, t]) => h('button', {
        class: 'boton-suave',
        type: 'button',
        onclick: () => {
          proyecto.campos.push(copiarProyecto(CAMPO_NUEVO[k]));
          tarjetasAbiertas.add(`campo-${proyecto.campos.length - 1}`);
          recordar();
          pintarPaneles();
          regenerar();
        },
      }, `+ ${t}`))));
}

const PROCESO_NUEVO = {
  subdivision: { desde: 0, hasta: 0.5, opciones: '3 5 7' },
  fusion: { desde: 0, hasta: 0.5 },
  rarefaccion: { desde: 0, hasta: 0.6 },
  cribaAtaques: { expresion: '3@0 | 5@1' },
  banda: { graveDesde: 'Do2', graveHasta: 'Sol3', agudoDesde: 'Do7', agudoHasta: 'La5', modo: 'silenciar' },
  transposicion: { desde: 0, hasta: 6.5 },
  compresion: { desde: 1, hasta: 0.5, eje: 'La4' },
  dinamica: { desde: -2, hasta: 2 },
};

const EXPLICA = {
  subdivision: 'Probabilidad de que una nota se divida en una tupla. Añade anidación con el tiempo.',
  fusion: 'Probabilidad de que un ataque se ligue con el anterior: la superficie se alarga.',
  rarefaccion: 'Fracción de ataques que callan. Los hilos siguen corriendo debajo.',
  cribaAtaques: 'Solo suenan los ataques cuyo número pasa la criba, dentro de la ventana.',
  banda: 'Un pasabanda que se mueve: lo que queda fuera calla o se pliega por octavas.',
  transposicion: 'Transposición en semitonos; 0,5 es un cuarto de tono.',
  compresion: 'Multiplica los intervalos respecto de un eje: 1 no cambia nada, 0 lo reúne todo en el eje.',
  dinamica: 'Desplaza la dinámica en grados (de ppp a fff).',
};

function panelProcesos() {
  const tarjetas = proyecto.procesos.map((q, i) => {
    const r = `procesos.${i}`;
    const cuerpo = [];
    if (q.tipo === 'banda') {
      cuerpo.push(h('div', { class: 'fila' }, entrada(`${r}.graveDesde`, 'Grave: de'), entrada(`${r}.graveHasta`, 'a')));
      cuerpo.push(h('div', { class: 'fila' }, entrada(`${r}.agudoDesde`, 'Agudo: de'), entrada(`${r}.agudoHasta`, 'a')));
      cuerpo.push(entrada(`${r}.modo`, 'Lo que queda fuera', { opciones: [['silenciar', 'calla'], ['plegar', 'se pliega por octavas']] }));
    } else if (q.tipo === 'cribaAtaques') {
      cuerpo.push(entrada(`${r}.expresion`, 'Criba', { ayuda: 'Misma sintaxis que las cribas de alturas, aplicada al número de ataque.' }));
    } else {
      cuerpo.push(h('div', { class: 'fila' },
        entrada(`${r}.desde`, 'De', { tipo: 'number', numero: true, paso: 0.05 }),
        entrada(`${r}.hasta`, 'A', { tipo: 'number', numero: true, paso: 0.05 })));
    }
    if (q.tipo === 'subdivision') cuerpo.push(entrada(`${r}.opciones`, 'Divisiones posibles'));
    if (q.tipo === 'compresion') cuerpo.push(entrada(`${r}.eje`, 'Eje'));
    const destinos = proyecto.voces.map((v, iv) => {
      const marcada = q.voces === 'todas' || (Array.isArray(q.voces) && q.voces.includes(iv));
      return h('label', { class: 'casilla' },
        h('input', {
          type: 'checkbox',
          checked: marcada,
          onchange: (e) => {
            const actuales = q.voces === 'todas' ? proyecto.voces.map((_, x) => x) : [...q.voces];
            const nuevas = e.target.checked ? [...new Set([...actuales, iv])] : actuales.filter((x) => x !== iv);
            q.voces = nuevas.length === proyecto.voces.length ? 'todas' : nuevas;
            recordar();
            regenerar();
          },
        }), v.nombre);
    });
    return h('details', { class: 'tarjeta', 'data-tarjeta': `proc-${i}`, open: tarjetasAbiertas.has(`proc-${i}`) },
      h('summary', {},
        h('span', { class: 'tarjeta-tit' }, TIPOS_PROCESO[q.tipo]),
        h('span', { class: 'proc-curva', 'data-curva': i }),
        h('button', { class: 'quitar', type: 'button', title: 'Quitar proceso', 'aria-label': `Quitar ${TIPOS_PROCESO[q.tipo]}`, onclick: quitar(proyecto.procesos, i) }, '×')),
      h('p', { class: 'guia' }, EXPLICA[q.tipo]),
      cuerpo,
      h('div', { class: 'fila' },
        entrada(`${r}.inicio`, 'Empieza (0–1)', { tipo: 'number', numero: true, min: 0, max: 1, paso: 0.05 }),
        entrada(`${r}.fin`, 'Termina (0–1)', { tipo: 'number', numero: true, min: 0, max: 1, paso: 0.05 }),
        entrada(`${r}.forma`, 'Curva', { opciones: [['lineal', 'lineal'], ['exponencial', 'exponencial'], ['campana', 'campana']] })),
      h('div', { class: 'casillas', role: 'group', 'aria-label': 'Voces afectadas' }, destinos));
  });
  return paso('4', 'Procesos', 'filtros y transformaciones en el tiempo', pasosAbiertos.has('4'),
    h('p', { class: 'guia' }, 'Los procesos rítmicos actúan primero. Los demás se aplican en este orden, de arriba abajo.'),
    tarjetas.length ? tarjetas : h('p', { class: 'ayuda' }, 'Aún no hay procesos: el material se repite igual de principio a fin.'),
    h('div', { class: 'acciones-anadir' },
      h('label', { for: 'nuevo-proceso', class: 'visual-oculto' }, 'Proceso nuevo'),
      h('select', { id: 'nuevo-proceso', class: 'selector-nuevo' }, Object.entries(TIPOS_PROCESO).map(([k, t]) => h('option', { value: k }, t))),
      h('button', {
        class: 'boton-suave',
        type: 'button',
        onclick: () => {
          const tipo = $('nuevo-proceso').value;
          proyecto.procesos.push({ tipo, voces: 'todas', inicio: 0, fin: 1, forma: 'lineal', ...copiarProyecto(PROCESO_NUEVO[tipo]) });
          tarjetasAbiertas.add(`proc-${proyecto.procesos.length - 1}`);
          recordar();
          pintarPaneles();
          regenerar();
        },
      }, '+ Añadir proceso')));
}

/* ---------- Vistas previas de los paneles ---------- */

function actualizarPrevias() {
  proyecto.voces.forEach((v, i) => {
    const caja = document.querySelector(`[data-tiras="${i}"]`);
    if (caja) {
      try {
        caja.innerHTML = leerPatrones(v.ritmo.patrones).map((p) => dibujarTira(p)).join('');
      } catch (e) {
        if (!(e instanceof ErrorTelar)) throw e;
      }
    }
    const res = document.querySelector(`[data-periodos="${i}"]`);
    if (res) {
      const p = periodosDe(v);
      res.textContent = p.comun ? `${[p.altura, p.densidad, p.dinamica, p.articulacion].join('·')} → ${p.comun}` : 'por tiempo';
      res.title = p.comun ? `Periodos de altura, densidad, dinámica y articulación. Los cuatro se realinean cada ${p.comun} ataques.` : 'Algún hilo avanza por tiempo';
    }
  });
  proyecto.campos.forEach((c, i) => {
    const caja = document.querySelector(`[data-campo="${i}"]`);
    const res = document.querySelector(`[data-campo-res="${i}"]`);
    if (!caja) return;
    try {
      const notas = evaluarCampo(c);
      let extra = '';
      if (c.tipo === 'criba') extra = ` · periodo ${leerCriba(c.expresion).periodo}`;
      caja.innerHTML = grabarCampo(notas);
      if (res) res.textContent = `${notas.length} alturas · ${nombreAltura(notas[0].q)}–${nombreAltura(notas[notas.length - 1].q)}${extra}`;
    } catch (e) {
      if (!(e instanceof ErrorTelar)) throw e;
      if (res) res.textContent = '';
    }
  });
  proyecto.procesos.forEach((q, i) => {
    const caja = document.querySelector(`[data-curva="${i}"]`);
    if (caja) caja.innerHTML = dibujarCurva(q, curvaProceso, 90, 22);
  });
}

function marcarErrores(errores = validar(proyecto)) {
  document.querySelectorAll('[data-error]').forEach((e) => { e.hidden = true; e.textContent = ''; });
  document.querySelectorAll('[aria-invalid]').forEach((e) => e.removeAttribute('aria-invalid'));
  for (const err of errores) {
    const caja = document.querySelector(`[data-error="${err.ruta}"]`);
    if (caja) { caja.hidden = false; caja.textContent = err.mensaje; }
    const control = document.querySelector(`[data-ruta="${err.ruta}"]`);
    if (control) control.setAttribute('aria-invalid', 'true');
  }
  const aviso = $('aviso-errores');
  if (errores.length) {
    aviso.hidden = false;
    aviso.textContent = `Hay ${errores.length === 1 ? 'un error' : `${errores.length} errores`}: ${errores[0].mensaje}. La partitura muestra el último resultado válido.`;
  } else {
    aviso.hidden = true;
  }
}

/* ---------- Generación ---------- */

function programarRegeneracion() {
  clearTimeout(temporizador);
  temporizador = setTimeout(regenerar, 120);
}

function regenerar() {
  clearTimeout(temporizador);
  actualizarPrevias();
  const errores = validar(proyecto);
  marcarErrores(errores);
  guardar();
  if (errores.length) return;
  try {
    partitura = generar(proyecto);
  } catch (e) {
    if (!(e instanceof ErrorTelar)) throw e;
    marcarErrores([{ ruta: e.ruta ?? '', mensaje: e.message }]);
    return;
  }
  pintarTela();
  pintarEstado();
}

function pintarTela() {
  if (!partitura) return;
  const cont = $('tela');
  const ancho = Math.max(620, cont.clientWidth - 24);
  const g = grabar(partitura, { ancho, s: zoom });
  vista = g;
  $('vista-partitura').innerHTML = `<div class="hoja">${g.svg}<div class="cursor" id="cursor" hidden></div></div>`;
  $('vista-tejido').innerHTML = dibujarTejido(partitura, proyecto);
}

function pintarEstado() {
  const seg = Math.round(partitura.segundos);
  const irr = partitura.compases.some((c) => c.irracional);
  $('estado').textContent = `${partitura.compases.length} compases · ${partitura.voces.length} ${partitura.voces.length === 1 ? 'voz' : 'voces'} · ${partitura.ataques} ataques · ${Math.floor(seg / 60)}′${String(seg % 60).padStart(2, '0')}″${irr ? ' · con compases irracionales' : ''}`;
  const av = $('avisos');
  av.replaceChildren(...partitura.avisos.map((t) => h('li', {}, t)));
  av.hidden = !partitura.avisos.length;
  const reproducir = $('voces-audio');
  reproducir.replaceChildren(...partitura.voces.map((v) => h('label', { class: 'casilla' },
    h('input', {
      type: 'checkbox',
      checked: !silenciadas.has(v.indice),
      onchange: (e) => { if (e.target.checked) silenciadas.delete(v.indice); else silenciadas.add(v.indice); },
    }), v.nombre)));
}

/* ---------- Reproducción ---------- */

const reproductor = new Reproductor({
  alAvanzar: (t) => moverCursor(t),
  alTerminar: () => finReproduccion(),
});

function moverCursor(t) {
  const c = $('cursor');
  if (!c || !vista.mapa.length) return;
  for (const sistema of vista.mapa) {
    const pts = sistema.puntos;
    if (t <= pts[pts.length - 1].t) {
      let i = 0;
      while (i < pts.length - 2 && pts[i + 1].t < t) i++;
      const a = pts[i], b = pts[i + 1] ?? a;
      const x = a.x + (b.t > a.t ? ((t - a.t) / (b.t - a.t)) * (b.x - a.x) : 0);
      c.hidden = false;
      c.style.left = `${x}px`;
      c.style.top = `${sistema.arriba}px`;
      c.style.height = `${sistema.abajo - sistema.arriba}px`;
      const hoja = $('tela');
      const r = c.getBoundingClientRect(), rh = hoja.getBoundingClientRect();
      if (r.top < rh.top || r.bottom > rh.bottom) hoja.scrollTop += r.top - rh.top - 30;
      return;
    }
  }
}

function finReproduccion() {
  $('tocar').textContent = '▶ Escuchar';
  $('tocar').setAttribute('aria-pressed', 'false');
  const c = $('cursor');
  if (c) c.hidden = true;
}

async function alternarReproduccion() {
  if (reproductor.activo) {
    reproductor.parar();
    finReproduccion();
    return;
  }
  if (!partitura) return;
  try {
    await reproductor.tocar(partitura, silenciadas);
    $('tocar').textContent = '■ Parar';
    $('tocar').setAttribute('aria-pressed', 'true');
  } catch (e) {
    $('estado').textContent = e.message;
  }
}

/* ---------- Archivos ---------- */

const nombreArchivo = (ext) => `${(proyecto.titulo || 'telar').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w-]+/g, '-').toLowerCase()}.${ext}`;

function descargar(contenido, ext, tipo) {
  const url = URL.createObjectURL(new Blob([contenido], { type: tipo }));
  const a = h('a', { href: url, download: nombreArchivo(ext) });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function exportar(formato) {
  if (!partitura) return;
  if (formato === 'ly') {
    descargar(exportarLilyPond(partitura), 'ly', 'text/plain;charset=utf-8');
  } else if (formato === 'xml') {
    descargar(exportarMusicXML(partitura), 'musicxml', 'application/vnd.recordare.musicxml+xml');
  } else if (formato === 'mid') {
    const m = exportarMIDI(partitura);
    descargar(m.bytes, 'mid', 'audio/midi');
    const notas = [];
    if (m.irracionales) notas.push('el MIDI no admite compases irracionales: van como marcadores de texto');
    if (!m.exacta) notas.push(`resolución ${m.ppq}: algunos ataques se redondean al tick más cercano`);
    $('nota-export').textContent = notas.length ? `MIDI: ${notas.join('; ')}.` : '';
  } else if (formato === 'json') {
    descargar(JSON.stringify(proyecto, null, 2), 'telar.json', 'application/json');
  }
}

async function abrirArchivo(archivo) {
  try {
    const p = JSON.parse(await archivo.text());
    if (p?.version !== 1 || !Array.isArray(p.voces) || !Array.isArray(p.campos) || !Array.isArray(p.procesos) || !p.tiempo) {
      throw new Error('no es un proyecto de Telar');
    }
    proyecto = p;
    recordar();
    pintarPaneles();
    regenerar();
  } catch (e) {
    const aviso = $('aviso-errores');
    aviso.hidden = false;
    aviso.textContent = `No se pudo abrir «${archivo.name}»: ${e.message}.`;
  }
}

/* ---------- Arranque ---------- */

function cargarEjemplo(clave) {
  proyecto = copiarProyecto(EJEMPLOS[clave].proyecto);
  tarjetasAbiertas.clear();
  tarjetasAbiertas.add('voz-0');
  recordar();
  pintarPaneles();
  regenerar();
}

/* ---------- Tema ---------- */

const CLAVE_TEMA = 'telar.tema';

function aplicarTema(tema) {
  document.documentElement.dataset.theme = tema;
  $('tema').setAttribute('aria-checked', String(tema === 'dark'));
}

function iniciarTema() {
  aplicarTema(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
  $('tema').addEventListener('click', () => {
    const tema = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    aplicarTema(tema);
    try { localStorage.setItem(CLAVE_TEMA, tema); } catch { /* sin almacenamiento */ }
  });
  // Mientras no se elija a mano, sigue al sistema.
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    let elegido = null;
    try { elegido = localStorage.getItem(CLAVE_TEMA); } catch { /* sin almacenamiento */ }
    if (!elegido) aplicarTema(e.matches ? 'dark' : 'light');
  });
}

function iniciar() {
  iniciarTema();
  const selector = $('ejemplos');
  selector.append(...Object.entries(EJEMPLOS).map(([k, e]) => h('option', { value: k }, e.nombre)));
  selector.addEventListener('change', (e) => {
    if (e.target.value) cargarEjemplo(e.target.value);
    e.target.value = '';
  });

  $('titulo-pieza').addEventListener('input', (e) => { proyecto.titulo = e.target.value; programarRegeneracion(); });
  $('titulo-pieza').addEventListener('change', recordar);
  $('semilla').addEventListener('input', (e) => { proyecto.semilla = Number(e.target.value) || 0; programarRegeneracion(); });
  $('semilla').addEventListener('change', recordar);
  $('dado').addEventListener('click', () => {
    proyecto.semilla = Math.floor(Math.random() * 9999) + 1;
    $('semilla').value = proyecto.semilla;
    recordar();
    regenerar();
  });
  $('tocar').addEventListener('click', alternarReproduccion);
  $('deshacer').addEventListener('click', () => {
    if (historial.length < 2) return;
    rehacer.push(historial.pop());
    restaurar(historial[historial.length - 1]);
  });
  $('rehacer').addEventListener('click', () => {
    if (!rehacer.length) return;
    const foto = rehacer.pop();
    historial.push(foto);
    restaurar(foto);
  });
  document.querySelectorAll('[data-exportar]').forEach((b) => b.addEventListener('click', () => exportar(b.dataset.exportar)));
  $('abrir').addEventListener('change', (e) => {
    if (e.target.files[0]) abrirArchivo(e.target.files[0]);
    e.target.value = '';
  });
  $('zoom').addEventListener('input', (e) => { zoom = Number(e.target.value); pintarTela(); });
  document.querySelectorAll('[data-vista]').forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll('[data-vista]').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
    $('vista-partitura').hidden = b.dataset.vista !== 'partitura';
    $('vista-tejido').hidden = b.dataset.vista !== 'tejido';
  }));
  let espera;
  window.addEventListener('resize', () => {
    clearTimeout(espera);
    espera = setTimeout(pintarTela, 150);
  });

  proyecto = cargarGuardado() ?? copiarProyecto(EJEMPLOS[EJEMPLO_INICIAL].proyecto);
  recordar();
  pintarPaneles();
  regenerar();
  // La medida de los glifos no depende de la fuente, pero el primer pintado sí.
  document.fonts?.load('20px TelarLeland', '').then(() => {
    if (!document.fonts.check('20px TelarLeland', '')) {
      const aviso = $('aviso-errores');
      aviso.hidden = false;
      aviso.textContent = 'No se pudo cargar la fuente musical Leland: la notación no se verá bien.';
    }
    pintarTela();
  });
}

iniciar();
