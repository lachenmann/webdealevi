import test from "node:test";
import assert from "node:assert/strict";
import {
  BASE_FREQUENCY, INTERVALS, INTERVAL_GROUPS, MIN_FRACTION,
  normalizeFraction, frequencyForFraction, findInterval, describeFraction
} from "../core.mjs";

test("la cuerda completa produce 220 Hz y unísono", () => {
  assert.equal(BASE_FREQUENCY, 220);
  assert.equal(frequencyForFraction(1), 220);
  assert.equal(describeFraction(1).frequencyRatio, "1:1");
  assert.equal(findInterval(1).id, "unisono");
});

test("el catálogo ampliado conserva razones exactas de longitud y frecuencia", () => {
  for (const item of INTERVALS) {
    const state = describeFraction(item.fraction);
    assert.ok(Math.abs(state.relativeFrequency * state.fraction - 1) < 1e-12);
    assert.ok(Math.abs(state.frequencyHz - BASE_FREQUENCY * item.denominator / item.numerator) < 1e-9);
    assert.equal(state.lengthRatio, `${item.numerator}:${item.denominator}`);
    assert.equal(state.frequencyRatio, `${item.denominator}:${item.numerator}`);
    assert.equal(state.intervalName, item.name);
  }
});

test("los 19 intervalos son pitagóricos y representables por el puente", () => {
  assert.equal(INTERVALS.length, 19);
  assert.equal(INTERVAL_GROUPS.length, 5);
  const ids = new Set(INTERVALS.map(interval => interval.id));
  assert.equal(ids.size, 19);
  for (const item of INTERVALS) {
    assert.ok(item.fraction >= MIN_FRACTION && item.fraction <= 1, item.id);
    assert.ok(INTERVAL_GROUPS.some(group => group.id === item.group));
    for (const integer of [item.numerator, item.denominator]) {
      assert.ok(Number.isSafeInteger(integer) && integer > 0, item.id);
      let n = integer;
      for(const divisor of [2,3]) while(n % divisor === 0) n /= divisor;
      assert.equal(n, 1, item.id + " contiene un factor distinto de 2 o 3");
    }
    assert.equal(findInterval(item.fraction)?.id, item.id);
  }
});

test("limma, apótome, coma y tritonos difieren según razón exacta", () => {
  const byId = id => INTERVALS.find(item => item.id === id);
  assert.equal(byId("limma").numerator, 243);
  assert.equal(byId("limma").denominator, 256);
  assert.equal(byId("apotome").numerator, 2048);
  assert.equal(byId("apotome").denominator, 2187);
  assert.equal(byId("coma").numerator, 524288);
  assert.equal(byId("coma").denominator, 531441);
  assert.ok(frequencyForFraction(byId("cuarta-aumentada").fraction)
    > frequencyForFraction(byId("quinta-disminuida").fraction));
  assert.equal(frequencyForFraction(byId("doble-octava").fraction), 880);
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
