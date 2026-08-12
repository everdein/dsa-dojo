import test from "node:test";
import assert from "node:assert/strict";
import {
  maximumBitValue,
  maximumSingleNumberValues,
  singleNumber,
  validateSingleNumberInput
} from "../bit-manipulation/single-number.mjs";
import { buildValidatedTrace } from "../studio/src/lesson-contract.mjs";
import { singleNumberLesson } from "../studio/src/lessons/single-number.mjs";
import { buildSingleNumberTrace } from "../studio/src/single-number.mjs";

test("single-number isolates the unique byte regardless of pair order", () => {
  for (const [values, expected] of [
    [[4], 4], [[4, 1, 2, 1, 2], 4], [[7, 3, 5, 3, 5, 9, 9], 7], [[0, 255, 8, 8, 255], 0]
  ]) assert.equal(singleNumber(values), expected);
});

test("single-number validates exact pair multiplicities and bounds", () => {
  const sparse = Array(3); sparse[0] = 1; sparse[2] = 1;
  for (const values of [[], [1, 2], [1, 1, 2, 2], [1, 1, 2, 3, 4, 4, 5], [1, 1, 1], sparse, [-1], [maximumBitValue + 1], Array(maximumSingleNumberValues + 2).fill(1)]) {
    assert.throws(() => validateSingleNumberInput(values));
  }
});

test("single-number trace exposes XOR updates and pair cancellations", () => {
  const trace = buildSingleNumberTrace([4, 1, 2, 1, 2]);
  assert.equal(trace.filter(({ phase }) => phase === "cancel-pair").length, 2);
  assert.deepEqual(trace.filter(({ phase }) => ["xor-value", "cancel-pair"].includes(phase)).map(({ accumulator }) => accumulator), [4, 5, 7, 6, 4]);
  assert.equal(trace.at(-1).result, 4);
});

test("single-number lesson is deterministic with fresh composite array snapshots", () => {
  for (const input of [singleNumberLesson.input.defaultValue, singleNumberLesson.input.sampleValue, { values: [0] }]) {
    const trace = buildValidatedTrace(singleNumberLesson, input);
    for (const panel of ["values", "accumulator"]) assert.equal(new Set(trace.map((step) => step.views[panel])).size, trace.length, panel);
  }
});
