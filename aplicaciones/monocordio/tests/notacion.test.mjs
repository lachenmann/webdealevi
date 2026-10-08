import test from "node:test";
import assert from "node:assert/strict";
import {
  NOTATION_SYSTEMS, getSystem, decomposeCents,
  notationForNote, demonstrationForOffset,
  centsToFrequency, frequencyToCents,
  REFERENCE_C4_12TET, STANDARD_GLYPHS
} from "../notacion-core.mjs";
import {makeCollection,DIATONIC_STEPS,makeNote} from "../escala-core.mjs";

test("glifos y semántica SMuFL diferenciados por sistema",()=>{
  assert.deepEqual(NOTATION_SYSTEMS.map(x=>x.fractionCents),[50,100/3,25,200/3,400/3,150]);
  assert.equal(getSystem("quarter").upGlyph,0xE48E);
  assert.equal(getSystem("third").downGlyph,0xE48B);
  assert.equal(getSystem("sixth").upGlyph,0xE2A4);
  assert.equal(getSystem("eighth").upGlyph,null);
  assert.equal(getSystem("two-thirds").upGlyph,0xE48C);
  assert.equal(getSystem("three-quarters-grisey").downGlyph,0xE486);
  assert.equal(getSystem("three-quarters-grisey").upGlyph,null);
  assert.equal(STANDARD_GLYPHS["-1"],0xE260);
  assert.throws(()=>getSystem("seventh"),RangeError);
});

test("+64 cents se representa como cuarto de tono (+50) con residuo +14",()=>{
  const x=decomposeCents(64,"quarter");
  assert.equal(x.step,1);
  assert.equal(x.indicatedCents,50);
  assert.equal(x.residualCents,14);
  assert.equal(x.totalCents,x.indicatedCents+x.residualCents);
  assert.equal(x.glyphCodepoint,0xE48E);
});

test("desviación negativa sin confundir los signos",()=>{
  const x=decomposeCents(-64,"quarter");
  assert.equal(x.glyphCodepoint,0xE48F);
  assert.equal(x.indicatedCents,-50);
  assert.equal(x.residualCents,-14);
});

test("pequeñas desviaciones pitagóricas nunca se convierten en cuarto de tono",()=>{
  for(const step of DIATONIC_STEPS) {
    const note=makeNote(step);
    const x=notationForNote(note,"contemporary","quarter");
    assert.equal(x.step,0);
    assert.equal(x.residualCents,note.centsFrom12TET);
    assert.equal(x.frequencyHz,note.frequencyHz);
  }
});

test("modificar modo y subdivisión no cambia una sola frecuencia pitagórica",()=>{
  for(const note of makeCollection([-6,...DIATONIC_STEPS,6])){
    for(const system of NOTATION_SYSTEMS){
      const exact=notationForNote(note,"exact",system.id);
      const other=notationForNote(note,"contemporary",system.id);
      assert.equal(exact.frequencyHz,other.frequencyHz);
      assert.equal(exact.frequencyHz,note.frequencyHz);
      assert.ok(Math.abs(other.totalCents-other.indicatedCents-other.residualCents)<1e-12);
    }
  }
});

test("sextos, octavos y tercios: residuos correctos y caída textual",()=>{
  const sixth=decomposeCents(48,"sixth");
  assert.ok(Math.abs(sixth.residualCents-14.66666666667)<1e-8);
  const eighth=decomposeCents(32,"eighth");
  assert.equal(eighth.residualCents,7);
  assert.equal(eighth.isSmufl,false);
  assert.match(eighth.fallback,/⅛/);
  const third=decomposeCents(75,"third");
  assert.ok(Math.abs(third.residualCents-8.3333333333333)<1e-8);
  assert.equal(third.glyphCodepoint,0xE48A);
  const twoThirds=decomposeCents(133.3333333333333,"two-thirds");
  assert.equal(twoThirds.glyphCodepoint,0xE48C);
  assert.ok(Math.abs(twoThirds.residualCents)<1e-9);
  const grisey=decomposeCents(-150,"three-quarters-grisey");
  assert.equal(grisey.glyphCodepoint,0xE486);
  assert.equal(grisey.residualCents,0);
  const griseyUp=decomposeCents(150,"three-quarters-grisey");
  assert.equal(griseyUp.isSmufl,false);
  assert.match(griseyUp.fallback,/¾/);
});

test("frecuencia de Do4 temperado y redondeo reversible cents",()=>{
  assert.ok(Math.abs(REFERENCE_C4_12TET-261.6255653005986)<1e-9);
  for(const cents of [-80,-50,-24,0,25,33.333333333,64,80]){
    const demo=demonstrationForOffset(cents,"quarter");
    assert.ok(Math.abs(frequencyToCents(demo.frequencyHz,demo.referenceHz)-cents)<1e-9);
    assert.ok(Math.abs(demo.frequencyHz-centsToFrequency(demo.referenceHz,cents))<1e-11);
  }
});

test("rechazar datos no finitos y modos desconocidos",()=>{
  assert.throws(()=>decomposeCents(NaN,"quarter"),RangeError);
  assert.throws(()=>centsToFrequency(0,30),RangeError);
  assert.throws(()=>frequencyToCents(-3,440),RangeError);
  assert.throws(()=>notationForNote(makeNote(0),"falso"),RangeError);
});
