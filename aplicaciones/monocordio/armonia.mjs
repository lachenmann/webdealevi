import { BASE_FREQUENCY } from "./core.mjs?v=VEC-20261010-01";
import {
  TETRAKTYS_TOTAL, buildTetraktys, buildMeanSeries, meanIdentity
} from "./armonia-core.mjs?v=VEC-20261010-01";

const byId = id => document.getElementById(id);
const SVG_NS = "http://www.w3.org/2000/svg";
const fmt = (number, digits = 2) => new Intl.NumberFormat("es-CL", {
  minimumFractionDigits: digits, maximumFractionDigits: digits
}).format(number);
const tetraTones = buildTetraktys(BASE_FREQUENCY);
const meanTones = buildMeanSeries(BASE_FREQUENCY);
const means = meanIdentity();
let selectedTetra = 1;
let selectedMean = 6;
let audioContext = null;

function element(tag, attributes = {}, value = null) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [name, attribute] of Object.entries(attributes)) {
    node.setAttribute(name, String(attribute));
  }
  if (value !== null) node.textContent = value;
  return node;
}

function appendSvgText(target, value, x, y, options = {}) {
  target.append(element("text", {
    x, y, "text-anchor": options.align || "middle",
    fill: options.color || "#e7d4b3",
    "font-size": options.size || 18,
    "font-family": options.family || "Georgia,serif",
    "font-weight": options.weight || 400
  }, value));
}

function addClickableGroup(target, number, clickAction) {
  target.classList.add("harmony-dot");
  target.setAttribute("data-term", String(number));
  // SVG es ilustrativo; los botones HTML duplican las acciones para teclado/lectores.
  target.addEventListener("click", clickAction);
}

function drawTetraktys() {
  const svg = byId("tetraktys-diagram");
  svg.replaceChildren();
  svg.append(
    element("title", {}, "Tetraktys sonora de diez puntos"),
    element("desc", {}, "Cuatro filas de 1, 2, 3 y 4 puntos, correspondientes a cuatro frecuencias relacionadas."),
    element("path", {
      d: "M 350 54 L 206 344 L 494 344 Z", fill: "none",
      stroke: "#735844", "stroke-width": 1.4, "stroke-dasharray": "4 9"
    })
  );
  for (const tone of tetraTones) {
    const n = tone.number;
    const y = 69 + (n - 1) * 90;
    const first = 350 - ((n - 1) * 80) / 2;
    const highlighted = selectedTetra === n;
    appendSvgText(svg, String(n), 67, y + 8, {
      size: 26, color: highlighted ? "#ffdea7" : "#a99c9d"
    });
    appendSvgText(svg, String(n) + " × f₀", 577, y - 4, {
      align: "start", size: 16,
      color: highlighted ? "#ffdfa4" : "#d7c6b9"
    });
    appendSvgText(svg, fmt(tone.frequencyHz, 0) + " Hz", 577, y + 20, {
      align: "start", size: 15, color: "#b5d9ca", family: "system-ui,sans-serif"
    });
    for (let i = 0; i < n; i++) {
      const x = first + i * 80;
      const g = element("g");
      addClickableGroup(g, n, () => selectTetraktys(n, true));
      g.append(element("circle", {
        cx: x, cy: y, r: 24,
        fill: highlighted ? "#e8b66c" : "#46302b",
        stroke: highlighted ? "#ffe3a2" : "#b18e65",
        "stroke-width": highlighted ? 3 : 2
      }));
      g.append(element("circle", {
        cx: x - 5, cy: y - 6, r: 6,
        fill: highlighted ? "#fff0c9" : "#ae8559", opacity: .75
      }));
      svg.append(g);
    }
  }
  appendSvgText(svg, TETRAKTYS_TOTAL + " puntos", 350, 398, {
    color: "#a9a2a2", size: 15, family: "system-ui,sans-serif"
  });
}

function drawMeans() {
  const svg = byId("means-diagram");
  svg.replaceChildren();
  svg.append(
    element("title", {}, "Medias musical, aritmética y armónica"),
    element("desc", {}, "Segmento numérico de 6 a 12; media armónica en 8 y aritmética en 9."),
    element("line", { x1: 96, y1: 149, x2: 743, y2: 149,
      stroke: "#b99364", "stroke-width": 3 }),
    element("path", { d:"M 96 95 V 77 H 743 V 95", fill:"none",
      stroke: "#86715d", "stroke-width": 2 })
  );
  appendSvgText(svg, "Octava: 12:6 = 2:1", 419, 63, {
    color:"#f2d9a4", size:20
  });
  for (const tone of meanTones) {
    const n = tone.number;
    const x = 96 + (n - 6) / 6 * 647;
    const highlighted = selectedMean === n;
    const isMiddle = n === means.harmonic || n === means.arithmetic;
    const color = n === 8 ? "#9bd2be" : n === 9 ? "#f0be78" : "#d1b99f";
    const g = element("g");
    addClickableGroup(g, n, () => selectMeans(n, true));
    g.append(element("line", { x1:x, y1:140, x2:x, y2:166,
      stroke:color,"stroke-width":2 }));
    g.append(element("circle", { cx:x,cy:149,r:highlighted?24:20,
      fill: highlighted?"#f3d5a3":"#372c34",
      stroke:color, "stroke-width":highlighted?4:2.5 }));
    g.append(element("circle", { cx:x,cy:149,r:6,fill:color }));
    svg.append(g);
    appendSvgText(svg, String(n), x, 119, {
      color: highlighted ? "#ffe6b7" : color, size:27
    });
    appendSvgText(svg,
      isMiddle ? n === 8 ? "H" : "A" : n === 6 ? "inferior" : "superior",
      x, 199, { size:17, color:"#c9bfbb", family:"system-ui,sans-serif" }
    );
    appendSvgText(svg, fmt(tone.frequencyHz) + " Hz", x, 229, {
      size:14,color:"#b4d4c3",family:"system-ui,sans-serif"
    });
  }
  appendSvgText(svg, "H = 8", 292, 284, {color:"#a8dec7",size:17});
  appendSvgText(svg, "A = 9", 497, 284, {color:"#f2c98b",size:17});
}

function makeButtons(rootId, tones, chosenNumber, choose) {
  const root = byId(rootId);
  root.replaceChildren();
  for (const tone of tones) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "harmony-choice";
    button.dataset.term = String(tone.number);
    button.setAttribute("aria-pressed", String(tone.number === chosenNumber));
    button.setAttribute("aria-label", tone.number +
      (tone.role ? " — " + tone.role : " puntos en la fila") +
      ", " + fmt(tone.frequencyHz) + " hercios");
    const value = document.createElement("strong");
    value.textContent = String(tone.number);
    const label = document.createElement("span");
    label.textContent = tone.role || (fmt(tone.frequencyHz, 0) + " Hz");
    button.append(value, label);
    button.addEventListener("click", () => choose(tone.number, true));
    root.append(button);
  }
}

function updateButtons(rootId, selectedNumber) {
  for (const button of byId(rootId).querySelectorAll("button[data-term]")) {
    button.setAttribute("aria-pressed",
      String(Number(button.dataset.term) === selectedNumber));
  }
}

function fillReading(rootId, tone, heading) {
  const root = byId(rootId);
  root.replaceChildren();
  const line = document.createElement("strong");
  line.textContent = heading;
  root.append(line, document.createElement("br"),
    document.createTextNode("Frecuencia: " + fmt(tone.frequencyHz) +
      " Hz (relación " + tone.frequencyRatio + ")."),
    document.createElement("br"),
    document.createTextNode("Longitud vibrante: " + tone.lengthRatio +
      " de la cuerda completa."));
}

function selectTetraktys(number, listen = false) {
  const tone = tetraTones.find(item => item.number === number);
  if (!tone) return;
  selectedTetra = number;
  updateButtons("tetraktys-buttons", selectedTetra);
  drawTetraktys();
  fillReading("tetraktys-reading", tone, "Fila " + number + ": " + number + " puntos.");
  if (listen) void playNotes([tone.frequencyHz], byId("tetraktys-status"),
    "Fila " + number + ": " + fmt(tone.frequencyHz) + " Hz.", false);
}

function selectMeans(number, listen = false) {
  const tone = meanTones.find(item => item.number === number);
  if (!tone) return;
  selectedMean = number;
  updateButtons("means-buttons", selectedMean);
  drawMeans();
  fillReading("means-reading", tone, number + " · " + tone.role);
  if (listen) void playNotes([tone.frequencyHz], byId("means-status"),
    tone.role + ": " + fmt(tone.frequencyHz) + " Hz.", false);
}

async function unlockAudio(statusNode) {
  const Audio = window.AudioContext || window.webkitAudioContext;
  if (!Audio) {
    statusNode.textContent = "Este navegador no admite Web Audio API.";
    return null;
  }
  try {
    audioContext ??= new Audio();
    if (audioContext.state !== "running") await audioContext.resume();
    return audioContext;
  } catch {
    statusNode.textContent = "No se pudo activar el sonido. Revisa los permisos del navegador.";
    return null;
  }
}

function schedulePluck(ctx, frequency, when, amplitude, duration = 1.1) {
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(amplitude, when + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
  gain.connect(ctx.destination);
  let voices = 5;
  for (let h = 1; h <= 5; h++) {
    const osc = ctx.createOscillator();
    const partial = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(frequency * h, when);
    partial.gain.setValueAtTime(1 / Math.pow(h, 1.85), when);
    osc.connect(partial);
    partial.connect(gain);
    osc.start(when);
    osc.stop(when + duration + 0.015);
    osc.addEventListener("ended", () => {
      osc.disconnect();
      partial.disconnect();
      voices--;
      if (voices === 0) gain.disconnect();
    }, { once: true });
  }
}

async function playNotes(frequencies, statusNode, label, together = false) {
  const ctx = await unlockAudio(statusNode);
  if (!ctx) return;
  const start = ctx.currentTime + 0.025;
  const amplitude = together ? 0.12 / frequencies.length : 0.11;
  frequencies.forEach((frequency, index) => {
    const when = start + (together ? 0 : index * 0.69);
    schedulePluck(ctx, frequency, when, amplitude, together ? 1.65 : 1.05);
  });
  statusNode.textContent = label;
}

function locateBridge(tone, label, statusNode) {
  const fraction = tone.vibratingFraction;
  // Evento optativo; el monocordio original sigue siendo autónomo.
  window.dispatchEvent(new CustomEvent("monocordio-set-fraction", {
    detail: { fraction, label }
  }));
  const target = byId("instrument-heading");
  if (target) {
    const reduce = window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }
  statusNode.textContent = label + ": puente ajustado a longitud " +
    tone.lengthRatio + ". Pulsa la cuerda para escucharlo.";
}

byId("tetraktys-play").addEventListener("click", () => {
  void playNotes(tetraTones.map(t => t.frequencyHz), byId("tetraktys-status"),
    "Suena la tetraktys: 1 → 2 → 3 → 4.", false);
});
byId("tetraktys-chord").addEventListener("click", () => {
  void playNotes(tetraTones.map(t => t.frequencyHz), byId("tetraktys-status"),
    "Suenan simultáneamente los cuatro términos.", true);
});
byId("tetraktys-bridge").addEventListener("click", () => {
  const tone = tetraTones.find(item => item.number === selectedTetra);
  locateBridge(tone, "Fila " + selectedTetra, byId("tetraktys-status"));
});
byId("means-play").addEventListener("click", () => {
  void playNotes(meanTones.map(t => t.frequencyHz), byId("means-status"),
    "Suena la serie 6 → 8 → 9 → 12.", false);
});
byId("means-compare").addEventListener("click", () => {
  const two = meanTones.filter(t => t.number === means.harmonic ||
    t.number === means.arithmetic);
  void playNotes(two.map(t => t.frequencyHz), byId("means-status"),
    "Comparación: media armónica 8, después aritmética 9 (tono 9:8).", false);
});
byId("means-bridge").addEventListener("click", () => {
  const tone = meanTones.find(item => item.number === selectedMean);
  locateBridge(tone, tone.role, byId("means-status"));
});

makeButtons("tetraktys-buttons", tetraTones, selectedTetra, selectTetraktys);
makeButtons("means-buttons", meanTones, selectedMean, selectMeans);
selectTetraktys(1);
selectMeans(6);
