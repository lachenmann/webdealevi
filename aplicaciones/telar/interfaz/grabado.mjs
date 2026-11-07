// Grabado propio en SVG: compone la partitura a partir de las figuras escritas.
// Función pura (devuelve texto), así que también puede probarse fuera del navegador.
// Los glifos son de Leland (SMuFL); 1 em = 4 espacios de pentagrama.

import { nombreAltura } from '../nucleo/armonia.mjs';

const G = {
  claveSol: '', claveDo: '', claveFa: '',
  redonda: '', blanca: '', negra: '', puntillo: '',
};
const DIGITO = (d) => String.fromCharCode(0xe080 + d);
const CORCHETE = { 8: ['', ''], 16: ['', ''], 32: ['', ''], 64: ['', ''], 128: ['', ''] };
const SILENCIO = { 1: '', 2: '', 4: '', 8: '', 16: '', 32: '', 64: '', 128: '' };
const ALTERACION = { 0: '', 1: '', '-1': '', 0.5: '', '-0.5': '', 1.5: '', '-1.5': '' };
const ARTICULACION = {
  acento: ['', ''], staccato: ['', ''], tenuto: ['', ''],
  staccatissimo: ['', ''], marcato: ['', ''],
};
const LETRA_DINAMICA = { p: '', m: '', f: '' };

const LINEA_SUPERIOR = { sol: 38, fa: 26, do3: 32 }; // índice diatónico de la línea superior

const n2 = (x) => (Math.round(x * 100) / 100).toString();
const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* ---------- Espaciado ---------- */

/** Anchura mínima que una figura necesita hasta la siguiente de su voz. */
function anchoFigura(f, s) {
  let a = 1.5 * s + f.puntos * 0.65 * s;
  if (!f.silencio && !f.haz && f.valor >= 8) a += 1.1 * s;
  return a;
}

const anchoAlteraciones = (f, s) => {
  const n = f.notas ? f.notas.filter((x) => x.signo !== null).length : 0;
  return n ? (1.35 + (n > 1 ? 0.9 : 0)) * s : 0;
};

function medirCompas(voces, im, s) {
  const c = voces[0].medidas[im].compas;
  const claves = new Map();
  const fin = c.inicio.mas(c.real);
  for (const v of voces) {
    for (const f of v.medidas[im].figuras) {
      const k = f.inicio.toString();
      if (!claves.has(k)) claves.set(k, f.inicio);
    }
  }
  const columnas = [...claves.values()].sort((a, b) => a.cmp(b));
  const indice = new Map(columnas.map((t, i) => [t.toString(), i]));
  // Sangría inicial: las alteraciones de la primera columna no tocan la barra.
  let ini = 1.1 * s;
  for (const v of voces) {
    const pri = v.medidas[im].figuras[0];
    ini = Math.max(ini, 0.9 * s + anchoAlteraciones(pri, s));
  }
  const xs = new Array(columnas.length).fill(0);
  const exigencias = columnas.map(() => []);
  for (const v of voces) {
    const figs = v.medidas[im].figuras;
    figs.forEach((f, i) => {
      const sig = figs[i + 1];
      const d = anchoFigura(f, s) + (sig ? anchoAlteraciones(sig, s) : 0);
      if (sig) exigencias[indice.get(sig.inicio.toString())].push([indice.get(f.inicio.toString()), d]);
    });
  }
  xs[0] = ini;
  for (let i = 1; i < columnas.length; i++) {
    const dt = columnas[i].menos(columnas[i - 1]).aNumero();
    let x = xs[i - 1] + s * (0.5 + 8.5 * Math.sqrt(dt));
    for (const [j, d] of exigencias[i]) x = Math.max(x, xs[j] + d);
    xs[i] = x;
  }
  let ancho = xs[xs.length - 1] + s * (0.5 + 8.5 * Math.sqrt(fin.menos(columnas[columnas.length - 1]).aNumero()));
  for (const v of voces) {
    const figs = v.medidas[im].figuras;
    const ult = figs[figs.length - 1];
    ancho = Math.max(ancho, xs[indice.get(ult.inicio.toString())] + anchoFigura(ult, s) + 0.5 * s);
  }
  return { columnas, indice, xs, ancho, fin };
}

/* ---------- Compás escrito ---------- */

function cifraCompas(c, x, s) {
  const fila = (texto, y) => `<text x="${n2(x)}" y="${n2(y)}" font-size="${4 * s}" text-anchor="middle" class="m">${[...String(texto)].map((d) => DIGITO(Number(d))).join('')}</text>`;
  return fila(c.num, s) + fila(c.den, 3 * s);
}
const anchoCifra = (c, s) => Math.max(String(c.num).length, String(c.den).length) * 1.75 * s + 0.9 * s;

/* ---------- Una voz en un sistema ---------- */

function grabarVoz(v, sistema, s, x0) {
  const superior = LINEA_SUPERIOR[v.instrumento.clave];
  const yDe = (d) => ((superior - d) * s) / 2;
  const trazos = [];
  let techo = 0;
  let suelo = 4 * s;
  const marcar = (a, b = a) => { techo = Math.min(techo, a, b); suelo = Math.max(suelo, a, b); };
  const texto = (g, x, y, tam = 4 * s, extra = '') => trazos.push(`<text x="${n2(x)}" y="${n2(y)}" font-size="${n2(tam)}" class="m"${extra}>${g}</text>`);
  const linea = (x1, y1, x2, y2, w) => trazos.push(`<line x1="${n2(x1)}" y1="${n2(y1)}" x2="${n2(x2)}" y2="${n2(y2)}" stroke-width="${n2(w)}"/>`);

  const cabeza = 1.18 * s;
  const colocadas = [];

  for (const mf of sistema.medidas) {
    const figs = v.medidas[mf.im].figuras;
    const xDeFig = (f) => mf.x + mf.xs[mf.indice.get(f.inicio.toString())] * mf.escala;
    const haces = new Map();

    for (const f of figs) {
      const x = x0 + xDeFig(f);
      const item = { f, x, im: mf.im };
      colocadas.push(item);
      if (f.silencio) {
        const y = f.valor === 1 ? s : 2 * s;
        texto(SILENCIO[f.valor], x, y);
        for (let p = 0; p < f.puntos; p++) texto(G.puntillo, x + 1.5 * s + p * 0.5 * s, 1.5 * s);
        item.top = y - 1.2 * s;
        item.fondo = y + 1.2 * s;
        if (f.haz) {
          if (!haces.has(f.haz.id)) haces.set(f.haz.id, []);
          haces.get(f.haz.id).push(item);
        }
        continue;
      }
      item.ys = f.notas.map((n) => yDe(n.diatonico));
      const media = item.ys.reduce((a, b) => a + b, 0) / item.ys.length;
      item.arriba = media >= 2 * s;
      if (f.haz) {
        if (!haces.has(f.haz.id)) haces.set(f.haz.id, []);
        haces.get(f.haz.id).push(item);
      }
    }

    // Una dirección por haz.
    for (const grupo of haces.values()) {
      const con = grupo.filter((i) => !i.f.silencio);
      const m = con.flatMap((i) => i.ys).reduce((a, b) => a + b, 0) / con.flatMap((i) => i.ys).length;
      grupo.forEach((i) => { i.arriba = m >= 2 * s; });
    }

    for (const item of colocadas.filter((i) => i.im === mf.im && !i.f.silencio)) dibujarNotas(item);
    for (const grupo of haces.values()) dibujarHaz(grupo);
    for (const item of colocadas.filter((i) => i.im === mf.im && !i.f.silencio)) {
      if (!item.f.haz) dibujarPlica(item);
      dibujarSignos(item);
    }
    dibujarTuplas(colocadas.filter((i) => i.im === mf.im));
  }

  function dibujarNotas(item) {
    const { f, x, ys, arriba } = item;
    const glifo = f.valor === 1 ? G.redonda : f.valor === 2 ? G.blanca : G.negra;
    const orden = f.notas.map((n, i) => ({ n, y: ys[i] })).sort((a, b) => b.y - a.y); // de grave a agudo
    if (!arriba) orden.reverse();
    let previa = null;
    let desplazada = false;
    const cuerpos = [];
    const titulo = `<title>${esc(f.notas.map((n) => nombreAltura(n.q)).join(' + '))} · ${f.real}${f.dinamica ? ` · ${f.dinamica}` : ''}</title>`;
    for (const o of orden) {
      desplazada = previa !== null && Math.abs(o.y - previa) <= s / 2 && !desplazada;
      const dx = desplazada ? (arriba ? cabeza : -cabeza) : 0;
      o.x = x + dx;
      cuerpos.push(`<text x="${n2(o.x)}" y="${n2(o.y)}" font-size="${4 * s}" class="m">${glifo}</text>`);
      previa = o.y;
      // Líneas adicionales.
      const anchoL = cabeza + 0.5 * s;
      for (let yl = -s; yl >= o.y - 0.01; yl -= s) linea(o.x - 0.25 * s, yl, o.x - 0.25 * s + anchoL, yl, 0.13 * s);
      for (let yl = 5 * s; yl <= o.y + 0.01; yl += s) linea(o.x - 0.25 * s, yl, o.x - 0.25 * s + anchoL, yl, 0.13 * s);
      for (let p = 0; p < f.puntos; p++) {
        const enLinea = Math.abs(((o.y / s) % 1)) < 0.01;
        texto(G.puntillo, x + cabeza + 0.45 * s + p * 0.5 * s + (desplazada && arriba ? cabeza : 0), o.y - (enLinea ? s / 2 : 0));
      }
      marcar(o.y - 0.6 * s, o.y + 0.6 * s);
    }
    trazos.push(`<g>${titulo}${cuerpos.join('')}</g>`);
    // Alteraciones, de agudo a grave, en columnas si chocan.
    const conSigno = f.notas.map((n, i) => ({ n, y: ys[i] })).filter((o) => o.n.signo !== null).sort((a, b) => a.y - b.y);
    const columnas = [];
    for (const o of conSigno) {
      let c = 0;
      while (columnas[c] !== undefined && Math.abs(o.y - columnas[c]) < 2.6 * s) c++;
      columnas[c] = o.y;
      texto(ALTERACION[o.n.signo], x - 0.3 * s - 1.05 * s - c * 1.05 * s, o.y);
    }
    item.xPlica = arriba ? x + cabeza - 0.06 * s : x + 0.06 * s;
    item.yExtremoCabeza = arriba ? Math.max(...ys) : Math.min(...ys);
    item.yPuntaCabeza = arriba ? Math.min(...ys) : Math.max(...ys);
  }

  function dibujarPlica(item) {
    const { f, arriba, xPlica, yExtremoCabeza, yPuntaCabeza } = item;
    if (f.valor === 1) {
      item.top = Math.min(...item.ys) - 0.6 * s;
      item.fondo = Math.max(...item.ys) + 0.6 * s;
      return;
    }
    const extra = f.valor >= 32 ? (Math.log2(f.valor) - 4) * 0.8 * s : 0;
    let punta = arriba ? yPuntaCabeza - 3.5 * s - extra : yPuntaCabeza + 3.5 * s + extra;
    // La plica de una nota lejana alcanza la línea central.
    punta = arriba ? Math.min(punta, 2 * s) : Math.max(punta, 2 * s);
    linea(xPlica, yExtremoCabeza, xPlica, punta, 0.13 * s);
    if (f.valor >= 8) texto(CORCHETE[f.valor][arriba ? 0 : 1], xPlica - 0.06 * s, punta);
    item.top = Math.min(punta, ...item.ys) - (arriba ? 0 : 0.6 * s);
    item.fondo = Math.max(punta, ...item.ys) + (arriba ? 0.6 * s : 0);
    marcar(item.top, item.fondo);
  }

  function dibujarHaz(grupo) {
    const con = grupo.filter((i) => !i.f.silencio);
    const arriba = con[0].arriba;
    grupo.forEach((i) => {
      if (i.f.silencio) i.xPlica = arriba ? i.x + cabeza : i.x;
    });
    const maxNiv = Math.max(...grupo.map((i) => Math.log2(i.f.valor) - 2));
    const ALT = 3.25 * s + (maxNiv - 1) * 0.75 * s;
    const a = con[0], b = con[con.length - 1];
    const dx = b.xPlica - a.xPlica || 1;
    let yA = arriba ? a.yPuntaCabeza - ALT : a.yPuntaCabeza + ALT;
    let yB = arriba ? b.yPuntaCabeza - ALT : b.yPuntaCabeza + ALT;
    const limite = Math.min(1.2 * s, Math.abs(dx) * 0.2);
    if (Math.abs(yB - yA) > limite) yB = yA + Math.sign(yB - yA) * limite;
    const yEn = (x) => yA + ((yB - yA) * (x - a.xPlica)) / dx;
    // Todas las plicas deben alcanzar su longitud mínima.
    let ajuste = 0;
    for (const i of con) {
      const y = yEn(i.xPlica);
      const min = (Math.log2(i.f.valor) - 2 - 1) * 0.75 * s + 2.5 * s;
      const falta = arriba ? y - (i.yPuntaCabeza - min) : (i.yPuntaCabeza + min) - y;
      if (falta > ajuste) ajuste = falta;
    }
    const d = arriba ? -ajuste : ajuste;
    // Y las notas lejanas llegan a la línea central.
    let centro = 0;
    for (const i of con) {
      const y = yEn(i.xPlica) + d;
      const f2 = arriba ? y - 2 * s : 2 * s - y;
      if (f2 > centro) centro = f2;
    }
    const total = d + (arriba ? -centro : centro);
    const yFinal = (x) => yEn(x) + total;
    for (const i of con) {
      linea(i.xPlica, i.yExtremoCabeza, i.xPlica, yFinal(i.xPlica), 0.13 * s);
      const y = yFinal(i.xPlica);
      i.top = Math.min(y, ...i.ys) - (arriba ? 0 : 0.6 * s);
      i.fondo = Math.max(y, ...i.ys) + (arriba ? 0.6 * s : 0);
      marcar(i.top, i.fondo);
    }
    const grosor = 0.5 * s;
    const barra = (x1, x2, nivel) => {
      const off = (nivel - 1) * 0.75 * s * (arriba ? 1 : -1);
      const y1 = yFinal(x1) + off, y2 = yFinal(x2) + off;
      const g = arriba ? grosor : -grosor;
      trazos.push(`<polygon points="${n2(x1)},${n2(y1)} ${n2(x2)},${n2(y2)} ${n2(x2)},${n2(y2 + g)} ${n2(x1)},${n2(y1 + g)}"/>`);
    };
    for (let nivel = 1; nivel <= maxNiv; nivel++) {
      let ini = null;
      for (const i of grupo) {
        const est = i.f.haz.niveles[nivel];
        if (est === 'empieza') ini = i.xPlica;
        else if (est === 'termina') { barra(ini, i.xPlica, nivel); ini = null; }
        else if (est === 'gancho-der') barra(i.xPlica, i.xPlica + 1.1 * s, nivel);
        else if (est === 'gancho-izq') barra(i.xPlica - 1.1 * s, i.xPlica, nivel);
      }
    }
  }

  function dibujarSignos(item) {
    const { f, x, arriba, ys } = item;
    if (f.articulacion) {
      const [enc, deb] = ARTICULACION[f.articulacion];
      const cx = x + cabeza / 2;
      if (arriba) {
        let y = Math.max(...ys) + 1.1 * s;
        if (y < 4.6 * s && y > -0.4 * s && Math.abs((y / s) % 1) < 0.01) y += 0.5 * s;
        texto(deb, cx, y, 4 * s, ' text-anchor="middle"');
        marcar(y + 0.8 * s);
        item.fondo = Math.max(item.fondo, y + 0.8 * s);
      } else {
        let y = Math.min(...ys) - 1.1 * s;
        if (y < 4.6 * s && y > -0.4 * s && Math.abs((y / s) % 1) < 0.01) y -= 0.5 * s;
        texto(enc, cx, y, 4 * s, ' text-anchor="middle"');
        marcar(y - 0.8 * s);
        item.top = Math.min(item.top, y - 0.8 * s);
      }
    }
  }

  function dibujarTuplas(items) {
    const pila = [];
    const hechas = new Map();
    for (const it of items) {
      const f = it.f;
      for (const t of f.abreTuplas) pila.push({ t, items: [] });
      for (const nivel of pila) nivel.items.push(it);
      for (let k = 0; k < f.cierraTuplas; k++) {
        const { t, items: dentro } = pila.pop();
        // Las interiores se cierran antes: su altura ya es conocida.
        let cima = Math.min(-0.3 * s, ...dentro.map((i) => i.top ?? 0));
        for (const [otra, y] of hechas) {
          if (otra.nivel > t.nivel && dentro.includes(otra.primero)) cima = Math.min(cima, y);
        }
        const y = cima - 1.7 * s;
        t.primero = dentro[0];
        hechas.set(t, y);
        const xa = dentro[0].x - 0.3 * s;
        const ult = dentro[dentro.length - 1];
        const xb = ult.x + cabeza + 0.35 * s;
        const rotulo = t.incompleta || !tuplaEstandarLocal(t) ? `${t.actual}:${t.normal}` : `${t.actual}`;
        const anchoR = rotulo.length * 0.62 * s + 0.5 * s;
        const medio = (xa + xb) / 2;
        const gancho = 0.55 * s;
        if (xb - xa > anchoR + 0.6 * s) {
          trazos.push(`<path class="t" d="M${n2(xa)} ${n2(y + gancho)}V${n2(y)}H${n2(medio - anchoR / 2)}M${n2(medio + anchoR / 2)} ${n2(y)}H${n2(xb)}V${n2(y + gancho)}" stroke-width="${n2(0.11 * s)}"/>`);
        }
        trazos.push(`<text x="${n2(medio)}" y="${n2(y + 0.42 * s)}" font-size="${n2(1.25 * s)}" text-anchor="middle" class="tn">${rotulo}</text>`);
        marcar(y - 0.4 * s);
      }
    }
  }

  // Ligaduras y dinámicas, una vez conocidas todas las posiciones.
  colocadas.forEach((it, i) => {
    const f = it.f;
    if (f.silencio) return;
    if (f.ligaSale) {
      const sig = colocadas[i + 1];
      const finX = sig ? sig.x : sistema.xFin + x0;
      f.notas.forEach((n, k) => dibujarLigadura(it.x + cabeza + 0.1 * s, finX - 0.1 * s, it.ys[k], it.arriba, k, f.notas.length));
    }
    if (f.ligaEntra && i === 0) {
      f.notas.forEach((n, k) => dibujarLigadura(it.x - 2 * s, it.x - 0.1 * s, it.ys[k], it.arriba, k, f.notas.length));
    }
  });

  function dibujarLigadura(xa, xb, y, arriba, k, total) {
    const haciaAbajo = total > 1 ? k < total / 2 : arriba;
    const sgn = haciaAbajo ? 1 : -1;
    const y0 = y + sgn * 0.55 * s;
    const alto = Math.min(1.1 * s, 0.35 * s + (xb - xa) * 0.05) * sgn;
    trazos.push(`<path d="M${n2(xa)} ${n2(y0)}Q${n2((xa + xb) / 2)} ${n2(y0 + alto * 1.4)} ${n2(xb)} ${n2(y0)}Q${n2((xa + xb) / 2)} ${n2(y0 + alto)} ${n2(xa)} ${n2(y0)}Z"/>`);
    marcar(y0 + alto);
  }

  const sueloNotas = suelo;
  for (const it of colocadas) {
    const din = it.f.dinamica;
    if (!din) continue;
    const y = Math.max(sueloNotas, 4 * s) + 1.9 * s;
    trazos.push(`<text x="${n2(it.x - 0.3 * s)}" y="${n2(y)}" font-size="${n2(3.2 * s)}" class="m">${[...din].map((c) => LETRA_DINAMICA[c]).join('')}</text>`);
    marcar(y + 0.6 * s);
  }

  return { contenido: trazos.join(''), techo, suelo, colocadas };
}

const tuplaEstandarLocal = ({ actual, normal }) => {
  let p = 1;
  while (p * 2 <= actual) p *= 2;
  return p === normal && actual !== normal;
};

/* ---------- Partitura completa ---------- */

export function grabar(part, { ancho = 1000, s = 7, sinCifras = false } = {}) {
  const margenIzq = 12;
  const voces = part.voces;
  const rotuloAncho = Math.max(4, ...voces.map((v) => v.nombre.length)) * 0.95 * s + 1.2 * s;
  const medidas = part.compases.map((c, im) => {
    const m = medirCompas(voces, im, s);
    const previo = part.compases[im - 1];
    const cambia = !sinCifras && (!previo || previo.etiqueta !== c.etiqueta);
    return { ...m, im, c, cambia, cifra: cambia ? anchoCifra(c, s) : 0 };
  });

  // Reparto en sistemas.
  const util = ancho - margenIzq - rotuloAncho - 3.6 * s - 8;
  const sistemas = [];
  let actual = [];
  let usado = 0;
  for (const m of medidas) {
    const w = m.ancho + m.cifra;
    if (actual.length && usado + w > util) {
      sistemas.push(actual);
      actual = [];
      usado = 0;
    }
    actual.push(m);
    usado += w;
  }
  if (actual.length) sistemas.push(actual);

  const salida = [];
  const mapa = [];
  let y = 8;
  let anchoTotal = ancho;
  const claveGlifo = { sol: [G.claveSol, 3], fa: [G.claveFa, 1], do3: [G.claveDo, 2] };

  sistemas.forEach((ms, is) => {
    const ultimo = is === sistemas.length - 1;
    const libres = util - ms.reduce((a, m) => a + m.cifra, 0);
    const bruto = ms.reduce((a, m) => a + m.ancho, 0);
    // Nunca se comprime: si un compás no cabe, la hoja se ensancha y se desplaza.
    const escala = Math.max(1, ultimo ? Math.min(libres / bruto, 1.25) : libres / bruto);
    const x0 = margenIzq + rotuloAncho;
    const xInicioMusica = 3.6 * s;
    let cursor = xInicioMusica;
    const sistema = { medidas: [] };
    for (const m of ms) {
      const xCifra = cursor;
      cursor += m.cifra;
      sistema.medidas.push({ im: m.im, x: cursor, xs: m.xs, indice: m.indice, escala, c: m.c, cambia: m.cambia, xCifra, cifra: m.cifra, ancho: m.ancho * escala });
      cursor += m.ancho * escala;
    }
    sistema.xFin = cursor;
    anchoTotal = Math.max(anchoTotal, x0 + cursor + 8);

    // Cada voz se compone en coordenadas locales y luego se apila.
    const pautas = voces.map((v) => grabarVoz(v, sistema, s, 0));
    const ys = [];
    let yL = y;
    pautas.forEach((p, i) => {
      yL += -p.techo + (i === 0 ? 2.4 * s : 1.2 * s);
      ys.push(yL);
      yL += p.suelo;
    });
    const altoSistema = yL;
    const topePauta = ys[0];
    const fondoPauta = ys[ys.length - 1] + 4 * s;

    pautas.forEach((p, i) => {
      const v = voces[i];
      const yp = ys[i];
      const g = [];
      for (let l = 0; l < 5; l++) g.push(`<line class="p" x1="0" x2="${n2(sistema.xFin)}" y1="${n2(l * s)}" y2="${n2(l * s)}" stroke-width="${n2(0.1 * s)}"/>`);
      const [gc, yc] = claveGlifo[v.instrumento.clave];
      g.push(`<text x="${n2(0.5 * s)}" y="${n2(yc * s)}" font-size="${4 * s}" class="m">${gc}</text>`);
      for (const m of sistema.medidas) {
        if (m.cambia) g.push(cifraCompas(m.c, m.xCifra + m.cifra / 2 - 0.2 * s, s));
      }
      salida.push(`<text x="${margenIzq + rotuloAncho - 0.7 * s}" y="${n2(yp + 2.4 * s)}" font-size="${n2(1.7 * s)}" text-anchor="end" class="r">${esc(is === 0 ? v.nombre : v.instrumento.abrev)}</text>`);
      salida.push(`<g transform="translate(${x0} ${n2(yp)})">${g.join('')}${p.contenido}</g>`);
    });

    // Barras, número de compás y tempo.
    const barras = [];
    barras.push(`<line x1="${x0}" x2="${x0}" y1="${n2(topePauta)}" y2="${n2(fondoPauta)}" stroke-width="${n2(0.14 * s)}"/>`);
    for (const m of sistema.medidas) {
      const xb = x0 + m.x + m.ancho;
      const final = m.im === part.compases.length - 1;
      barras.push(`<line x1="${n2(xb)}" x2="${n2(xb)}" y1="${n2(topePauta)}" y2="${n2(fondoPauta)}" stroke-width="${n2(final ? 0.5 * s : 0.14 * s)}"/>`);
      if (final) barras.push(`<line x1="${n2(xb - 0.7 * s)}" x2="${n2(xb - 0.7 * s)}" y1="${n2(topePauta)}" y2="${n2(fondoPauta)}" stroke-width="${n2(0.14 * s)}"/>`);
    }
    const primero = sistema.medidas[0];
    salida.push(`<text x="${x0}" y="${n2(topePauta + pautas[0].techo - 0.7 * s)}" font-size="${n2(1.45 * s)}" class="n">${primero.im + 1}</text>`);
    if (part.etiquetas) {
      for (const m of sistema.medidas) {
        salida.push(`<text x="${n2(x0 + m.x)}" y="${n2(topePauta + pautas[0].techo - 2.3 * s)}" font-size="${n2(1.5 * s)}" class="tp">${esc(part.etiquetas[m.im])}</text>`);
      }
    } else if (is === 0) {
      salida.push(`<text x="${x0 + 2.2 * s}" y="${n2(topePauta + pautas[0].techo - 0.7 * s)}" font-size="${n2(1.7 * s)}" class="tp">♩ = ${part.tempo}</text>`);
    }
    salida.push(`<g>${barras.join('')}</g>`);

    mapa.push({
      arriba: topePauta - 8,
      abajo: fondoPauta + 8,
      puntos: sistema.medidas.flatMap((m) => {
        const base = medidas[m.im];
        const pts = base.columnas.map((t, i) => ({ t: t.aNumero(), x: x0 + m.x + base.xs[i] * m.escala }));
        pts.push({ t: base.fin.aNumero(), x: x0 + m.x + m.ancho });
        return pts;
      }),
    });

    y = altoSistema + 4.5 * s;
  });

  const alto = Math.ceil(y);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" class="partitura" viewBox="0 0 ${n2(anchoTotal)} ${alto}" width="${n2(anchoTotal)}" height="${alto}" role="img" aria-label="${esc(`Partitura: ${part.compases.length} compases, ${voces.length} voces`)}">${salida.join('')}</svg>`;
  return { svg, mapa, alto, sistemas: sistemas.length };
}

/** Las alturas de un campo sobre una pauta doble, para verlas de un vistazo. */
export function grabarCampo(notas, { s = 5, porFila = 34 } = {}) {
  if (!notas.length) return '';
  const lista = notas.slice(0, porFila * 3);
  const paso = 2.9 * s;
  const ancho = Math.max(240, 5 * s + lista.length * paso + 2 * s);
  const ySol = 7 * s;
  const yFa = ySol + 4 * s + 4 * s;
  const partes = [];
  for (const y0 of [ySol, yFa]) {
    for (let l = 0; l < 5; l++) partes.push(`<line class="p" x1="2" x2="${n2(ancho - 2)}" y1="${n2(y0 + l * s)}" y2="${n2(y0 + l * s)}" stroke-width="${n2(0.12 * s)}"/>`);
  }
  partes.push(`<text x="${n2(0.5 * s)}" y="${n2(ySol + 3 * s)}" font-size="${4 * s}" class="m">${G.claveSol}</text>`);
  partes.push(`<text x="${n2(0.5 * s)}" y="${n2(yFa + s)}" font-size="${4 * s}" class="m">${G.claveFa}</text>`);
  let techo = ySol;
  let suelo = yFa + 4 * s;
  lista.forEach((n, i) => {
    const x = 4.5 * s + i * paso;
    const clave = n.q >= 120 ? 'sol' : 'fa';
    const y0 = clave === 'sol' ? ySol : yFa;
    const d = deletrearLocal(n);
    const y = y0 + ((LINEA_SUPERIOR[clave] - d.diatonico) * s) / 2;
    const dev = n.cents !== undefined ? ` · ${n.cents >= 0 ? '+' : ''}${n.cents.toFixed(1)} c` : '';
    const parc = n.parcial ? ` · parcial ${n.parcial}` : '';
    partes.push(`<g><title>${esc(d.nombre + parc + dev)}</title>`);
    partes.push(`<text x="${n2(x)}" y="${n2(y)}" font-size="${4 * s}" class="m">${G.negra}</text>`);
    if (d.alter !== 0) partes.push(`<text x="${n2(x - 1.2 * s)}" y="${n2(y)}" font-size="${4 * s}" class="m">${ALTERACION[d.alter]}</text>`);
    const anchoL = 1.7 * s;
    for (let yl = y0 - s; yl >= y - 0.01; yl -= s) partes.push(`<line x1="${n2(x - 0.25 * s)}" x2="${n2(x - 0.25 * s + anchoL)}" y1="${n2(yl)}" y2="${n2(yl)}" stroke-width="${n2(0.13 * s)}"/>`);
    for (let yl = y0 + 5 * s; yl <= y + 0.01; yl += s) partes.push(`<line x1="${n2(x - 0.25 * s)}" x2="${n2(x - 0.25 * s + anchoL)}" y1="${n2(yl)}" y2="${n2(yl)}" stroke-width="${n2(0.13 * s)}"/>`);
    partes.push('</g>');
    techo = Math.min(techo, y - s);
    suelo = Math.max(suelo, y + s);
  });
  const top = techo - s;
  return `<svg xmlns="http://www.w3.org/2000/svg" class="campo-vista" viewBox="0 ${n2(top)} ${n2(ancho)} ${n2(suelo - top + s)}" width="${n2(ancho)}" height="${n2(suelo - top + s)}" role="img" aria-label="Alturas del campo">${partes.join('')}</svg>`;
}

const LETRA_D = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };
function deletrearLocal(n) {
  // Reutiliza el nombre oficial y calcula el índice diatónico a partir de él.
  const nombre = nombreAltura(n.q);
  const oct = Math.floor(n.q / 24) - 1;
  const clase = ((n.q % 24) + 24) % 24;
  const TABLA = [['C', 0], ['C', 0.5], ['C', 1], ['C', 1.5], ['D', 0], ['D', 0.5], ['E', -1], ['E', -0.5], ['E', 0], ['E', 0.5], ['F', 0], ['F', 0.5], ['F', 1], ['F', 1.5], ['G', 0], ['G', 0.5], ['A', -1], ['A', -0.5], ['A', 0], ['A', 0.5], ['B', -1], ['B', -0.5], ['B', 0], ['B', 0.5]];
  const [l, alter] = TABLA[clase];
  return { nombre, alter, diatonico: oct * 7 + LETRA_D[l] };
}

