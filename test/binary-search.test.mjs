import test from "node:test";
import assert from "node:assert/strict";
import {
  binarySearch,
  maximumBinarySearchValues,
  validateBinarySearchInput
} from "../searching/binary-search.mjs";
import { buildBinarySearchTrace } from "../studio/src/binary-search.mjs";
import { buildValidatedTrace } from "../studio/src/lesson-contract.mjs";
import { binarySearchLesson } from "../studio/src/lessons/binary-search.mjs";

test("binary-search finds present values and reports missing ones without mutation", () => {
  const cases = [
    [[1], 1, 0],
    [[1], 2, -1],
    [[-4, 1, 3, 7, 9, 12], -4, 0],
    [[-4, 1, 3, 7, 9, 12], 12, 5],
    [[-4, 1, 3, 7, 9, 12], 7, 3],
    [[1, 2, 2, 2, 3], 2, 2],
    [[1, 3, 5, 7], 4, -1]
  ];
  for (const [values, target, expected] of cases) {
    const original = [...values];
    assert.equal(binarySearch(values, target), expected);
    assert.deepEqual(values, original);
  }
});

test("binary-search rejects malformed, unsorted, nonfinite, and oversized inputs", () => {
  const sparse = Array(2);
  sparse[0] = 1;
  for (const [values, target] of [
    [undefined, 1],
    [[], 1],
    [[2, 1], 1],
    [sparse, 1],
    [[1, Infinity], 1],
    [[1, 2], Number.NaN],
    [Array.from({ length: maximumBinarySearchValues + 1 }, (_, index) => index), 1]
  ]) {
    assert.throws(() => validateBinarySearchInput(values, target));
  }
});

test("binary-search trace halves the candidate range and aligns with the solver", () => {
  const input = { values: [1, 3, 5, 7, 9, 11, 13], target: 11 };
  const trace = buildBinarySearchTrace(input);
  const comparisons = trace.filter(({ phase }) => phase === "compare");
  assert.ok(comparisons.length <= Math.ceil(Math.log2(input.values.length)) + 1);
  assert.equal(trace.at(-1).result, binarySearch(input.values, input.target));
  assert.ok(trace.some(({ phase }) => phase === "discard-left"));
  assert.ok(trace.some(({ phase }) => phase === "found"));
});

test("binary-search not-found trace ends with an empty candidate range", () => {
  const trace = buildBinarySearchTrace({ values: [1, 3, 5, 7], target: 4 });
  assert.equal(trace.at(-1).result, -1);
  assert.equal(trace.at(-1).candidateCount, 0);
});

test("binary-search lesson parses sorted custom input and owns deterministic snapshots", () => {
  assert.deepEqual(binarySearchLesson.input.parse({ values: "-2, 0, 4", target: "4" }), {
    values: [-2, 0, 4],
    target: 4
  });
  assert.throws(() => binarySearchLesson.input.parse({ values: "2, 1", target: "1" }), /sorted/);
  const trace = buildValidatedTrace(binarySearchLesson, binarySearchLesson.input.defaultValue);
  for (const property of ["values", "activeIndices", "ranges", "markers", "annotations", "changedIndices"]) {
    assert.equal(new Set(trace.map((step) => step.view[property])).size, trace.length, property);
  }
});
