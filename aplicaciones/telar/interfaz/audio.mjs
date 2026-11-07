// Síntesis local con Web Audio. Suena la altura escrita, en cuartos de tono exactos.

import { frecuencia } from '../nucleo/armonia.mjs';
import { notasSonoras } from '../nucleo/motor.mjs';

const TIMBRES = {
  soplo: { tipo: 'sine', filtro: 3200, ataque: 0.03, caida: 0.06, apoyo: 0.85, segundo: 0.12 },
  cana: { tipo: 'square', filtro: 1700, ataque: 0.018, caida: 0.05, apoyo: 0.72, segundo: 0.0 },
  cuerda: { tipo: 'sawtooth', filtro: 2400, ataque: 0.03, caida: 0.08, apoyo: 0.8, segundo: 0.0 },
  piano: { tipo: 'triangle', filtro: 4200, ataque: 0.004, caida: 0.9, apoyo: 0.12, segundo: 0.1 },
};

export class Reproductor {
  constructor({ alAvanzar, alTerminar }) {
    this.alAvanzar = alAvanzar;
    this.alTerminar = alTerminar;
    this.contexto = null;
    this.activo = false;
    this.fuentes = new Set();
  }

  async tocar(part, silenciadas = new Set()) {
    this.parar();
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) throw new Error('Este navegador no tiene Web Audio');
    if (!this.contexto) {
      this.contexto = new AC();
      this.salida = this.contexto.createDynamicsCompressor();
      this.volumen = this.contexto.createGain();
      this.volumen.gain.value = 0.7;
      this.salida.connect(this.volumen);
      this.volumen.connect(this.contexto.destination);
    }
    await this.contexto.resume();
    const segundosPorRedonda = (4 * 60) / part.tempo;
    const eventos = [];
    for (const v of part.voces) {
      if (silenciadas.has(v.indice)) continue;
      for (const n of notasSonoras(v)) {
        for (const q of n.alturas) {
          eventos.push({
            t: n.inicio.aNumero() * segundosPorRedonda,
            d: Math.max(0.03, n.sonora.aNumero() * segundosPorRedonda),
            f: frecuencia(q),
            v: n.velocidad / 127,
            timbre: TIMBRES[v.instrumento.timbre],
            polifonia: n.alturas.length,
          });
        }
      }
    }
    eventos.sort((a, b) => a.t - b.t);
    this.eventos = eventos;
    this.cursor = 0;
    this.origen = this.contexto.currentTime + 0.1;
    this.total = part.duracion.aNumero() * segundosPorRedonda;
    this.segundosPorRedonda = segundosPorRedonda;
    this.activo = true;
    this.programar();
    this.temporizador = setInterval(() => this.programar(), 60);
    this.animar();
  }

  programar() {
    const ahora = this.contexto.currentTime - this.origen;
    // Aquí y no en la animación: una pestaña oculta detiene requestAnimationFrame.
    if (ahora >= this.total + 0.3) {
      this.parar();
      this.alTerminar?.();
      return;
    }
    while (this.cursor < this.eventos.length && this.eventos[this.cursor].t < ahora + 0.25) {
      this.sonar(this.eventos[this.cursor++]);
    }
  }

  sonar(e) {
    const ctx = this.contexto;
    const t0 = this.origen + e.t;
    const fin = t0 + e.d;
    const nivel = (0.05 + 0.3 * e.v * e.v) / Math.sqrt(e.polifonia);
    const { tipo, filtro, ataque, caida, apoyo, segundo } = e.timbre;
    const g = ctx.createGain();
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = Math.min(filtro + 2500 * e.v, 12000);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(nivel, t0 + ataque);
    g.gain.exponentialRampToValueAtTime(Math.max(nivel * apoyo, 0.0005), t0 + ataque + caida);
    g.gain.setValueAtTime(Math.max(nivel * apoyo, 0.0005), Math.max(t0 + ataque + caida, fin - 0.01));
    g.gain.linearRampToValueAtTime(0, fin + 0.06);
    lp.connect(g);
    g.connect(this.salida);
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
    clearInterval(this.temporizador);
    cancelAnimationFrame(this.marco);
    for (const o of this.fuentes) {
      try { o.stop(); } catch { /* ya terminó */ }
    }
    this.fuentes.clear();
  }
}
