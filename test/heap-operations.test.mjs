import test from "node:test";
import assert from "node:assert/strict";
import {
  formatHeapProgram,
  maximumHeapOperations,
  parseHeapProgram,
  runHeapOperations,
  siftDownMinHeap,
  siftUpMinHeap,
  validateHeapOperations
} from "../heaps-and-priority-queues/heap-operations.mjs";
import { buildHeapOperationsTrace } from "../studio/src/heap-operations.mjs";
import { heapOperationsLesson } from "../studio/src/lessons/heap-operations.mjs";
import {
  assertLesson,
  buildValidatedTrace
} from "../studio/src/lesson-contract.mjs";

test("Heap Operations parser accepts and formats its deterministic program language", () => {
  const operations = parseHeapProgram(" INSERT 5 , insert -2.5, remove, insert .5, insert 1e2 ");
  assert.deepEqual(operations, [
    { type: "insert", value: 5 },
    { type: "insert", value: -2.5 },
    { type: "remove" },
    { type: "insert", value: 0.5 },
    { type: "insert", value: 100 }
  ]);
  assert.equal(
    formatHeapProgram(operations),
    "insert 5, insert -2.5, remove, insert 0.5, insert 100"
  );
  assert.deepEqual(parseHeapProgram("insert -0"), [{ type: "insert", value: -0 }]);
  assert.equal(formatHeapProgram([{ type: "insert", value: -0 }]), "insert -0");
});

test("Heap Operations parser and validator reject malformed programs and preflight underflow", () => {
  for (const program of [
    undefined,
    null,
    "",
    "   ",
    "insert",
    "insert nope",
    "insert Infinity",
    "push 2",
    "peek",
    "remove 2",
    "insert 1,,remove",
    "remove",
    "insert 1, remove, remove"
  ]) {
    assert.throws(() => parseHeapProgram(program));
  }
  const tooLong = Array(maximumHeapOperations + 1).fill("insert 1").join(", ");
  assert.throws(() => parseHeapProgram(tooLong), /12 operations or fewer/);

  const sparse = Array(2);
  sparse[1] = { type: "insert", value: 1 };
  for (const operations of [
    undefined,
    null,
    [],
    sparse,
    [{ type: "insert", value: Number.NaN }],
    [{ type: "insert", value: Infinity }],
    [{ type: "push", value: 1 }],
    [{ type: "remove" }],
    [{ type: "insert", value: 1 }, { type: "remove" }, { type: "remove" }]
  ]) {
    assert.throws(() => validateHeapOperations(operations));
  }
});

test("sift helpers mutate one path, report swaps, and use deterministic duplicate ties", () => {
  const up = [1, 3, 2, 0];
  assert.deepEqual(siftUpMinHeap(up), [[3, 1], [1, 0]]);
  assert.deepEqual(up, [0, 1, 2, 3]);

  const down = [9, 2, 2, 7, 8, 3];
  assert.deepEqual(siftDownMinHeap(down), [[0, 1], [1, 3]]);
  assert.deepEqual(down, [2, 7, 2, 9, 8, 3]);

  const equal = [2, 2, 3];
  assert.deepEqual(siftDownMinHeap(equal), []);
  assert.deepEqual(equal, [2, 2, 3]);
  assert.deepEqual(siftUpMinHeap([], -1), []);
  assert.deepEqual(siftDownMinHeap([]), []);

  const sparse = Array(2);
  sparse[0] = 1;
  for (const heap of [undefined, null, sparse, [1, Number.NaN], [Infinity]]) {
    assert.throws(() => siftDownMinHeap(heap));
  }
  assert.throws(() => siftUpMinHeap([1], 1));
  assert.throws(() => siftDownMinHeap([1], -1));
});

test("Heap Operations returns removal records and a valid final heap without mutating input", () => {
  const operations = parseHeapProgram(
    "insert 5, insert 2, insert 7, insert 1, remove, insert 3, remove"
  );
  const original = structuredClone(operations);
  assert.deepEqual(runHeapOperations(operations), {
    removed: [
      { operationIndex: 4, type: "remove", value: 1 },
      { operationIndex: 6, type: "remove", value: 2 }
    ],
    heap: [3, 5, 7]
  });
  assert.deepEqual(operations, original);
});

test("Heap Operations preserves duplicate minima, negatives, and singleton removal order", () => {
  const operations = parseHeapProgram(
    "insert 4, insert -2, insert -2, insert 0, remove, remove, remove"
  );
  assert.deepEqual(runHeapOperations(operations), {
    removed: [
      { operationIndex: 4, type: "remove", value: -2 },
      { operationIndex: 5, type: "remove", value: -2 },
      { operationIndex: 6, type: "remove", value: 0 }
    ],
    heap: [4]
  });
  assert.deepEqual(runHeapOperations(parseHeapProgram("insert 9, remove")), {
    removed: [{ operationIndex: 1, type: "remove", value: 9 }],
    heap: []
  });
});

test("Heap Operations lesson declares its composite views, metadata, and parser", () => {
  assert.equal(assertLesson(heapOperationsLesson), heapOperationsLesson);
  assert.equal(heapOperationsLesson.id, "heaps-and-priority-queues/heap-operations");
  assert.equal(heapOperationsLesson.order, 30);
  assert.deepEqual(heapOperationsLesson.prerequisites, [
    "arrays/reverse-array",
    "trees/inorder-traversal"
  ]);
  assert.deepEqual(heapOperationsLesson.patterns, ["heap", "complete-tree", "sift"]);
  assert.equal(Object.hasOwn(heapOperationsLesson, "renderer"), false);
  assert.deepEqual(heapOperationsLesson.views, [
    { id: "heap", renderer: "array", heading: "Heap array" },
    { id: "tree", renderer: "branching", heading: "Complete-tree view" }
  ]);

  const parsed = heapOperationsLesson.input.parse({
    program: "insert 5, insert 2, remove, insert 7"
  });
  assert.deepEqual(parsed, { operations: [
    { type: "insert", value: 5 },
    { type: "insert", value: 2 },
    { type: "remove" },
    { type: "insert", value: 7 }
  ] });
  assert.deepEqual(heapOperationsLesson.input.serialize(parsed), {
    program: "insert 5, insert 2, remove, insert 7"
  });
});

test("Heap Operations trace exposes append, sift-up, replacement, and sift-down swaps", () => {
  const operations = parseHeapProgram(
    "insert 5, insert 2, insert 7, insert 1, remove"
  );
  const trace = buildValidatedTrace(heapOperationsLesson, { operations });
  assert.deepEqual(trace.map(({ phase }) => phase), [
    "initialize",
    "insert-append",
    "insert-append",
    "sift-up-swap",
    "insert-append",
    "insert-append",
    "sift-up-swap",
    "sift-up-swap",
    "remove-minimum",
    "replace-root",
    "sift-down-swap",
    "complete"
  ]);

  const insertSwaps = trace.filter(({ phase }) => phase === "sift-up-swap");
  assert.deepEqual(insertSwaps.map(({ activeIndices }) => activeIndices), [
    [0, 1],
    [1, 3],
    [0, 1]
  ]);
  assert.equal(trace.find(({ phase }) => phase === "replace-root").heapOrdered, false);
  const down = trace.find(({ phase }) => phase === "sift-down-swap");
  assert.deepEqual(down.activeIndices, [0, 1]);
  assert.deepEqual(down.views.heap.values, [2, 5, 7]);
  assert.deepEqual(down.views.tree.nodes.map(({ id, value }) => ({ id, value })), [
    { id: "node-0", value: 2 },
    { id: "node-1", value: 5 },
    { id: "node-2", value: 7 }
  ]);
  assert.deepEqual(trace.at(-1).result, {
    removed: [{ operationIndex: 4, type: "remove", value: 1 }],
    heap: [2, 5, 7]
  });
});

test("singleton removal trace uses honest empty array and tree snapshots", () => {
  const operations = parseHeapProgram("insert -3, remove");
  const trace = buildValidatedTrace(heapOperationsLesson, { operations });
  assert.deepEqual(trace.map(({ phase }) => phase), [
    "initialize",
    "insert-append",
    "remove-minimum",
    "remove-singleton",
    "complete"
  ]);
  const emptied = trace.find(({ phase }) => phase === "remove-singleton");
  assert.deepEqual(emptied.views.heap, {
    values: [],
    activeIndices: [],
    ranges: [],
    markers: [],
    annotations: [],
    changedIndices: []
  });
  assert.deepEqual(emptied.views.tree.nodes, []);
  assert.deepEqual(emptied.views.tree.edges, []);
  assert.deepEqual(emptied.views.tree.rootIds, []);
  assert.deepEqual(emptied.views.tree.pointers, [{
    nodeId: null,
    kind: "current",
    label: "current heap position"
  }]);
  assert.deepEqual(trace.at(-1).result, {
    removed: [{ operationIndex: 1, type: "remove", value: -3 }],
    heap: []
  });
});

test("Heap Operations trace is deterministic, immutable, and deeply owns every snapshot", () => {
  const operations = parseHeapProgram(
    "insert 6, insert -1, insert 4, insert -1, remove, insert 2, remove"
  );
  const original = structuredClone(operations);
  const first = buildHeapOperationsTrace(operations);
  const second = buildHeapOperationsTrace(structuredClone(operations));

  assert.deepEqual(first, second);
  assert.deepEqual(operations, original);
  assert.deepEqual(first.at(-1).result, runHeapOperations(operations));
  first.forEach((step, index) => {
    assert.equal(step.step, index);
    assert.ok(step.codeSteps.length > 0);
    assert.equal(typeof step.narration, "string");
    assert.equal(typeof step.prompt, "string");
  });

  for (const [panelId, properties, objectProperties] of [
    ["heap", ["values", "activeIndices", "ranges", "markers", "annotations", "changedIndices"], ["ranges", "markers", "annotations"]],
    ["tree", ["nodes", "edges", "rootIds", "activeNodeIds", "changedNodeIds", "states", "annotations", "pointers"], ["nodes", "edges", "states", "annotations", "pointers"]]
  ]) {
    assert.equal(new Set(first.map((step) => step.views[panelId])).size, first.length, panelId);
    for (const property of properties) {
      assert.equal(
        new Set(first.map((step) => step.views[panelId][property])).size,
        first.length,
        `${panelId}.${property}`
      );
    }
    for (const property of objectProperties) {
      const objects = first.flatMap((step) => step.views[panelId][property]);
      assert.equal(new Set(objects).size, objects.length, `${panelId}.${property} objects`);
    }
  }
  assert.equal(new Set(first.map((step) => step.removed)).size, first.length);
  const removalObjects = first.flatMap((step) => step.removed);
  assert.equal(new Set(removalObjects).size, removalObjects.length);
  const latestObjects = first.map((step) => step.latestRemoval).filter(Boolean);
  assert.equal(new Set(latestObjects).size, latestObjects.length);
});
