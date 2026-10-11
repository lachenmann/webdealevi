import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync, statSync} from "node:fs";
import {createHash} from "node:crypto";
import {
  ALEVI_VERSION,ALEVI_GLYPHS,ALEVI_CONVENTIONAL,ALEVI_MICROTONES,
  TICKS_PER_TONE,TONE_CENTS,aleviGlyphForCents
} from "../alevi-v05.mjs";
import {decomposeCents,notationForNote} from "../notacion-core.mjs";
import {renderNoteAccidentals} from "../notacion-glyphs.mjs";
import {makeCollection,DIATONIC_STEPS} from "../escala-core.mjs";

function mock() {
  const list=[];
  globalThis.document={
    createElementNS(_ns,tag){
      return {
        tagName:tag,attrs:{},children:[],textContent:"",
        setAttribute(k,v){this.attrs[k]=String(v)},
        append(...x){this.children.push(...x)}
      };
    }
  };
  const svg={children:list,append(x){list.push(x)}};
  return svg;
}
function withDocument(fn) {
  const before=globalThis.document;
  try {return fn(mock())}
  finally {
    if(before===undefined) delete globalThis.document;
    else globalThis.document=before;
  }
}

test("la fuente Alevi de taller es v0.5, sin duplicados ni pérdida de glifos",()=>{
  assert.equal(ALEVI_VERSION,"0.5");
  assert.equal(TONE_CENTS,200);
  assert.equal(TICKS_PER_TONE,24);
  assert.equal(ALEVI_GLYPHS.length,41);
  assert.equal(ALEVI_CONVENTIONAL.length,5);
  assert.equal(ALEVI_MICROTONES.length,36);
  assert.equal(new Set(ALEVI_GLYPHS.map(x=>x.codepoint)).size,41);
  assert.equal(new Set(ALEVI_GLYPHS.map(x=>x.ticks)).size,41);
  for(let cp=0xF000;cp<=0xF023;cp++)
    assert.ok(ALEVI_MICROTONES.some(x=>x.codepoint===cp),"Falta código "+cp.toString(16));
});

test("18 magnitudes, dos direcciones, cents exactos desde natural",()=>{
  const positives=ALEVI_MICROTONES.filter(x=>x.direction===1);
  const negatives=ALEVI_MICROTONES.filter(x=>x.direction===-1);
  assert.equal(positives.length,18);
  assert.equal(negatives.length,18);
  for(const tone of ALEVI_MICROTONES){
    assert.equal(aleviGlyphForCents(tone.cents)?.name,tone.name);
    assert.ok(Math.abs(tone.cents-tone.ticks*200/24)<1e-10);
  }
  assert.equal(aleviGlyphForCents(50).name,"toneQuarterUp");
  assert.equal(aleviGlyphForCents(-100/3).name,"toneSixthDown");
  assert.equal(aleviGlyphForCents(25).name,"toneEighthUp");
  assert.equal(aleviGlyphForCents(-50/3).name,"toneTwelfthDown");
  assert.equal(aleviGlyphForCents(150).name,"tone3of4Up");
  assert.equal(aleviGlyphForCents(-200).name,"accidentalDoubleFlat");
  assert.equal(aleviGlyphForCents(64),null,"No inventar un glifo para +64¢");
  assert.equal(aleviGlyphForCents(Infinity),null);
});

test("copia exacta del TTF experimental y procedencia documental",()=>{
  const folder=new URL("../fonts/alevi-v05/",import.meta.url);
  const font=readFileSync(new URL("AleviMicrotonal-V05.ttf",folder));
  assert.equal(statSync(new URL("AleviMicrotonal-V05.ttf",folder)).size,7252);
  assert.equal(font.toString("hex",0,4),"00010000");
  assert.equal(createHash("sha256").update(font).digest("hex"),
    "818cb679e73971b86404df4814360eff9e7f285ba295a712d08a4a3d1b3959ed");
  const csv=readFileSync(new URL("mapa.csv",folder),"utf8");
  for(const glyph of ALEVI_MICROTONES)
    assert.match(csv,new RegExp(glyph.name+",U\\+"
      +glyph.codepoint.toString(16).toUpperCase()+","));
  assert.match(readFileSync(new URL("ORIGEN.md",folder),"utf8"),
    /pendientes de auditoría/);
});

test("fusión tipográfica de semitono y cuarto no cambia los cents",()=>{
  withDocument(svg=>{
    const plan=decomposeCents(150,"quarter");
    assert.equal(plan.indicatedCents,150);
    assert.equal(plan.residualCents,0);
    const result=renderNoteAccidentals(svg,plan,{aleviReady:true,right:150,y:90});
    assert.deepEqual(result,["alevi:tone3of4Up"]);
    assert.equal(svg.children.length,1);
    assert.equal(svg.children[0].textContent,String.fromCodePoint(0xF014));
    assert.equal(svg.children[0].attrs["data-alevi-ticks"],"18");
  });
  withDocument(svg=>{
    const plan=decomposeCents(100/3,"sixth");
    const glyphs=renderNoteAccidentals(svg,{
      ...plan,baseAccidental:1
    },{aleviReady:true});
    assert.deepEqual(glyphs,["alevi:tone2of3Up"]);
    assert.equal(svg.children[0].attrs["data-alevi-codepoint"],"F012");
  });
});

test("se preservan los cents residuales y el respaldo SVG sin fuente",()=>{
  withDocument(svg=>{
    const plan=decomposeCents(64,"quarter");
    const glyphs=renderNoteAccidentals(svg,plan,{aleviReady:true});
    assert.deepEqual(glyphs,["alevi:toneQuarterUp"]);
    assert.equal(plan.totalCents,64);
    assert.equal(plan.residualCents,14);
  });
  withDocument(svg=>{
    const glyphs=renderNoteAccidentals(svg,decomposeCents(64,"quarter"),
      {aleviReady:false});
    assert.deepEqual(glyphs,["quarter-sharp"]);
  });
  for (const note of makeCollection(DIATONIC_STEPS)){
    const frequency=note.frequencyHz;
    for(const mode of ["exact","contemporary"]){
      const n=notationForNote(note,mode,"quarter");
      assert.equal(n.frequencyHz,frequency);
      assert.ok(Math.abs(
        n.semitoneCents+n.fractionalCents+n.residualCents-n.totalCents
      )<1e-9);
    }
  }
});

test("el navegador recibe la versión de fuente sin alterar el motor acústico",()=>{
  const root=new URL("../",import.meta.url);
  const html=readFileSync(new URL("index.html",root),"utf8");
  const css=readFileSync(new URL("notacion.css",root),"utf8");
  const ui=readFileSync(new URL("notacion-ui.mjs",root),"utf8");
  const renderer=readFileSync(new URL("notacion-glyphs.mjs",root),"utf8");
  assert.ok(html.includes('value="alevi-v05" selected'));
  assert.ok(html.includes('id="alevi-corpus-grid"'));
  assert.ok(html.includes("PIT-20261010-V05"));
  assert.ok(css.includes('./fonts/alevi-v05/AleviMicrotonal-V05.ttf'));
  assert.ok(ui.includes("monocordio-alevi-font-ready"));
  assert.ok(renderer.includes("aleviGlyphForCents"));
  assert.ok(!ui.includes("https://"));
});
