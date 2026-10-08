import test from "node:test";
import assert from "node:assert/strict";
import {
  BASE_FREQUENCY, INTERVALS, MIN_FRACTION,
  normalizeFraction, frequencyForFraction, findInterval, describeFraction
} from "../core.mjs";

test("la cuerda completa produce 220 Hz y unísono", () => {
  assert.equal(BASE_FREQUENCY, 220);
  assert.equal(frequencyForFraction(1), 220);
  assert.equal(describeFraction(1).frequencyRatio, "1:1");
  assert.equal(findInterval(1).id, "unisono");
});

test("los cinco intervalos conservan la reciprocidad longitud-frecuencia", () => {
  for (const item of INTERVALS) {
    const state = describeFraction(item.fraction);
    assert.ok(Math.abs(state.relativeFrequency * state.fraction - 1) < 1e-12);
    assert.ok(Math.abs(state.frequencyHz - BASE_FREQUENCY * item.denominator / item.numerator) < 1e-9);
    assert.equal(state.lengthRatio, `${item.numerator}:${item.denominator}`);
    assert.equal(state.frequencyRatio, `${item.denominator}:${item.numerator}`);
    assert.equal(state.intervalName, item.name);
  }
});

test("quinta, cuarta, octava y tono de 9:8", () => {
  assert.equal(frequencyForFraction(2/3), 330);
  assert.ok(Math.abs(frequencyForFraction(3/4) - 220*4/3) < 1e-10);
  assert.equal(frequencyForFraction(1/2), 440);
  assert.equal(frequencyForFraction(8/9), 247.5);
});

test("posiciones fuera del rango y no finitas se normalizan", () => {
  assert.equal(normalizeFraction(0), MIN_FRACTION);
  assert.equal(normalizeFraction(1.5), 1);
  assert.equal(normalizeFraction(Number.NaN), 1);
  assert.equal(frequencyForFraction(0), 880);
  assert.equal(findInterval(0.82), null);
});

test("una frecuencia base no válida produce error", () => {
  assert.throws(() => frequencyForFraction(0.5, 0), RangeError);
  assert.throws(() => frequencyForFraction(0.5, Infinity), RangeError);
});
