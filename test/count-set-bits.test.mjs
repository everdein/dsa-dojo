import test from "node:test";
import assert from "node:assert/strict";
import { maximumBitValue } from "../bit-manipulation/model.mjs";
import { countSetBits } from "../bit-manipulation/count-set-bits.mjs";
import { buildCountSetBitsTrace } from "../studio/src/count-set-bits.mjs";
import { buildValidatedTrace } from "../studio/src/lesson-contract.mjs";
import { countSetBitsLesson } from "../studio/src/lessons/count-set-bits.mjs";

test("set-bit counter agrees with binary-string counts across the byte domain", () => {
  for (let value = 0; value <= maximumBitValue; value += 1) {
    assert.equal(countSetBits(value), value.toString(2).split("1").length - 1);
  }
});

test("set-bit counter inherits strict bit-value validation", () => {
  for (const value of [-1, 1.5, Infinity, maximumBitValue + 1, "3", null]) assert.throws(() => countSetBits(value));
  for (const value of ["", "   ", null, undefined]) {
    assert.throws(() => countSetBitsLesson.input.parse({ value }));
  }
});

test("set-bit trace clears one one-bit per iteration", () => {
  const trace = buildCountSetBitsTrace(180);
  const clears = trace.filter(({ phase }) => phase === "clear-lowest-one");
  assert.equal(clears.length, 4);
  assert.deepEqual(clears.map(({ count }) => count), [1, 2, 3, 4]);
  assert.deepEqual(clears.map(({ working }) => working), [176, 160, 128, 0]);
  assert.equal(trace.at(-1).result, 4);
  assert.deepEqual(buildCountSetBitsTrace(0).map(({ phase }) => phase), ["initialize", "complete"]);
});

test("set-bit lesson satisfies deterministic array ownership", () => {
  for (const input of [countSetBitsLesson.input.defaultValue, countSetBitsLesson.input.sampleValue, { value: 0 }]) {
    const trace = buildValidatedTrace(countSetBitsLesson, input);
    for (const property of ["values", "activeIndices", "ranges", "markers", "annotations", "changedIndices"]) {
      assert.equal(new Set(trace.map((step) => step.view[property])).size, trace.length, property);
    }
  }
});
