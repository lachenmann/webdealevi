import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync, statSync} from "node:fs";
import {createHash} from "node:crypto";

const root=new URL("../fonts/",import.meta.url);

test("Leland local coincide exactamente con el original OFL verificado",()=>{
  const font=readFileSync(new URL("Leland.otf",root));
  assert.equal(font.length,89132);
  assert.equal(font.toString("ascii",0,4),"OTTO");
  assert.equal(createHash("sha256").update(font).digest("hex"),
    "293788a40584b1908e3a0f219833f6a13e9a1aaf671e08fd26ad18fad2631b35");
  const license=readFileSync(new URL("OFL-Leland.txt",root),"utf8");
  assert.match(license,/SIL OPEN FONT LICENSE/i);
  assert.match(license,/Reserved Font Name "Leland"/);
});

test("Ekmelos72 WOFF2 está íntegra y conserva la licencia OFL",()=>{
  const font=readFileSync(new URL("Ekmelos72edo.woff2",root));
  assert.equal(font.length,9912);
  assert.equal(font.toString("ascii",0,4),"wOF2");
  assert.equal(createHash("sha256").update(font).digest("hex"),
    "aebaa053922e3c77feb5b8ce102af02667de012c8fec4f85d741440989cfb864");
  const license=readFileSync(new URL("OFL-Ekmelos.txt",root),"utf8");
  assert.match(license,/SIL OPEN FONT LICENSE/i);
  assert.match(license,/Reserved Font Name "Ekmelos"/);
});

test("el grabado se aloja en fuentes locales y no modifica la frecuencia",()=>{
  const css=readFileSync(new URL("../notacion.css",import.meta.url),"utf8");
  const scene=readFileSync(new URL("../escala.mjs",import.meta.url),"utf8");
  const ui=readFileSync(new URL("../notacion-ui.mjs",import.meta.url),"utf8");
  assert.match(css,/fonts\/Leland\.otf/);
  assert.match(css,/fonts\/Ekmelos72edo\.woff2/);
  assert.ok(!css.includes("https://"));
  assert.ok(scene.includes("monocordio-music-notehead"));
  assert.ok(ui.includes("monocordio-music-clef"));
  assert.ok(ui.includes("String.fromCodePoint(0xE0A4)"));
  assert.ok(scene.includes("String.fromCodePoint(0xE050)"));
});
