import test from "node:test";
import assert from "node:assert/strict";
import {
  bubbleSort,
  maximumBubbleSortValues,
  validateBubbleSortInput
} from "../sorting/bubble-sort.mjs";
import { buildBubbleSortTrace } from "../studio/src/bubble-sort.mjs";
import { buildValidatedTrace } from "../studio/src/lesson-contract.mjs";
import { bubbleSortLesson } from "../studio/src/lessons/bubble-sort.mjs";

test("bubble-sort orders mixed, duplicate, negative, and boundary inputs immutably", () => {
  for (const values of [[5, 1, 4, 2, 8], [3, 3, 1], [-2, 7, -5], [1], [1, 2, 3]]) {
    const original = [...values];
    assert.deepEqual(bubbleSort(values), [...values].sort((a, b) => a - b));
    assert.deepEqual(values, original);
  }
});

test("bubble-sort rejects malformed, sparse, nonfinite, and oversized input", () => {
  const sparse = Array(2); sparse[0] = 1;
  for (const values of [undefined, [], sparse, [1, Infinity], Array(maximumBubbleSortValues + 1).fill(1)]) {
    assert.throws(() => validateBubbleSortInput(values));
  }
});

test("bubble-sort trace exposes comparisons, swaps, settled suffix, and early exit", () => {
  const trace = buildBubbleSortTrace([3, 2, 1]);
  assert.ok(trace.some(({ phase }) => phase === "compare"));
  assert.ok(trace.some(({ phase }) => phase === "swap"));
  assert.deepEqual(trace.at(-1).result, [1, 2, 3]);
  const sorted = buildBubbleSortTrace([1, 2, 3, 4]);
  assert.equal(sorted.filter(({ phase }) => phase === "finish-pass").length, 1);
  assert.equal(sorted.at(-1).comparisons, 3);
});

test("bubble-sort lesson satisfies deterministic array ownership", () => {
  const trace = buildValidatedTrace(bubbleSortLesson, bubbleSortLesson.input.defaultValue);
  for (const property of ["values", "activeIndices", "ranges", "markers", "annotations", "changedIndices"]) {
    assert.equal(new Set(trace.map((step) => step.view[property])).size, trace.length, property);
  }
});
