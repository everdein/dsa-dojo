import test from "node:test";
import assert from "node:assert/strict";
import {
  insertionSort,
  maximumInsertionSortValues,
  validateInsertionSortInput
} from "../sorting/insertion-sort.mjs";
import { buildInsertionSortTrace } from "../studio/src/insertion-sort.mjs";
import { buildValidatedTrace } from "../studio/src/lesson-contract.mjs";
import { insertionSortLesson } from "../studio/src/lessons/insertion-sort.mjs";

test("insertion-sort orders mixed, duplicate, negative, and nearly sorted values immutably", () => {
  for (const values of [[5, 2, 4, 6, 1, 3], [3, 3, 1], [-2, 7, -5], [1], [1, 2, 4, 3, 5]]) {
    const original = [...values];
    assert.deepEqual(insertionSort(values), [...values].sort((a, b) => a - b));
    assert.deepEqual(values, original);
  }
});

test("insertion-sort rejects malformed, sparse, nonfinite, and oversized input", () => {
  const sparse = Array(2); sparse[1] = 1;
  for (const values of [undefined, [], sparse, [1, Number.NaN], Array(maximumInsertionSortValues + 1).fill(1)]) {
    assert.throws(() => validateInsertionSortInput(values));
  }
});

test("insertion-sort trace grows its sorted prefix through shifts and inserts", () => {
  const trace = buildInsertionSortTrace([3, 1, 2]);
  assert.ok(trace.some(({ phase }) => phase === "choose-key"));
  assert.ok(trace.some(({ phase }) => phase === "shift"));
  assert.equal(trace.filter(({ phase }) => phase === "insert").length, 2);
  assert.deepEqual(trace.at(-1).result, [1, 2, 3]);
  assert.equal(trace.at(-1).sortedCount, 3);
});

test("insertion-sort lesson satisfies deterministic array ownership", () => {
  const trace = buildValidatedTrace(insertionSortLesson, insertionSortLesson.input.defaultValue);
  for (const property of ["values", "activeIndices", "ranges", "markers", "annotations", "changedIndices"]) {
    assert.equal(new Set(trace.map((step) => step.view[property])).size, trace.length, property);
  }
});
