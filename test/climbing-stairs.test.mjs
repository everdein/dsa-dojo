import test from "node:test";
import assert from "node:assert/strict";
import {
  climbingStairsTable,
  climbStairs,
  maximumClimbingStairsInput,
  parseClimbingStairsInput,
  validateClimbingStairsInput
} from "../dynamic-programming/climbing-stairs.mjs";
import { buildClimbingStairsTrace } from "../studio/src/climbing-stairs.mjs";
import { buildValidatedTrace } from "../studio/src/lesson-contract.mjs";
import { climbingStairsLesson } from "../studio/src/lessons/climbing-stairs.mjs";

test("climbing stairs returns its canonical sequence and full table", () => {
  assert.deepEqual(Array.from({ length: 11 }, (_, steps) => climbStairs(steps)), [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89]);
  assert.deepEqual(climbingStairsTable(6), [1, 1, 2, 3, 5, 8, 13]);
  assert.ok(Number.isSafeInteger(climbStairs(maximumClimbingStairsInput)));
});

test("climbing stairs rejects out-of-domain values", () => {
  for (const value of [-1, 1.5, NaN, Infinity, maximumClimbingStairsInput + 1, "5", null]) assert.throws(() => validateClimbingStairsInput(value));
  assert.equal(parseClimbingStairsInput(" 10 "), 10);
  for (const value of ["", "   ", null, undefined]) {
    assert.throws(() => parseClimbingStairsInput(value));
    assert.throws(() => climbingStairsLesson.input.parse({ steps: value }));
  }
});

test("climbing-stairs trace exposes bases, transitions, and state compression", () => {
  const trace = buildClimbingStairsTrace(6);
  for (const phase of ["base-zero", "base-one", "transition", "compress", "complete"]) assert.ok(trace.some((step) => step.phase === phase), phase);
  assert.equal(trace.at(-1).result, 13);
  assert.equal(trace.at(-1).transitions, 5);
  assert.deepEqual(buildClimbingStairsTrace(0).map(({ phase }) => phase), ["base-zero", "complete"]);
});

test("climbing-stairs lesson is deterministic with fresh table and rolling-state panels", () => {
  for (const input of [climbingStairsLesson.input.defaultValue, climbingStairsLesson.input.sampleValue, { steps: 0 }]) {
    const trace = buildValidatedTrace(climbingStairsLesson, input);
    for (const panel of ["table", "state"]) assert.equal(new Set(trace.map((step) => step.views[panel])).size, trace.length, panel);
  }
});
