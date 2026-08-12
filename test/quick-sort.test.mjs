import test from "node:test";
import assert from "node:assert/strict";
import {
  maximumQuickSortValues,
  partitionQuickSortRange,
  quickSort,
  validateQuickSortInput
} from "../sorting/quick-sort.mjs";
import {
  assertLesson,
  assertTrace,
  buildValidatedTrace
} from "../studio/src/lesson-contract.mjs";
import { quickSortLesson } from "../studio/src/lessons/quick-sort.mjs";
import {
  buildQuickSortTrace,
  quickSortRangeId
} from "../studio/src/quick-sort.mjs";

test("quick-sort orders representative arrays without mutating its input", () => {
  for (const values of [
    [8, 3, 1, 7, 0, 10, 2],
    [3, 3, 1, 3],
    [-2, 5, -7, 0],
    [1],
    [1, 2, 3, 4],
    [4, 3, 2, 1]
  ]) {
    const before = [...values];
    assert.deepEqual(quickSort(values), [...values].sort((left, right) => left - right));
    assert.deepEqual(values, before);
  }
});

test("quick-sort agrees with numeric sorting across a small exhaustive domain", () => {
  const alphabet = [-1, 0, 1];
  for (let length = 1; length <= 5; length += 1) {
    const count = alphabet.length ** length;
    for (let encoded = 0; encoded < count; encoded += 1) {
      let remaining = encoded;
      const values = Array.from({ length }, () => {
        const value = alphabet[remaining % alphabet.length];
        remaining = Math.floor(remaining / alphabet.length);
        return value;
      });
      assert.deepEqual(quickSort(values), [...values].sort((left, right) => left - right));
    }
  }
});

test("quick-sort rejects empty, sparse, non-array, nonfinite, and oversized inputs", () => {
  const sparse = Array(3);
  sparse[0] = 1;
  sparse[2] = 3;
  for (const values of [
    undefined,
    null,
    "3, 2, 1",
    [],
    sparse,
    [1, Number.NaN],
    [1, Infinity],
    Array(maximumQuickSortValues + 1).fill(1)
  ]) {
    assert.throws(() => validateQuickSortInput(values), /Quick Sort/);
    assert.throws(() => quickSort(values), /Quick Sort/);
  }
});

test("Lomuto partition places the final pivot between its two invariant regions", () => {
  const values = [99, 4, 2, 7, 3, 1, 5, -99];
  const pivotIndex = partitionQuickSortRange(values, 1, 6);
  assert.equal(pivotIndex, 5);
  assert.equal(values[pivotIndex], 5);
  assert.equal(values[0], 99);
  assert.equal(values[7], -99);
  assert.ok(values.slice(1, pivotIndex).every((value) => value <= 5));
  assert.ok(values.slice(pivotIndex + 1, 7).every((value) => value > 5));

  for (const bounds of [[0, 0], [-1, 1], [0, 8], [1.5, 3], [3, 2]]) {
    assert.throws(() => partitionQuickSortRange([4, 3, 2, 1], ...bounds), /partition bounds/);
  }
});

test("Quick Sort lesson declares the exact roadmap metadata and composite renderers", () => {
  assert.equal(assertLesson(quickSortLesson), quickSortLesson);
  assert.equal(quickSortLesson.id, "sorting/quick-sort");
  assert.equal(quickSortLesson.order, 45);
  assert.equal(quickSortLesson.topic, "Sorting");
  assert.deepEqual(quickSortLesson.prerequisites, ["arrays/reverse-array", "recursion/factorial"]);
  assert.deepEqual(quickSortLesson.patterns, ["sorting", "partition", "divide-and-conquer"]);
  assert.deepEqual(quickSortLesson.views, [
    { id: "values", renderer: "array", heading: "Working array" },
    { id: "calls", renderer: "branching", heading: "Recursive subranges" }
  ]);
  assert.deepEqual(quickSortLesson.input.parse({ values: " 3, -1, 2.5 " }), {
    values: [3, -1, 2.5]
  });
  assert.deepEqual(quickSortLesson.input.serialize({ values: [3, -0, 2.5] }), {
    values: "3, -0, 2.5"
  });
  assert.throws(() => quickSortLesson.input.parse({ values: "" }));
  assert.throws(() => quickSortLesson.input.parse({ values: "1, Infinity" }));
  assert.throws(() => quickSortLesson.input.parse({
    values: Array(maximumQuickSortValues + 1).fill("1").join(",")
  }));
});

test("quick-sort trace shows comparisons, both partition decisions, pivot placement, and returns", () => {
  const trace = buildQuickSortTrace([8, 3, 1, 7, 0, 10, 2]);
  for (const phase of [
    "initialize",
    "choose-pivot",
    "compare",
    "keep-right",
    "swap-left",
    "place-pivot",
    "divide",
    "base-case",
    "return-range",
    "complete"
  ]) {
    assert.ok(trace.some((step) => step.phase === phase), phase);
  }
  assert.ok(buildQuickSortTrace([1, 3, 2]).some((step) => step.phase === "keep-left"));
  assert.deepEqual(trace.at(-1).result, [0, 1, 2, 3, 7, 8, 10]);
  assert.deepEqual(trace.at(-1).values, trace.at(-1).result);
  assert.equal(trace.at(-1).settledCount, 7);
});

test("every scan and placed pivot preserves the documented partition invariant", () => {
  const trace = buildQuickSortTrace([8, 3, 1, 7, 0, 10, 2]);
  for (const step of trace) {
    if (step.phase === "compare") {
      const { activeStart, boundaryIndex, scanIndex, pivotValue, values } = step;
      assert.ok(values.slice(activeStart, boundaryIndex).every((value) => value <= pivotValue));
      assert.ok(values.slice(boundaryIndex, scanIndex).every((value) => value > pivotValue));
      assert.equal(step.decision, values[scanIndex] <= pivotValue ? "left" : "right");
    }
    if (step.phase === "place-pivot") {
      const { activeStart, activeEnd, pivotIndex, pivotValue, values } = step;
      assert.equal(values[pivotIndex], pivotValue);
      assert.ok(values.slice(activeStart, pivotIndex).every((value) => value <= pivotValue));
      assert.ok(values.slice(pivotIndex + 1, activeEnd + 1).every((value) => value > pivotValue));
    }
  }
});

test("balanced pivots produce logarithmic depth while ordered pivots expose the quadratic worst case", () => {
  const balanced = buildQuickSortTrace([1, 3, 2, 6, 5, 7, 4]).at(-1);
  assert.equal(balanced.comparisons, 10);
  assert.equal(balanced.partitions, 3);
  assert.equal(balanced.maximumDepth, 3);

  for (const values of [
    [1, 2, 3, 4, 5, 6, 7],
    [7, 6, 5, 4, 3, 2, 1],
    [4, 4, 4, 4, 4, 4, 4]
  ]) {
    const worst = buildQuickSortTrace(values).at(-1);
    assert.equal(worst.comparisons, 21);
    assert.equal(worst.partitions, 6);
    assert.equal(worst.maximumDepth, 7);
  }

  assert.match(quickSortLesson.complexity.explanation, /best and average time are O\(n log n\)/);
  assert.match(quickSortLesson.complexity.explanation, /O\(n\^2\) time/);
  assert.match(quickSortLesson.complexity.explanation, /worst case/);
});

test("quick-sort range ids and the recursive panel remain stable", () => {
  assert.equal(quickSortRangeId(0, 6), "range-0-6");
  assert.equal(quickSortRangeId(4, 4), "range-4-4");
  for (const bounds of [[-1, 0], [1, 0], [0.5, 2], [0, Infinity]]) {
    assert.throws(() => quickSortRangeId(...bounds), /range ids/);
  }

  const complete = buildQuickSortTrace([1, 3, 2, 6, 5, 7, 4]).at(-1);
  assert.equal(complete.views.calls.nodes.length, 7);
  assert.equal(complete.views.calls.edges.length, 6);
  assert.deepEqual(complete.views.calls.rootIds, ["range-0-6"]);
  assert.ok(complete.views.calls.states.some(({ nodeId, kind }) => (
    nodeId === "range-0-6" && kind === "sorted"
  )));
});

test("Quick Sort trace is deterministic, immutable, and solver-aligned under the full contract", () => {
  const input = { values: [8, 3, 1, 7, 0, 10, 2] };
  const before = structuredClone(input);
  const trace = buildValidatedTrace(quickSortLesson, input);
  assert.equal(assertTrace(trace, quickSortLesson), trace);
  assert.deepEqual(trace.at(-1).result, quickSort(input.values));
  assert.deepEqual(input, before);
  assert.deepEqual(buildQuickSortTrace(input.values), buildQuickSortTrace(input.values));

  const sampleTrace = buildValidatedTrace(quickSortLesson, quickSortLesson.input.sampleValue);
  assert.deepEqual(sampleTrace.at(-1).result, [1, 2, 3, 4, 5, 6, 7]);
  const singleton = buildValidatedTrace(quickSortLesson, { values: [5] });
  assert.deepEqual(singleton.map(({ phase }) => phase), ["initialize", "base-case", "complete"]);
});

test("Quick Sort trace owns every renderer and derived snapshot deeply", () => {
  const trace = buildQuickSortTrace([8, 3, 1, 7, 0, 10, 2]);
  for (const property of ["values", "swapIndices"]) {
    assert.equal(new Set(trace.map((step) => step[property])).size, trace.length, property);
  }
  for (const [panel, properties] of [
    ["values", ["values", "activeIndices", "ranges", "markers", "annotations", "changedIndices"]],
    ["calls", ["nodes", "edges", "rootIds", "activeNodeIds", "changedNodeIds", "states", "annotations", "pointers"]]
  ]) {
    assert.equal(new Set(trace.map((step) => step.views[panel])).size, trace.length, panel);
    for (const property of properties) {
      assert.equal(
        new Set(trace.map((step) => step.views[panel][property])).size,
        trace.length,
        `${panel}.${property}`
      );
    }
  }
  for (const [panel, properties] of [
    ["values", ["ranges", "markers", "annotations"]],
    ["calls", ["nodes", "edges", "states", "annotations", "pointers"]]
  ]) {
    for (const property of properties) {
      const objects = trace.flatMap((step) => step.views[panel][property]);
      assert.equal(new Set(objects).size, objects.length, `${panel}.${property} objects`);
    }
  }

  trace[2].views.values.ranges = trace[1].views.values.ranges;
  assert.throws(() => assertTrace(trace, quickSortLesson), /values.*ranges snapshot/);

  const nestedTrace = buildQuickSortTrace([8, 3, 1, 7, 0, 10, 2]);
  nestedTrace[2].views.calls.nodes[0] = nestedTrace[1].views.calls.nodes[0];
  assert.throws(() => assertTrace(nestedTrace, quickSortLesson), /calls.*nodes objects/);
});
