import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const ui = readFileSync(new URL("../armonia.mjs", import.meta.url), "utf8");
const bridge = readFileSync(new URL("../monocordio.mjs", import.meta.url), "utf8");
const css = readFileSync(new URL("../armonia.css", import.meta.url), "utf8");

test("los módulos del laboratorio se incluyen una única vez", () => {
  for (const asset of ["armonia.mjs", "armonia.css"]) {
    assert.equal(html.split("./" + asset).length - 1, 1, asset);
  }
});

test("todos los controles presentes tienen identificadores únicos", () => {
  const ids = [
    "tetraktys-diagram", "tetraktys-buttons",
    "tetraktys-reading", "tetraktys-play", "tetraktys-chord",
    "tetraktys-bridge", "tetraktys-status",
    "means-diagram", "means-buttons", "means-reading", "means-play",
    "means-compare", "means-bridge", "means-status"
  ];
  assert.equal(html.split('id="tetraktys-medias"').length - 1, 1);
  for (const id of ids) {
    const matches = html.match(new RegExp('id="' + id + '"', "g")) || [];
    assert.equal(matches.length, 1, id);
    assert.ok(ui.includes(id), "El controlador JS no conoce " + id);
  }
});

test("la conexión con el monocordio existe en ambos sentidos", () => {
  assert.ok(ui.includes('new CustomEvent("monocordio-set-fraction"'));
  assert.ok(bridge.includes('addEventListener("monocordio-set-fraction"'));
  assert.ok(ui.includes("tone.vibratingFraction"));
  assert.ok(bridge.includes("updateUI(next)"));
});

test("controles y representación gráfica preservan alternativas accesibles", () => {
  assert.match(html, /id="tetraktys-diagram"[^>]+role="img"/);
  assert.match(html, /id="means-diagram"[^>]+role="img"/);
  assert.match(html, /id="tetraktys-buttons"[^>]+role="group"/);
  assert.match(html, /id="means-buttons"[^>]+role="group"/);
  assert.ok(ui.includes('button.setAttribute("aria-pressed"'));
  assert.ok(ui.includes('button.addEventListener("click"'));
  assert.ok(css.includes("@media (max-width: 850px)"));
});
