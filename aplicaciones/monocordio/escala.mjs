import {
  DIATONIC_STEPS, PYTHAGOREAN_COMMA, makeCollection,
  nextFifth, STEP_MIN, STEP_MAX
} from "./escala-core.mjs";

const el = id => document.getElementById(id);
const svg = el("pythagorean-score");
const noteGrid = el("pythagorean-notes");
const status = el("scale-audio-status");
const number = (value, places = 1) => new Intl.NumberFormat("es-CL", {
  minimumFractionDigits: places, maximumFractionDigits: places
}).format(value);
const letters = { C: 212, D: 202, E: 192, F: 182, G: 172, A: 162, B: 152 };
const SVG_NS = "http://www.w3.org/2000/svg";
let fifthSteps = [...DIATONIC_STEPS];
let audioContext = null;
let activeStep = null;
let scheduledTimeout = null;

function centsLabel(cents) {
  if (Math.abs(cents) < 0.05) return "0,0 ¢";
  return (cents > 0 ? "+" : "−") + number(Math.abs(cents)) + " ¢";
}

function svgElement(tag, attrs = {}, text = null) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
  if (text !== null) node.textContent = text;
  return node;
}

function drawScore(notes) {
  const width = Math.max(760, 135 + notes.length * 103);
  svg.setAttribute("viewBox", `0 0 ${width} 315`);
  svg.style.width = `${width}px`;
  svg.setAttribute("aria-label", "Notas pitagóricas en clave de sol: " +
    notes.map(note => `${note.name}, ${centsLabel(note.centsFrom12TET)}`).join("; "));
  svg.replaceChildren();
  svg.append(svgElement("rect", { x: 0, y: 0, width, height: 315, fill: "#111116" }));

  const from = 65, to = width - 18;
  for (const y of [112, 132, 152, 172, 192]) {
    svg.append(svgElement("line", { x1: from, y1: y, x2: to, y2: y,
      stroke: "#b9b2aa", "stroke-width": 1.4 }));
  }
  svg.append(svgElement("text", {
    x: 17, y: 194, fill: "#e8cd9a", "font-size": 75,
    "font-family": "'Noto Music','Apple Symbols','Segoe UI Symbol',serif"
  }, "𝄞"));

  notes.forEach((note, index) => {
    const x = 118 + index * 103;
    const y = letters[note.letter];
    const positive = note.centsFrom12TET > 0.05;
    const negative = note.centsFrom12TET < -0.05;
    if (note.letter === "C") {
      svg.append(svgElement("line", { x1: x - 18, y1: 212, x2: x + 19, y2: 212,
        stroke: "#cbc3b7", "stroke-width": 2 }));
    }
    if (note.accidental !== 0) {
      svg.append(svgElement("text", {
        x: x - 34, y: y + 8, "font-family": "Georgia,serif",
        "font-size": 28, fill: "#e8d3b8"
      }, note.accidental === 1 ? "♯" : "♭"));
    }
    svg.append(svgElement("line", { x1: x + 10, y1: y, x2: x + 10, y2: y - 38,
      stroke: "#f6eee3", "stroke-width": 2.3 }));
    svg.append(svgElement("ellipse", {
      cx: x, cy: y, rx: 11.5, ry: 7.7, fill: "#f4e4cc",
      transform: `rotate(-19 ${x} ${y})`
    }));
    svg.append(svgElement("text", {
      x, y: 65, "text-anchor": "middle", "font-size": 16,
      "font-weight": "600", fill: positive || negative ? "#a1e3c6" : "#eacb9e"
    }, (positive ? "↑ " : negative ? "↓ " : "") + centsLabel(note.centsFrom12TET)));
    svg.append(svgElement("text", {
      x, y: 261, "text-anchor": "middle", "font-size": 16,
      "font-family": "Georgia,serif", fill: "#f4dcaf"
    }, note.name));
    svg.append(svgElement("text", {
      x, y: 288, "text-anchor": "middle", "font-size": 13, fill: "#aea6aa"
    }, note.ratioNumerator + "/" + note.ratioDenominator));
  });
}

async function getAudio() {
  const Audio = window.AudioContext || window.webkitAudioContext;
  if (!Audio) {
    status.textContent = "El navegador no admite síntesis de sonido.";
    return null;
  }
  try {
    audioContext ??= new Audio();
    if (audioContext.state !== "running") await audioContext.resume();
    return audioContext;
  } catch {
    status.textContent = "No se ha podido iniciar el audio. Comprueba los permisos.";
    return null;
  }
}

/** Síntesis simple de cuerda pulsada; los armónicos comparten una envolvente de caída. */
function soundNote(ctx, frequencyHz, delay = 0, duration = 0.85) {
  const start = ctx.currentTime + 0.012 + delay;
  const envelope = ctx.createGain();
  envelope.gain.setValueAtTime(0.0001, start);
  envelope.gain.exponentialRampToValueAtTime(0.14, start + 0.012);
  envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  envelope.connect(ctx.destination);
  let live = 6;
  for (let harmonic = 1; harmonic <= 6; harmonic++) {
    const oscillator = ctx.createOscillator();
    const partial = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequencyHz * harmonic, start);
    partial.gain.value = 1 / Math.pow(harmonic, 1.9);
    oscillator.connect(partial);
    partial.connect(envelope);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.01);
    oscillator.addEventListener("ended", () => {
      oscillator.disconnect();
      partial.disconnect();
      live--;
      if (!live) envelope.disconnect();
    }, { once: true });
  }
}

function renderCards(notes) {
  noteGrid.replaceChildren();
  for (const note of notes) {
    const card = document.createElement("article");
    card.className = "note-card" + (activeStep === note.fifthStep ? " active-note" : "");
    card.dataset.step = String(note.fifthStep);
    const header = document.createElement("div");
    header.className = "note-header";
    const label = document.createElement("span");
    label.className = "note-name";
    label.textContent = note.solfege + "4";
    const cents = document.createElement("span");
    cents.className = "note-cents";
    cents.textContent = centsLabel(note.centsFrom12TET);
    header.append(label, cents);
    const definitions = document.createElement("dl");
    const pairs = [
      ["Nota", note.name], ["Razón desde Do", note.ratioNumerator + ":" + note.ratioDenominator],
      ["Frecuencia", number(note.frequencyHz, 2) + " Hz"], ["Quintas", (note.fifthStep > 0 ? "+" : "") + note.fifthStep]
    ];
    for (const [name, value] of pairs) {
      const dt = document.createElement("dt");
      const dd = document.createElement("dd");
      dt.textContent = name;
      dd.textContent = value;
      definitions.append(dt, dd);
    }
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "♪ Escuchar " + note.solfege;
    button.setAttribute("aria-label", "Escuchar " + note.name + " a " +
      number(note.frequencyHz, 2) + " hercios, corrección " + centsLabel(note.centsFrom12TET));
    button.addEventListener("click", async () => {
      const ctx = await getAudio();
      if (!ctx) return;
      soundNote(ctx, note.frequencyHz);
      activeStep = note.fifthStep;
      for (const item of noteGrid.querySelectorAll(".note-card")) {
        item.classList.toggle("active-note", Number(item.dataset.step) === activeStep);
      }
      status.textContent = note.name + ": " + number(note.frequencyHz, 2) +
        " Hz; desviación " + centsLabel(note.centsFrom12TET) + ".";
    });
    card.append(header, definitions, button);
    noteGrid.append(card);
  }
}

function render() {
  const notes = makeCollection(fifthSteps);
  activeStep = notes.some(note => note.fifthStep === activeStep) ? activeStep : null;
  drawScore(notes);
  renderCards(notes);
  const selected = [...fifthSteps].sort((a,b) => a-b);
  const byStep = new Map(notes.map(note => [note.fifthStep, note]));
  el("fifths-chain").textContent = "Cadena de quintas (respecto de Do): " +
    selected.map(step => byStep.get(step).name.replace("4", "") +
      " (" + (step > 0 ? "+" : "") + step + ")").join(" → ");
  el("add-positive-fifth").disabled = Math.max(...selected) >= STEP_MAX;
  el("add-negative-fifth").disabled = Math.min(...selected) <= STEP_MIN;
  el("comma-cents").textContent = "≈ " + number(PYTHAGOREAN_COMMA.cents, 2) + " ¢";
}

el("add-positive-fifth").addEventListener("click", () => {
  fifthSteps = nextFifth(fifthSteps, 1) ?? fifthSteps;
  render();
});
el("add-negative-fifth").addEventListener("click", () => {
  fifthSteps = nextFifth(fifthSteps, -1) ?? fifthSteps;
  render();
});
el("build-diatonic").addEventListener("click", () => {
  fifthSteps = [...DIATONIC_STEPS];
  render();
});
el("show-comma").addEventListener("click", () => {
  fifthSteps = [-6, 6];
  render();
});
el("reset-scale").addEventListener("click", () => {
  fifthSteps = [0];
  render();
});

el("play-pythagorean-scale").addEventListener("click", async () => {
  const ctx = await getAudio();
  if (!ctx) return;
  const notes = makeCollection(fifthSteps);
  const button = el("play-pythagorean-scale");
  button.disabled = true;
  if (scheduledTimeout) clearTimeout(scheduledTimeout);
  const gap = 0.72;
  notes.forEach((note, index) => soundNote(ctx, note.frequencyHz, index * gap, 0.82));
  status.textContent = "Reproducción ascendente de " + notes.length + " notas pitagóricas.";
  scheduledTimeout = setTimeout(() => {
    button.disabled = false;
    scheduledTimeout = null;
    status.textContent = "Reproducción terminada. Puedes explorar cualquier nota.";
  }, Math.ceil(((notes.length - 1) * gap + 0.88) * 1000));
});

render();
