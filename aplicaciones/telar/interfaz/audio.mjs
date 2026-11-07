// Reproducción con Web Audio. Con muestras, suena VSCO 2 CE: capas por dinámica y
// muestra por articulación. Toda nota sin muestra disponible cae en la síntesis.

import { planificar, necesidades, bytesParaSegundos, ajustarWav } from './muestras.mjs';

const TIMBRES = {
  soplo: { tipo: 'sine', filtro: 3200, ataque: 0.03, caida: 0.06, apoyo: 0.85, segundo: 0.12 },
  cana: { tipo: 'square', filtro: 1700, ataque: 0.018, caida: 0.05, apoyo: 0.72, segundo: 0.0 },
  cuerda: { tipo: 'sawtooth', filtro: 2400, ataque: 0.03, caida: 0.08, apoyo: 0.8, segundo: 0.0 },
  metal: { tipo: 'sawtooth', filtro: 1500, ataque: 0.025, caida: 0.1, apoyo: 0.75, segundo: 0.0 },
  piano: { tipo: 'triangle', filtro: 4200, ataque: 0.004, caida: 0.9, apoyo: 0.12, segundo: 0.1 },
};

// Forma del ataque en la síntesis: las articulaciones también se notan sin muestras.
const FORMA = {
  staccato: { pico: 1.25, ataque: 0.5 },
  staccatissimo: { pico: 1.4, ataque: 0.35 },
  acento: { pico: 1.9, ataque: 0.5 },
  marcato: { pico: 2.3, ataque: 0.35 },
  tenuto: { pico: 1, ataque: 1.3 },
};

const SIMULTANEAS = 6;
const MAXIMA_ESPERA = 20000;

export class Reproductor {
  constructor({ alAvanzar, alTerminar, alProgreso }) {
    this.alAvanzar = alAvanzar;
    this.alTerminar = alTerminar;
    this.alProgreso = alProgreso;
    this.contexto = null;
    this.activo = false;
    this.cargando = false;
    this.fuentes = new Set();
    this.memoria = new Map(); // url → { buffer, segundos }
    this.turnoCarga = 0;
  }

  prepararContexto() {
    if (this.contexto) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) throw new Error('Este navegador no tiene Web Audio');
    const ctx = new AC();
    this.contexto = ctx;
    this.salida = ctx.createDynamicsCompressor();
    this.volumen = ctx.createGain();
    this.volumen.gain.value = 0.85;
    this.salida.connect(this.volumen);
    this.volumen.connect(ctx.destination);
    // Una sala discreta: da aire a las muestras, grabadas muy de cerca.
    this.sala = ctx.createConvolver();
    this.sala.buffer = respuestaDeSala(ctx);
    const envio = ctx.createGain();
    envio.gain.value = 0.16;
    this.envio = envio;
    envio.connect(this.sala);
    this.sala.connect(this.salida);
  }

  /** Devuelve cuántas muestras no se pudieron cargar. */
  async cargar(eventos, turno) {
    const pendientes = [...necesidades(eventos)].filter(([url, s]) => (this.memoria.get(url)?.segundos ?? 0) < s);
    const total = pendientes.length;
    let hechas = 0;
    let fallidas = 0;
    if (total) this.alProgreso?.(0, total);
    const obrero = async () => {
      while (pendientes.length && turno === this.turnoCarga) {
        const [url, segundos] = pendientes.shift();
        try {
          this.memoria.set(url, { buffer: await this.traer(url, segundos), segundos });
        } catch {
          fallidas++;
        }
        hechas++;
        if (turno === this.turnoCarga) this.alProgreso?.(hechas, total);
      }
    };
    await Promise.all(Array.from({ length: SIMULTANEAS }, obrero));
    return fallidas;
  }

  async traer(url, segundos) {
    const control = new AbortController();
    const reloj = setTimeout(() => control.abort(), MAXIMA_ESPERA);
    try {
      const r = await fetch(url, { headers: { Range: `bytes=0-${bytesParaSegundos(segundos)}` }, signal: control.signal });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await this.contexto.decodeAudioData(ajustarWav(await r.arrayBuffer()));
    } finally {
      clearTimeout(reloj);
    }
  }

  /** Resuelve a { fallidas } o a null si se canceló durante la carga. */
  async tocar(part, silenciadas = new Set(), { muestras = true } = {}) {
    this.parar();
    this.prepararContexto();
    await this.contexto.resume();
    const eventos = planificar(part, silenciadas);
    const turno = ++this.turnoCarga;
    let fallidas = 0;
    if (muestras) {
      this.cargando = true;
      fallidas = await this.cargar(eventos, turno);
      if (turno !== this.turnoCarga) return null;
      this.cargando = false;
    }
    this.eventos = eventos;
    this.usarMuestras = muestras;
    this.cursor = 0;
    this.origen = this.contexto.currentTime + 0.15;
    this.segundosPorRedonda = (4 * 60) / part.negrasPorMinuto;
    this.total = part.duracion.aNumero() * this.segundosPorRedonda;
    this.activo = true;
    this.programar();
    this.temporizador = setInterval(() => this.programar(), 60);
    this.animar();
    return { fallidas };
  }

  programar() {
    const ahora = this.contexto.currentTime - this.origen;
    // Aquí y no en la animación: una pestaña oculta detiene requestAnimationFrame.
    if (ahora >= this.total + 0.6) {
      this.parar();
      this.alTerminar?.();
      return;
    }
    while (this.cursor < this.eventos.length && this.eventos[this.cursor].t < ahora + 0.25) {
      const e = this.eventos[this.cursor++];
      if (!(this.usarMuestras && this.sonarMuestras(e))) this.sintetizar(e);
    }
  }

  /** Devuelve false si falta alguna muestra de la nota. */
  sonarMuestras(e) {
    if (!e.capas?.length) return false;
    const entradas = e.capas.map((c) => this.memoria.get(c.url));
    if (entradas.some((x) => !x)) return false;
    const ctx = this.contexto;
    const t0 = this.origen + e.t;
    const nivel = 0.9 / Math.sqrt(e.polifonia);
    e.capas.forEach((c, i) => {
      const fuente = ctx.createBufferSource();
      fuente.buffer = entradas[i].buffer;
      fuente.playbackRate.value = c.velocidad;
      const g = ctx.createGain();
      const fin = t0 + c.duracion;
      const pico = nivel * c.ganancia;
      g.gain.setValueAtTime(pico, t0);
      g.gain.setValueAtTime(pico, fin);
      g.gain.exponentialRampToValueAtTime(0.0001, fin + c.soltar);
      fuente.connect(g);
      g.connect(this.salida);
      g.connect(this.envio);
      fuente.start(t0);
      fuente.stop(fin + c.soltar + 0.02);
      this.fuentes.add(fuente);
      fuente.onended = () => this.fuentes.delete(fuente);
    });
    return true;
  }

  sintetizar(e) {
    const ctx = this.contexto;
    const t0 = this.origen + e.t;
    const fin = t0 + e.d;
    const timbre = TIMBRES[e.timbre] ?? TIMBRES.soplo;
    const forma = FORMA[e.articulacion] ?? { pico: 1, ataque: 1 };
    const nivel = (0.05 + 0.3 * e.v * e.v) / Math.sqrt(e.polifonia);
    const { tipo, filtro, caida, apoyo, segundo } = timbre;
    const ataque = timbre.ataque * forma.ataque;
    const g = ctx.createGain();
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    // Tocar fuerte también abre el timbre, no solo sube el volumen.
    lp.frequency.value = Math.min(filtro * (0.45 + 1.5 * e.v) + 600, 12000);
    const base = Math.max(nivel * apoyo, 0.0005);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(nivel * forma.pico, t0 + ataque);
    g.gain.exponentialRampToValueAtTime(base, t0 + ataque + caida);
    g.gain.setValueAtTime(base, Math.max(t0 + ataque + caida, fin - 0.01));
    g.gain.linearRampToValueAtTime(0, fin + 0.06);
    lp.connect(g);
    g.connect(this.salida);
    g.connect(this.envio);
    const crear = (f, tipoOnda, ganancia) => {
      const o = ctx.createOscillator();
      o.type = tipoOnda;
      o.frequency.value = f;
      const pg = ctx.createGain();
      pg.gain.value = ganancia;
      o.connect(pg);
      pg.connect(lp);
      o.start(t0);
      o.stop(fin + 0.08);
      this.fuentes.add(o);
      o.onended = () => this.fuentes.delete(o);
    };
    crear(e.f, tipo, 1);
    if (segundo > 0) crear(e.f * 2, 'sine', segundo);
  }

  animar() {
    if (!this.activo) return;
    const t = this.contexto.currentTime - this.origen;
    this.alAvanzar?.(Math.max(0, t) / this.segundosPorRedonda);
    this.marco = requestAnimationFrame(() => this.animar());
  }

  parar() {
    this.activo = false;
    this.cargando = false;
    this.turnoCarga++;
    clearInterval(this.temporizador);
    cancelAnimationFrame(this.marco);
    for (const o of this.fuentes) {
      try { o.stop(); } catch { /* ya terminó */ }
    }
    this.fuentes.clear();
  }
}

function respuestaDeSala(ctx) {
  const largo = Math.floor(ctx.sampleRate * 1.3);
  const buffer = ctx.createBuffer(2, largo, ctx.sampleRate);
  // Ruido determinista: la misma sala en cada carga.
  let s = 22222;
  for (let c = 0; c < 2; c++) {
    const d = buffer.getChannelData(c);
    for (let i = 0; i < largo; i++) {
      s = (s * 16807) % 2147483647;
      d[i] = (s / 1073741823.5 - 1) * Math.exp((-5.5 * i) / largo);
    }
  }
  return buffer;
}
