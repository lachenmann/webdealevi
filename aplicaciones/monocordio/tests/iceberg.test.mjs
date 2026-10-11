import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const root=new URL("../",import.meta.url);
const html=readFileSync(new URL("index.html",root),"utf8");
const css=readFileSync(new URL("estilos.css",root),"utf8");
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);

test("cinco estratos progresivos: sonido, tetraktys, escala, medias, notación",()=>{
  const items=[
    ['class="instrument-panel',"Monocordio"],
    ['id="tetraktys-medias"',"Tetraktys"],
    ['id="laboratorio-escala"',"Escala"],
    ['id="laboratorio-medias"',"Medias"],
    ['id="laboratorio-notacion"',"Notación"]
  ];
  const positions=items.map(([marker])=>html.indexOf(marker));
  for(let i=0;i<positions.length;i++){
    assert.ok(positions[i]>=0,items[i][1]+" ausente");
    if(i>0)assert.ok(positions[i]>positions[i-1],items[i][1]+" fuera de orden");
  }
  assert.ok(html.indexOf('id="pythagorean-notes"')<
    html.indexOf('id="notation-mode"'),"las notas deben explorarse antes de su escritura técnica");
  assert.ok(html.indexOf('id="fraction-lab"')<
    html.indexOf('id="alevi-corpus-grid"'),"corpus de 41 glifos al fondo");
});

test("se conservan los 75 controles e identificadores del laboratorio previo",()=>{
  const required=[
    "monochord","length-control","ratio-groups","play-current","play-compare",
    "length-value","frequency-value","frequency-ratio",
    "tetraktys-diagram","tetraktys-buttons","tetraktys-reading",
    "tetraktys-play","tetraktys-chord","tetraktys-bridge",
    "fifths-chain","build-diatonic","show-comma","pythagorean-notes",
    "play-pythagorean-scale","comma-cents","means-diagram","means-buttons",
    "means-play","means-compare","means-bridge",
    "notation-mode","fraction-system","notation-typeface",
    "notation-engine-state","pythagorean-score","fraction-score",
    "notation-key-svg","alevi-corpus-grid","demo-cents",
    "demo-residual","play-demo-note","formula-title"
  ];
  assert.equal(new Set(ids).size,ids.length,"identificadores DOM duplicados");
  for(const id of required)
    assert.equal(ids.filter(x=>x===id).length,1,"Ausente o duplicado: "+id);
});

test("notas pedagógicas nativas, cerradas por defecto y navegables por teclado",()=>{
  const opening=[...html.matchAll(/<details\b([^>]*)>/g)];
  const summaries=[...html.matchAll(/<summary\b[^>]*>/g)];
  assert.ok(opening.length>=11,"Deben existir al menos diez notas y el corpus");
  assert.equal(opening.length,summaries.length,"Cada desplegable tiene un encabezado");
  for(const [,attr] of opening){
    assert.ok(!/\bopen\b/.test(attr),"No abrir contenido técnico por defecto");
  }
  const notes=[
    "¿Por qué cambia el sonido","¿Cómo funciona la tetraktys?",
    "¿Cómo se construye una escala","¿Por qué Fa",
    "¿Por qué Fa♯ y Sol♭","¿Cómo se calculan las dos medias?",
    "¿Qué es un cent?","¿Cómo se leen las alteraciones",
    "¿Cuál es el fundamento físico"
  ];
  for(const x of notes)assert.ok(html.includes(x),"Falta nota: "+x);
  assert.match(css,/\.pedagogical-note summary:focus-visible/);
});

test("sólo las consonancias fundamentales se despliegan en la superficie",()=>{
  const player=readFileSync(new URL("monocordio.mjs",root),"utf8");
  assert.match(player,/panel\.open = group\.id === "fundamentales";/);
  assert.match(html,/Elige un intervalo para escuchar/);
  assert.match(html,/abre las otras familias de intervalos/);
});

test("la versión iceberg mantiene Alevi v0.5 y el modelo acústico intactos",()=>{
  assert.match(html,/PIT-20261010-V05/);
  assert.match(html,/value="alevi-v05" selected/);
  assert.match(html,/data-offset="150"/);
  assert.match(html,/data-offset="-150"/);
  assert.match(html,/f′ \/ f₀ = L \/ L′ = 1 \/ x/);
  const model=readFileSync(new URL("notacion-core.mjs",root),"utf8");
  assert.match(model,/function decomposeCents/);
  const player=readFileSync(new URL("armonia.mjs",root),"utf8");
  assert.match(player,/tetraktys-play/);
  assert.match(player,/means-play/);
});
