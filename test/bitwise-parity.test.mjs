import test from "node:test";
import assert from "node:assert/strict";
import { maximumBitValue, parseBitValue, toFixedBits, validateBitValue } from "../bit-manipulation/model.mjs";
import { bitwiseParity } from "../bit-manipulation/parity.mjs";
import { buildBitwiseParityTrace } from "../studio/src/bitwise-parity.mjs";
import { buildValidatedTrace } from "../studio/src/lesson-contract.mjs";
import { bitwiseParityLesson } from "../studio/src/lessons/bitwise-parity.mjs";

test("bitwise parity agrees with modulo two across the byte domain", () => {
  for (let value = 0; value <= maximumBitValue; value += 1) {
    assert.deepEqual(bitwiseParity(value), { parity: value % 2 === 0 ? "even" : "odd", leastSignificantBit: value % 2 });
  }
  assert.deepEqual(toFixedBits(13), [0, 0, 0, 0, 1, 1, 0, 1]);
});

test("bit model rejects values outside its unsigned fixed-width domain", () => {
  for (const value of [-1, 1.5, NaN, Infinity, maximumBitValue + 1, "5", null]) assert.throws(() => validateBitValue(value));
  assert.equal(parseBitValue(" 13 "), 13);
  for (const value of ["", "   ", null, undefined]) {
    assert.throws(() => parseBitValue(value));
    assert.throws(() => bitwiseParityLesson.input.parse({ value }));
  }
});

test("parity trace exposes the least-significant-bit mask", () => {
  const trace = buildBitwiseParityTrace(13);
  assert.deepEqual(trace.map(({ phase }) => phase), ["initialize", "mask-lsb", "complete"]);
  assert.deepEqual(trace.at(-1).result, { parity: "odd", leastSignificantBit: 1 });
  assert.deepEqual(buildBitwiseParityTrace(42).at(-1).result, { parity: "even", leastSignificantBit: 0 });
});

test("parity lesson satisfies deterministic array ownership", () => {
  const trace = buildValidatedTrace(bitwiseParityLesson, bitwiseParityLesson.input.defaultValue);
  for (const property of ["values", "activeIndices", "ranges", "markers", "annotations", "changedIndices"]) {
    assert.equal(new Set(trace.map((step) => step.view[property])).size, trace.length, property);
  }
});
