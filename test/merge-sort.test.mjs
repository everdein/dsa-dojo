import test from "node:test";
import assert from "node:assert/strict";
import {
  maximumMergeSortValues,
  mergeSortedValues,
  mergeSort,
  validateMergeSortInput
} from "../sorting/merge-sort.mjs";
import { buildValidatedTrace } from "../studio/src/lesson-contract.mjs";
import { mergeSortLesson } from "../studio/src/lessons/merge-sort.mjs";
import { buildMergeSortTrace } from "../studio/src/merge-sort.mjs";

test("merge-sort orders representative arrays without mutation", () => {
  for (const values of [[8, 3, 5, 4, 7, 6, 1, 2], [3, 3, 1], [-2, 5, -7, 0], [1], [1, 2, 3]]) {
    const original = [...values];
    assert.deepEqual(mergeSort(values), [...values].sort((a, b) => a - b));
    assert.deepEqual(values, original);
  }
  assert.deepEqual(mergeSortedValues([1, 4, 8], [2, 3, 9]), [1, 2, 3, 4, 8, 9]);
});

test("merge-sort rejects malformed dense-array inputs", () => {
  const sparse = Array(2); sparse[0] = 1;
  for (const values of [undefined, [], sparse, [1, Infinity], Array(maximumMergeSortValues + 1).fill(1)]) {
    assert.throws(() => validateMergeSortInput(values));
  }
});

test("merge-sort trace exposes divide, singleton, buffer-write, and merge phases", () => {
  const trace = buildMergeSortTrace([4, 1, 3, 2]);
  for (const phase of ["divide", "base-case", "prepare-merge", "take-left", "take-right", "finish-merge", "complete"]) {
    assert.ok(trace.some((step) => step.phase === phase), phase);
  }
  assert.deepEqual(trace.at(-1).result, [1, 2, 3, 4]);
  assert.equal(trace.at(-1).splits, 3);
  assert.equal(trace.at(-1).merges, 3);
});

test("merge-sort lesson is deterministic with deeply fresh composite snapshots", () => {
  const trace = buildValidatedTrace(mergeSortLesson, mergeSortLesson.input.defaultValue);
  for (const panel of ["values", "calls"]) {
    assert.equal(new Set(trace.map((step) => step.views[panel])).size, trace.length, panel);
  }
});
