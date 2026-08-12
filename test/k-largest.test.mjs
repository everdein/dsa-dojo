import test from "node:test";
import assert from "node:assert/strict";
import {
  kLargest,
  maximumKLargestValues,
  validateKLargestInput
} from "../heaps-and-priority-queues/k-largest.mjs";
import {
  siftDownMinHeap,
  siftUpMinHeap
} from "../heaps-and-priority-queues/heap-operations.mjs";
import {
  buildKLargestTrace,
  heapSlotId
} from "../studio/src/k-largest.mjs";
import {
  assertLesson,
  assertTrace,
  buildValidatedTrace
} from "../studio/src/lesson-contract.mjs";
import { kLargestLesson } from "../studio/src/lessons/k-largest.mjs";

test("kLargest keeps bounded candidates and returns them descending without mutation", () => {
  const values = [3, 2, 1, 5, 6, 4];
  const before = [...values];
  assert.deepEqual(kLargest(values, 2), [6, 5]);
  assert.deepEqual(values, before);
});

test("kLargest handles duplicates, negatives, k one, and k equal to input length", () => {
  assert.deepEqual(kLargest([5, 1, 5, 3, 5], 3), [5, 5, 5]);
  assert.deepEqual(kLargest([-8, -2, -5, -1, -3], 3), [-1, -2, -3]);
  assert.deepEqual(kLargest([3, -1, 8, 8], 1), [8]);
  assert.deepEqual(kLargest([3, -1, 8], 3), [8, 3, -1]);
});

test("kLargest rejects malformed arrays and invalid k values", () => {
  const sparse = Array(3);
  sparse[0] = 1;
  sparse[2] = 3;
  for (const values of [
    undefined,
    null,
    [],
    sparse,
    [1, Number.NaN],
    [1, Infinity],
    Array.from({ length: maximumKLargestValues + 1 }, (_, index) => index)
  ]) {
    assert.throws(() => validateKLargestInput(values, 1), /K Largest Elements/);
    assert.throws(() => kLargest(values, 1), /K Largest Elements/);
  }
  for (const k of [undefined, null, 0, -1, 1.5, 4, Number.NaN, "2"]) {
    assert.throws(() => validateKLargestInput([1, 2, 3], k), /K must/);
    assert.throws(() => kLargest([1, 2, 3], k), /K must/);
  }
});

test("kLargest agrees with sorting across deterministic exhaustive small inputs", () => {
  const alphabet = [-2, -0, 1, 3];
  for (let length = 1; length <= 6; length += 1) {
    const caseCount = alphabet.length ** length;
    for (let encoded = 0; encoded < caseCount; encoded += 1) {
      let cursor = encoded;
      const values = [];
      for (let index = 0; index < length; index += 1) {
        values.push(alphabet[cursor % alphabet.length]);
        cursor = Math.floor(cursor / alphabet.length);
      }
      for (let k = 1; k <= length; k += 1) {
        const expected = [...values].sort(descending).slice(0, k);
        assert.deepEqual(kLargest(values, k), expected, JSON.stringify({ values, k }));
      }
    }
  }
});

test("kLargest uses the shared L30 sift helpers and preserves their deterministic swaps", () => {
  const upHeap = [2, 5, 3, 1];
  assert.deepEqual(siftUpMinHeap(upHeap), [[3, 1], [1, 0]]);
  assert.deepEqual(upHeap, [1, 2, 3, 5]);

  const downHeap = [9, 2, 2, 8, 7];
  assert.deepEqual(siftDownMinHeap(downHeap), [[0, 1], [1, 4]]);
  assert.deepEqual(downHeap, [2, 7, 2, 8, 9]);
});

test("K Largest lesson declares three synchronized panels and exact metadata", () => {
  assert.equal(assertLesson(kLargestLesson), kLargestLesson);
  assert.equal(kLargestLesson.id, "heaps-and-priority-queues/k-largest");
  assert.equal(kLargestLesson.order, 31);
  assert.deepEqual(kLargestLesson.prerequisites, [
    "heaps-and-priority-queues/heap-operations"
  ]);
  assert.deepEqual(kLargestLesson.patterns, ["heap", "top-k", "bounded-candidates"]);
  assert.deepEqual(kLargestLesson.views, [
    { id: "values", renderer: "array", heading: "Input values" },
    { id: "heap", renderer: "array", heading: "Heap backing array" },
    { id: "tree", renderer: "branching", heading: "Min-heap tree" }
  ]);
  assert.deepEqual(
    kLargestLesson.input.parse({ values: " -4, 8, 2, 8 ", k: "2" }),
    { values: [-4, 8, 2, 8], k: 2 }
  );
  assert.deepEqual(
    kLargestLesson.input.serialize({ values: [-0, 2, 1], k: 2 }),
    { values: "-0, 2, 1", k: "2" }
  );
  assert.throws(
    () => kLargestLesson.input.parse({ values: "1, 2", k: "3" }),
    /K must/
  );
});

test("K Largest trace accepts to capacity, rejects weak values, replaces the root, and sifts", () => {
  const input = { values: [3, 2, 1, 5, 6, 4], k: 2 };
  const trace = buildKLargestTrace(input);
  assert.deepEqual(trace.map(({ phase }) => phase), [
    "accept-under-capacity",
    "inspect",
    "accept-under-capacity",
    "sift-up",
    "inspect",
    "reject",
    "inspect",
    "replace-minimum",
    "sift-down",
    "inspect",
    "replace-minimum",
    "sift-down",
    "inspect",
    "reject",
    "complete"
  ]);
  assert.deepEqual(trace.at(-1).result, [6, 5]);
  assert.ok(trace.every(({ heapSize, k }) => heapSize <= k));

  const rejections = trace.filter(({ phase }) => phase === "reject");
  assert.ok(rejections.every(({ currentValue, minimumKept }) => currentValue <= minimumKept));
  const replacements = trace.filter(({ phase }) => phase === "replace-minimum");
  assert.ok(replacements.every(({ currentValue, replacedValue }) => currentValue > replacedValue));

  for (const step of trace) {
    if (step.phase !== "accept-under-capacity" && step.phase !== "replace-minimum") {
      assertMinHeap(step.heapValues);
    }
    assert.deepEqual(step.currentTopK, [...step.heapValues].sort(descending));
    assert.deepEqual(step.views.heap.values, step.heapValues);
    assert.deepEqual(step.views.tree.nodes.map(({ value }) => value), step.heapValues);
    assert.deepEqual(
      step.views.tree.nodes.map(({ id }) => id),
      step.heapValues.map((_, index) => heapSlotId(index))
    );
  }
});

test("heap tree ids describe stable slots while swap snapshots move values between them", () => {
  const trace = buildKLargestTrace({ values: [5, 4, 3], k: 3 });
  const swaps = trace.filter(({ phase }) => phase === "sift-up");
  assert.ok(swaps.length > 0);
  for (const step of swaps) {
    assert.equal(step.swapIndices.length, 2);
    assert.deepEqual(
      step.views.tree.changedNodeIds,
      step.swapIndices.map(heapSlotId)
    );
    assert.deepEqual(
      step.views.tree.nodes.map(({ id }) => id),
      ["heap-slot-0", "heap-slot-1", "heap-slot-2"].slice(0, step.heapSize)
    );
  }
});

test("K Largest trace is deterministic, solver-aligned, and input-immutable", () => {
  const input = { values: [-4, 8, 2, 8, -1, 5], k: 3 };
  const before = structuredClone(input);
  const trace = buildValidatedTrace(kLargestLesson, input);
  assert.equal(assertTrace(trace, kLargestLesson), trace);
  assert.deepEqual(trace.at(-1).result, kLargest(input.values, input.k));
  assert.deepEqual(input, before);
  assert.deepEqual(buildKLargestTrace(input), buildKLargestTrace(structuredClone(input)));
});

test("K Largest trace deeply owns all three panel histories and derived arrays", () => {
  const trace = buildKLargestTrace({ values: [3, 2, 1, 5], k: 2 });
  for (const panelId of ["values", "heap", "tree"]) {
    assert.equal(new Set(trace.map((step) => step.views[panelId])).size, trace.length);
  }
  for (const panelId of ["values", "heap"]) {
    for (const property of ["values", "activeIndices", "ranges", "markers", "annotations", "changedIndices"]) {
      assert.equal(new Set(trace.map((step) => step.views[panelId][property])).size, trace.length);
    }
  }
  for (const property of [
    "nodes",
    "edges",
    "rootIds",
    "activeNodeIds",
    "changedNodeIds",
    "states",
    "annotations",
    "pointers"
  ]) {
    assert.equal(new Set(trace.map((step) => step.views.tree[property])).size, trace.length);
  }
  for (const property of ["swapIndices", "heapValues", "currentTopK"]) {
    assert.equal(new Set(trace.map((step) => step[property])).size, trace.length);
  }
  for (const [panelId, properties] of [
    ["values", ["ranges", "markers", "annotations"]],
    ["heap", ["ranges", "markers", "annotations"]],
    ["tree", ["nodes", "edges", "states", "annotations", "pointers"]]
  ]) {
    for (const property of properties) {
      const objects = trace.flatMap((step) => step.views[panelId][property]);
      assert.equal(new Set(objects).size, objects.length, `${panelId}.${property}`);
    }
  }

  trace[1].views.heap.values = trace[0].views.heap.values;
  assert.throws(
    () => assertTrace(trace, kLargestLesson),
    /View panel heap:.*values snapshot/i
  );

  const nestedTrace = buildKLargestTrace({ values: [3, 2, 1, 5], k: 2 });
  nestedTrace[1].views.tree.nodes[0] = nestedTrace[0].views.tree.nodes[0];
  assert.throws(
    () => assertTrace(nestedTrace, kLargestLesson),
    /View panel tree:.*nodes objects/i
  );
});

test("heap slot ids reject values that cannot identify a backing-array slot", () => {
  assert.equal(heapSlotId(0), "heap-slot-0");
  assert.equal(heapSlotId(11), "heap-slot-11");
  for (const index of [-1, 1.5, Number.NaN, Infinity, "1"]) {
    assert.throws(() => heapSlotId(index), /non-negative integer/);
  }
});

function assertMinHeap(heap) {
  for (let childIndex = 1; childIndex < heap.length; childIndex += 1) {
    const parentIndex = Math.floor((childIndex - 1) / 2);
    assert.ok(heap[parentIndex] <= heap[childIndex], JSON.stringify(heap));
  }
}

function descending(left, right) {
  if (left > right) return -1;
  if (left < right) return 1;
  return 0;
}
