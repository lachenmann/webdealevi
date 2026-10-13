import test from "node:test";
import assert from "node:assert/strict";
import {
  NOTATION_SYSTEMS, getSystem, decomposeCents, notationForNote,
  demonstrationForOffset, centsToFrequency, frequencyToCents,
  REFERENCE_C4_12TET
} from "../notacion-core.mjs";
import {makeCollection,DIATONIC_STEPS,makeNote} from "../escala-core.mjs";

const close = (actual,expected,tolerance=1e-9) =>
  assert.ok(Math.abs(actual-expected)<tolerance,`${actual} difiere de ${expected}`);

test("sólo se ofrecen las cinco fracciones solicitadas: 1/2, 1/4, 1/6, 1/8 y 1/12",()=>{
  assert.deepEqual(NOTATION_SYSTEMS.map(item=>item.id),[
    "semitone","quarter","sixth","eighth","twelfth"
  ]);
  assert.deepEqual(NOTATION_SYSTEMS.map(item=>item.fractionCents),[
    100,50,100/3,25,50/3
  ]);
  assert.throws(()=>getSystem("third"),RangeError);
  assert.throws(()=>getSystem("quarter-ferneyhough"),RangeError);
});

test("el cuarto de tono descendente es bemol inverso SIN RELLENO",()=>{
  assert.equal(getSystem("quarter").downSign,"reverse-flat-outline");
  assert.equal(getSystem("quarter").upSign,"quarter-sharp");
  const down=decomposeCents(-50,"quarter");
  assert.equal(down.microSign,"reverse-flat-outline");
  assert.equal(down.standardSign,null);
  assert.equal(down.step,-1);
  assert.equal(down.residualCents,0);
  assert.equal(decomposeCents(50,"quarter").microSign,"quarter-sharp");
});

test("semitonos +/-100 usan signos convencionales",()=>{
  const up=decomposeCents(100,"semitone");
  const down=decomposeCents(-100,"semitone");
  assert.equal(up.standardSign,"sharp");
  assert.equal(down.standardSign,"flat");
  assert.equal(up.microSign,null);
  assert.equal(down.microSign,null);
  assert.equal(up.residualCents,0);
  assert.equal(down.residualCents,0);
});

test("sextos: rombo y pentágono de la lámina, 100/3 cents exactos",()=>{
  const down=decomposeCents(-100/3,"sixth");
  const up=decomposeCents(100/3,"sixth");
  assert.equal(down.microSign,"diamond");
  assert.equal(up.microSign,"pentagon");
  close(down.fractionalCents,-100/3);
  close(up.fractionalCents,100/3);
  close(down.residualCents,0);
  close(up.residualCents,0);
});

test("octavos +/-25 se especifican con una indicación 1/8 visible",()=>{
  const down=decomposeCents(-25,"eighth");
  const up=decomposeCents(25,"eighth");
  assert.equal(down.microSign,"eighth-down");
  assert.equal(up.microSign,"eighth-up");
  assert.match(down.fallback,/⅛/);
  assert.equal(up.residualCents,0);
});

test("doceavos +/-16⅔ y signos compactos de la lámina",()=>{
  const down=decomposeCents(-50/3,"twelfth");
  const up=decomposeCents(50/3,"twelfth");
  assert.equal(down.microSign,"triangle-half");
  assert.equal(up.microSign,"square");
  close(down.fractionalCents,-50/3);
  close(up.fractionalCents,50/3);
  close(down.residualCents,0);
  close(up.residualCents,0);
});

test("nota arbitraria +64 = cuarto de tono 50 + residual 14",()=>{
  const x=decomposeCents(64,"quarter");
  assert.equal(x.standardSign,null);
  assert.equal(x.microSign,"quarter-sharp");
  assert.equal(x.semitoneCents,0);
  assert.equal(x.fractionalCents,50);
  assert.equal(x.indicatedCents,50);
  assert.equal(x.residualCents,14);
});

test("alteraciones cromáticas compuestas no exigen residuales enormes",()=>{
  const up=decomposeCents(150,"quarter");
  const down=decomposeCents(-150,"quarter");
  assert.equal(up.standardSign,"sharp");
  assert.equal(up.microSign,"quarter-sharp");
  assert.equal(down.standardSign,"flat");
  assert.equal(down.microSign,"reverse-flat-outline");
  assert.equal(up.residualCents,0);
  assert.equal(down.residualCents,0);
  assert.equal(decomposeCents(200,"semitone").standardSign,"double-sharp");
  assert.equal(decomposeCents(-200,"semitone").standardSign,"double-flat");
});

test("cambio de grafía conserva frecuencias y separación total=semitonos+fracción+residuo",()=>{
  const notes=makeCollection([-6,...DIATONIC_STEPS,6]);
  for(const note of notes) {
    for(const unit of NOTATION_SYSTEMS){
      for(const mode of ["exact","contemporary"]){
        const p=notationForNote(note,mode,unit.id);
        assert.equal(p.frequencyHz,note.frequencyHz);
        close(p.semitoneCents+p.fractionalCents+p.residualCents,p.totalCents,1e-10);
      }
    }
  }
});

test("las alturas fuera de la escala también conservan frecuencia al cambiar sistema",()=>{
  for(const cents of [-170,-150,-100,-64,-33.3333333333,-25,-50/3,0,50/3,25,64,100,150,170]){
    const original=demonstrationForOffset(cents,"quarter").frequencyHz;
    for(const system of NOTATION_SYSTEMS){
      const state=demonstrationForOffset(cents,system.id);
      assert.equal(state.frequencyHz,original);
      close(state.totalCents,
        state.semitoneCents+state.fractionalCents+state.residualCents,1e-10);
      close(frequencyToCents(state.frequencyHz,state.referenceHz),cents,1e-9);
    }
  }
});

test("conservar referencia de La4 y frecuencia de Do4 temperado",()=>{
  close(REFERENCE_C4_12TET,261.6255653005986);
  for(const cents of [-100,-50,0,25,50,64,100]){
    const note=demonstrationForOffset(cents,"eighth");
    close(note.frequencyHz,centsToFrequency(REFERENCE_C4_12TET,cents),1e-10);
  }
});

test("modo exacto no introduce glifos fraccionarios",()=>{
  for(const note of makeCollection(DIATONIC_STEPS)){
    const model=notationForNote(note,"exact","twelfth");
    assert.equal(model.microSign,null);
    assert.equal(model.standardSign,null);
    assert.equal(model.totalCents,note.centsFrom12TET);
  }
});

test("datos no finitos y modos desconocidos se rechazan",()=>{
  assert.throws(()=>decomposeCents(NaN,"quarter"),RangeError);
  assert.throws(()=>centsToFrequency(0,10),RangeError);
  assert.throws(()=>frequencyToCents(-3,440),RangeError);
  assert.throws(()=>notationForNote(makeNote(0),"incorrecto"),RangeError);
});
