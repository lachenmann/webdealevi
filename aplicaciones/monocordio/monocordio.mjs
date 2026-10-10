import {
  BASE_FREQUENCY, INTERVALS, INTERVAL_GROUPS,
  normalizeFraction, describeFraction
} from "./core.mjs?v=TYPO-20261010-01";

const $ = id => document.getElementById(id);
const svg = $("monochord");
const bridge = $("bridge");
const activeString = $("active-string");
const hitString = $("hit-string");
const remainingString = $("remaining-string");
const slider = $("length-control");
const status = $("audio-status");
const ratioGroups = $("ratio-groups");
const presetButtons = [];

function renderIntervalCatalog() {
  const details = document.createDocumentFragment();
  for (const group of INTERVAL_GROUPS) {
    const items = INTERVALS.filter(item => item.group === group.id);
    const panel = document.createElement("details");
    panel.className = "ratio-group";
    panel.open = ["fundamentales","escala"].includes(group.id);
    const summary = document.createElement("summary");
    summary.textContent = group.label + " (" + items.length + ")";
    panel.append(summary);
    const buttons = document.createElement("div");
    buttons.className = "presets";
    buttons.setAttribute("role", "group");
    buttons.setAttribute("aria-label", group.label);
    for (const interval of items) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "preset";
      button.dataset.fraction = String(interval.fraction);
      button.dataset.intervalId = interval.id;
      button.setAttribute("aria-pressed", "false");
      button.setAttribute("aria-label", interval.name + ": longitud " +
        interval.numerator + " a " + interval.denominator +
        "; frecuencia " + interval.denominator + " a " + interval.numerator);
      button.append(document.createTextNode(interval.numerator + ":" + interval.denominator));
      const label = document.createElement("span");
      label.textContent = interval.name;
      button.append(label);
      presetButtons.push(button);
      buttons.append(button);
    }
    panel.append(buttons);
    details.append(panel);
  }
  ratioGroups.replaceChildren(details);
}
renderIntervalCatalog();
const xStart = 86;
const xEnd = 914;
const yString = 157;
const format = (value, digits = 2) =>
  new Intl.NumberFormat("es-CL", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);

let fraction = 1;
let pointerId = null;
let animationFrame = 0;
let audioContext = null;

function stringPath(amplitude = 0) {
  const endpoint = xStart + (xEnd - xStart) * fraction;
  if (amplitude === 0) return `M ${xStart} ${yString} L ${endpoint} ${yString}`;
  return `M ${xStart} ${yString} Q ${(xStart + endpoint)/2} ${yString + amplitude} ${endpoint} ${yString}`;
}

function updateUI(value) {
  fraction = normalizeFraction(value);
  const x = xStart + (xEnd - xStart) * fraction;
  const state = describeFraction(fraction);
  if (animationFrame) cancelAnimationFrame(animationFrame);
  animationFrame = 0;
  activeString.setAttribute("d", stringPath());
  hitString.setAttribute("d", stringPath());
  remainingString.setAttribute("x1", String(x));
  bridge.setAttribute("transform", `translate(${x} 0)`);
  slider.value = String(fraction);
  slider.setAttribute("aria-valuetext", `${format(state.lengthPercent, 1)} por ciento; ${state.intervalName}`);
  $("interval-name").textContent = state.intervalName;
  $("length-value").textContent = `${format(state.lengthPercent, 1)} %`;
  $("length-ratio").textContent = `${state.lengthRatio} de la cuerda`;
  $("frequency-value").textContent = `${format(state.frequencyHz)} Hz`;
  $("frequency-ratio").textContent = state.frequencyRatio;
  $("selected-ratio-svg-label").textContent =
    "Longitud " + state.lengthRatio + " · Frecuencia " + state.frequencyRatio;
  for (const button of presetButtons) {
    const selected = Math.abs(fraction - Number(button.dataset.fraction)) < 1e-9;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-pressed", String(selected));
  }
}

function coordinateToFraction(event) {
  const point = svg.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  const matrix = svg.getScreenCTM();
  if (!matrix) return fraction;
  const local = point.matrixTransform(matrix.inverse());
  return (local.x - xStart) / (xEnd - xStart);
}

svg.addEventListener("pointerdown", event => {
  if (event.target.closest("[data-bridge]")) {
    pointerId = event.pointerId;
    svg.setPointerCapture(pointerId);
    updateUI(coordinateToFraction(event));
    event.preventDefault();
  } else if (event.target.closest("[data-pluck]")) {
    void pluckSelected();
    event.preventDefault();
  }
});
svg.addEventListener("pointermove", event => {
  if (pointerId === event.pointerId) updateUI(coordinateToFraction(event));
});
function stopDrag(event) {
  if (pointerId !== event.pointerId) return;
  if (svg.hasPointerCapture(pointerId)) svg.releasePointerCapture(pointerId);
  pointerId = null;
}
svg.addEventListener("pointerup", stopDrag);
svg.addEventListener("pointercancel", stopDrag);
slider.addEventListener("input", () => updateUI(slider.value));
for (const button of presetButtons) {
  button.addEventListener("click", () => updateUI(button.dataset.fraction));
}

async function getAudioContext() {
  const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextConstructor) {
    status.textContent = "Este navegador no admite Web Audio API.";
    return null;
  }
  try {
    audioContext ??= new AudioContextConstructor();
    if (audioContext.state !== "running") await audioContext.resume();
    return audioContext;
  } catch {
    status.textContent = "No fue posible activar el audio. Comprueba los permisos y vuelve a intentarlo.";
    return null;
  }
}

/**
 * Síntesis aditiva: fundamental exacta más armónicos de una cuerda pulsada.
 * Se utiliza un ataque corto y una caída exponencial para evitar clics.
 * No se afirma equivalencia tímbrica con un monocordio histórico.
 */
function soundPluck(context, frequency, delay = 0, duration = 1.6) {
  const start = context.currentTime + 0.012 + delay;
  const envelope = context.createGain();
  envelope.gain.setValueAtTime(0.0001, start);
  envelope.gain.exponentialRampToValueAtTime(0.16, start + 0.009);
  envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  envelope.connect(context.destination);

  for (let harmonic = 1; harmonic <= 7; harmonic++) {
    const oscillator = context.createOscillator();
    const partial = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency * harmonic, start);
    partial.gain.setValueAtTime(1 / Math.pow(harmonic, 1.7), start);
    oscillator.connect(partial);
    partial.connect(envelope);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
    oscillator.addEventListener("ended", () => {
      oscillator.disconnect();
      partial.disconnect();
    }, { once: true });
  }
  // Desconectar solo al terminar todos los armónicos.
  // El gain compartido queda vivo hasta el último oscilador.
  // No se conserva ningún bucle de audio persistente.
  return envelope;
}

function animateVibration() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (animationFrame) cancelAnimationFrame(animationFrame);
  const started = performance.now();
  function step(now) {
    const dt = now - started;
    const envelope = Math.exp(-dt / 440);
    const displacement = Math.sin(dt * 0.125) * 23 * envelope;
    activeString.setAttribute("d", stringPath(displacement));
    if (dt < 1250) animationFrame = requestAnimationFrame(step);
    else {
      activeString.setAttribute("d", stringPath());
      animationFrame = 0;
    }
  }
  animationFrame = requestAnimationFrame(step);
}

async function pluckSelected() {
  const ctx = await getAudioContext();
  if (!ctx) return;
  const model = describeFraction(fraction);
  soundPluck(ctx, model.frequencyHz);
  animateVibration();
  status.textContent = `Cuerda pulsada: ${format(model.frequencyHz)} Hz (${model.intervalName.toLowerCase()}).`;
}
$("play-current").addEventListener("click", pluckSelected);

$("play-open").addEventListener("click", async () => {
  const ctx = await getAudioContext();
  if (!ctx) return;
  soundPluck(ctx, BASE_FREQUENCY);
  status.textContent = `Cuerda completa: ${format(BASE_FREQUENCY)} Hz.`;
});

$("play-compare").addEventListener("click", async () => {
  const ctx = await getAudioContext();
  if (!ctx) return;
  soundPluck(ctx, BASE_FREQUENCY, 0, 1.03);
  soundPluck(ctx, BASE_FREQUENCY / fraction, 1.22, 1.45);
  status.textContent = `Primero ${format(BASE_FREQUENCY)} Hz; después ${format(BASE_FREQUENCY / fraction)} Hz.`;
});

// Puente de integración opcional para ejercicios matemáticos posteriores.
window.addEventListener("monocordio-set-fraction", event => {
  const next = event.detail?.fraction;
  if (typeof next !== "number" || !Number.isFinite(next) ||
      next < 0.25 || next > 1) return;
  updateUI(next);
  status.textContent = "Puente ajustado desde el laboratorio: longitud " +
    describeFraction(next).lengthRatio + ". Pulsa la cuerda para escuchar.";
});

updateUI(INTERVALS[0].fraction);
