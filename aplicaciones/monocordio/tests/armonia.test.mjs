import test from "node:test";
import assert from "node:assert/strict";
import {
  TETRAKTYS_ROWS, TETRAKTYS_TOTAL, MEAN_TERMS, MEAN_ENDPOINTS,
  simplifyRatio, arithmeticMean, harmonicMean, geometricMean,
  buildTetraktys, buildMeanSeries, meanIdentity, frequencyRatioBetween
} from "../armonia-core.mjs";
import {BASE_FREQUENCY, frequencyForFraction, describeFraction} from "../core.mjs";

test("la tetraktys tiene diez puntos repartidos en cuatro filas", () => {
  assert.deepEqual(TETRAKTYS_ROWS, [1, 2, 3, 4]);
  assert.equal(TETRAKTYS_TOTAL, 10);
  assert.equal(buildTetraktys().reduce((sum, item) => sum + item.rowDots, 0), 10);
});

test("la tetraktys sonora representa 1:2:3:4 en frecuencias y 1, 1/2, 1/3, 1/4 en longitudes", () => {
  const tones = buildTetraktys();
  assert.deepEqual(tones.map(t => t.frequencyHz), [220, 440, 660, 880]);
  assert.deepEqual(tones.map(t => t.frequencyRatio), ["1:1", "2:1", "3:1", "4:1"]);
  assert.deepEqual(tones.map(t => t.lengthRatio), ["1:1", "1:2", "1:3", "1:4"]);
  assert.deepEqual(tones.map(t => t.vibratingFraction), [1, 1/2, 1/3, 1/4]);
  for (const tone of tones) {
    assert.ok(Math.abs(frequencyForFraction(tone.vibratingFraction) - tone.frequencyHz) < 1e-10);
  }
});

test("medias entre 6 y 12: armónica = 8, aritmética = 9, geométrica intermedia", () => {
  const identity = meanIdentity();
  assert.deepEqual(MEAN_ENDPOINTS, [6, 12]);
  assert.deepEqual(MEAN_TERMS, [6, 8, 9, 12]);
  assert.equal(identity.harmonic, 8);
  assert.equal(identity.arithmetic, 9);
  assert.ok(identity.geometric > identity.harmonic && identity.geometric < identity.arithmetic);
  assert.equal(arithmeticMean(6, 12), 9);
  assert.equal(harmonicMean(6, 12), 8);
  assert.ok(Math.abs(geometricMean(6, 12) - Math.sqrt(72)) < 1e-12);
});

test("6:8:9:12: octava, quintas, cuartas y tono pitagórico 9:8", () => {
  assert.deepEqual(buildMeanSeries().map(t => t.number), [6, 8, 9, 12]);
  assert.equal(frequencyRatioBetween(6, 12).text, "2:1");
  assert.equal(frequencyRatioBetween(6, 8).text, "4:3");
  assert.equal(frequencyRatioBetween(6, 9).text, "3:2");
  assert.equal(frequencyRatioBetween(8, 12).text, "3:2");
  assert.equal(frequencyRatioBetween(9, 12).text, "4:3");
  assert.equal(frequencyRatioBetween(8, 9).text, "9:8");
  const i = meanIdentity();
  assert.equal(i.middleFrequencyRatio.text, "9:8");
  assert.equal(i.octaveFrequencyRatio.text, "2:1");
  assert.equal(i.fourthFrequencyRatio.text, "4:3");
  assert.equal(i.fifthFrequencyRatio.text, "3:2");
});

test("las medias usan 220 Hz como primer término y respetan el puente del monocordio", () => {
  const expected = [
    ["1:1", "1:1", 220, "Unísono"],
    ["4:3", "3:4", 220*4/3, "Cuarta justa"],
    ["3:2", "2:3", 330, "Quinta justa"],
    ["2:1", "1:2", 440, "Octava"]
  ];
  for (const [i, tone] of buildMeanSeries(BASE_FREQUENCY).entries()) {
    const [freqRatio, lengthRatio, hz, interval] = expected[i];
    assert.equal(tone.frequencyRatio, freqRatio);
    assert.equal(tone.lengthRatio, lengthRatio);
    assert.ok(Math.abs(tone.frequencyHz - hz) < 1e-10);
    const fromBridge = describeFraction(tone.vibratingFraction);
    assert.ok(Math.abs(fromBridge.frequencyHz - tone.frequencyHz) < 1e-10);
    assert.equal(fromBridge.intervalName, interval);
  }
});

test("cambiar frecuencia fundamental conserva todas las relaciones", () => {
  for (const base of [110, 220, 330]) {
    for (const tone of buildMeanSeries(base)) {
      assert.ok(Math.abs(tone.frequencyHz - base/tone.vibratingFraction) < 1e-9);
    }
    for (const tone of buildTetraktys(base)) {
      assert.ok(Math.abs(tone.frequencyHz - base/tone.vibratingFraction) < 1e-9);
    }
  }
});

test("fracciones se reducen sin aproximación e inputs inválidos se rechazan", () => {
  assert.equal(simplifyRatio(9, 6).text, "3:2");
  assert.equal(simplifyRatio(6, 8).text, "3:4");
  assert.throws(() => simplifyRatio(2.5, 1), RangeError);
  assert.throws(() => simplifyRatio(6, 0), RangeError);
  assert.throws(() => arithmeticMean(-6, 12), RangeError);
  assert.throws(() => harmonicMean(0, 12), RangeError);
  assert.throws(() => geometricMean(6, Infinity), RangeError);
  assert.throws(() => buildTetraktys(0), RangeError);
  assert.throws(() => buildMeanSeries(NaN), RangeError);
});
