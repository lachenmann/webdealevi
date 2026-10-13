import test from "node:test";
import assert from "node:assert/strict";
import {
  REFERENCE_A4, PYTHAGOREAN_C4, DIATONIC_STEPS,
  ratioOfFifths, makeNote, makeCollection, nextFifth,
  PYTHAGOREAN_COMMA
} from "../escala-core.mjs";

test("relaciones pitagóricas de la escala diatónica con Fa por quinta descendente", () => {
  const expected = {
    C4: [1, 1], D4: [9, 8], E4: [81, 64], F4: [4, 3],
    G4: [3, 2], A4: [27, 16], B4: [243, 128]
  };
  const scale = makeCollection(DIATONIC_STEPS);
  assert.deepEqual(scale.map(n => n.name), Object.keys(expected));
  for (const note of scale) {
    assert.deepEqual([note.ratioNumerator, note.ratioDenominator], expected[note.name]);
    assert.ok(note.ratio >= 1 && note.ratio < 2);
  }
});

test("La4 se conserva exactamente a 440 Hz; el La3 del monocordio a 220", () => {
  assert.ok(Math.abs(PYTHAGOREAN_C4 * 27/16 - REFERENCE_A4) < 1e-10);
  assert.ok(Math.abs(makeNote(3).frequencyHz - 440) < 1e-10);
  assert.ok(Math.abs(makeNote(3).centsFrom12TET) < 1e-9);
});

test("correcciones microtonales expresadas frente a temperamento igual con La4=440", () => {
  // Re4 es aproximadamente 1.955 cents más grave que Re4 de 12-TET.
  assert.ok(Math.abs(makeNote(2).centsFrom12TET + 1.955) < 0.01);
  // Mi4 es aproximadamente 1.955 cents más agudo.
  assert.ok(Math.abs(makeNote(4).centsFrom12TET - 1.955) < 0.01);
  assert.ok(Math.abs(makeNote(0).centsFrom12TET + 5.865) < 0.01);
});

test("Fa sostenido y Sol bemol no se identifican: coma pitagórica", () => {
  const sharp = makeNote(6);
  const flat = makeNote(-6);
  assert.equal(sharp.name, "F♯4");
  assert.equal(flat.name, "G♭4");
  assert.ok(sharp.frequencyHz > flat.frequencyHz);
  assert.ok(Math.abs(sharp.frequencyHz / flat.frequencyHz - 531441/524288) < 1e-12);
  assert.ok(Math.abs(PYTHAGOREAN_COMMA.cents - 23.460) < 0.002);
  assert.equal(PYTHAGOREAN_COMMA.numerator, 531441);
  assert.equal(PYTHAGOREAN_COMMA.denominator, 524288);
});

test("quinta ascendente y descendente, reducción de octava y límites", () => {
  assert.deepEqual([ratioOfFifths(1).numerator, ratioOfFifths(1).denominator], [3, 2]);
  assert.deepEqual([ratioOfFifths(-1).numerator, ratioOfFifths(-1).denominator], [4, 3]);
  assert.deepEqual(nextFifth([0], 1), [0, 1]);
  assert.deepEqual(nextFifth([0], -1), [0, -1]);
  assert.equal(nextFifth(DIATONIC_STEPS, 1)?.at(-1), 6);
  assert.equal(nextFifth([6], 1), null);
  assert.equal(nextFifth([-6], -1), null);
  assert.throws(() => ratioOfFifths(13), RangeError);
  assert.throws(() => makeCollection([]), RangeError);
});
