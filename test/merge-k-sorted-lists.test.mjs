import test from "node:test";
import assert from "node:assert/strict";
import {
  compareFrontierEntries,
  createFrontierEntry,
  formatKSortedLists,
  maximumKSortedListNodes,
  maximumKSortedLists,
  mergeKSortedLists,
  parseKSortedLists,
  popFrontier,
  pushFrontier,
  validateKSortedLists
} from "../heaps-and-priority-queues/merge-k-sorted-lists.mjs";
import { createLinkedList } from "../linked-lists/model.mjs";
import {
  assertLesson,
  assertTrace,
  buildValidatedTrace
} from "../studio/src/lesson-contract.mjs";
import { buildMergeKSortedListsTrace } from "../studio/src/merge-k-sorted-lists.mjs";
import { mergeKSortedListsLesson } from "../studio/src/lessons/merge-k-sorted-lists.mjs";

test("merge-k-sorted-lists merges the standard inputs without mutation", () => {
  const lists = [[1, 4, 5], [1, 3, 4], [2, 6]];
  const before = structuredClone(lists);
  assert.deepEqual(mergeKSortedLists(lists), [1, 1, 2, 3, 4, 4, 5, 6]);
  assert.deepEqual(lists, before);
});

test("merge-k-sorted-lists handles ties, negatives, decimals, and one source", () => {
  assert.deepEqual(mergeKSortedLists([[1, 1, 3]]), [1, 1, 3]);
  assert.deepEqual(
    mergeKSortedLists([[-4, -1, 2.5], [-4, 0, 2.5], [-3]]),
    [-4, -4, -3, -1, 0, 2.5, 2.5]
  );
  assert.deepEqual(mergeKSortedLists([[-0], [0]]), [-0, 0]);
});

test("merge frontier ties are deterministic by list then element index", () => {
  const entries = [
    createFrontierEntry(createLinkedList([1]), 2, 0),
    createFrontierEntry(createLinkedList([1]), 0, 1),
    createFrontierEntry(createLinkedList([1]), 0, 0),
    createFrontierEntry(createLinkedList([1]), 1, 0)
  ];
  assert.ok(compareFrontierEntries(entries[2], entries[1]) < 0);
  const frontier = [];
  for (const entry of entries) pushFrontier(frontier, entry);
  assert.deepEqual(
    Array.from({ length: entries.length }, () => {
      const entry = popFrontier(frontier);
      return [entry.listIndex, entry.elementIndex];
    }),
    [[0, 0], [0, 1], [1, 0], [2, 0]]
  );
});

test("merge-k parser accepts semicolon lists and round trips negative zero", () => {
  const lists = parseKSortedLists(" 1, 4, 5; 1, 3, 4; -2, 6 ");
  assert.deepEqual(lists, [[1, 4, 5], [1, 3, 4], [-2, 6]]);
  assert.equal(formatKSortedLists(lists), "1, 4, 5; 1, 3, 4; -2, 6");
  assert.deepEqual(parseKSortedLists(formatKSortedLists([[-0, 0]])), [[-0, 0]]);
});

test("merge-k validation rejects malformed, empty, sparse, unsorted, nonfinite, and oversized input", () => {
  const sparseOuter = [[1], [2]];
  delete sparseOuter[0];
  const sparseInner = [[1, 2]];
  delete sparseInner[0][0];
  for (const lists of [
    undefined,
    null,
    [],
    sparseOuter,
    sparseInner,
    [[]],
    [[2, 1]],
    [[1, Number.NaN]],
    [[1, Infinity]],
    Array.from({ length: maximumKSortedLists + 1 }, () => [1]),
    [Array.from({ length: maximumKSortedListNodes + 1 }, (_, index) => index)]
  ]) {
    assert.throws(() => validateKSortedLists(lists));
  }
  for (const source of [undefined, "", " ", ";", "1,2;", ";1,2", "1,,2", "2,1", "1, nope", "1, Infinity"]) {
    assert.throws(() => parseKSortedLists(source));
  }
});

test("merge-k solver agrees with flatten-and-sort across bounded cases", () => {
  const cases = [
    [[0]],
    [[-5, -1], [-4, -1, 8]],
    [[1, 2], [1, 2], [1, 2]],
    [[-3, 0, 7], [-2, 6], [-1, 4], [5]],
    [[-0, 3], [0, 2, 9]]
  ];
  for (const lists of cases) {
    const expected = lists.flat().sort((left, right) => left < right ? -1 : left > right ? 1 : 0);
    assert.deepEqual(mergeKSortedLists(lists), expected);
  }
});

test("merge-k trace initializes heads, extracts, appends, and advances one list", () => {
  const trace = buildMergeKSortedListsTrace([[1, 4], [2, 3]]);
  assert.equal(trace[0].phase, "initialize");
  assert.equal(trace[0].frontierSize, 2);
  assert.ok(trace.some(({ phase }) => phase === "extract-min"));
  assert.ok(trace.some(({ phase }) => phase === "append-output"));
  assert.ok(trace.some(({ phase }) => phase === "push-successor"));
  assert.ok(trace.some(({ phase }) => phase === "list-exhausted"));
  assert.deepEqual(trace.at(-1).result, [1, 2, 3, 4]);
  assert.equal(trace.at(-1).frontierSize, 0);
});

test("merge-k trace exposes deterministic source order for equal values", () => {
  const trace = buildMergeKSortedListsTrace([[1, 1], [1], [1]]);
  const extracts = trace
    .filter(({ phase }) => phase === "extract-min")
    .map(({ extractedListIndex, extractedElementIndex }) => [extractedListIndex, extractedElementIndex]);
  assert.deepEqual(extracts, [[0, 0], [0, 1], [1, 0], [2, 0]]);
});

test("merge-k lesson satisfies deterministic composite ownership and full contract", () => {
  assert.equal(assertLesson(mergeKSortedListsLesson), mergeKSortedListsLesson);
  const input = structuredClone(mergeKSortedListsLesson.input.defaultValue);
  const trace = buildValidatedTrace(mergeKSortedListsLesson, input);
  assert.equal(assertTrace(trace, mergeKSortedListsLesson), trace);
  assert.deepEqual(input, mergeKSortedListsLesson.input.defaultValue);
  assert.deepEqual(trace.at(-1).result, [1, 1, 2, 3, 4, 4, 5, 6]);
  assert.equal(mergeKSortedListsLesson.order, 33);
  assert.deepEqual(mergeKSortedListsLesson.prerequisites, [
    "linked-lists/reverse-linked-list",
    "heaps-and-priority-queues/heap-operations"
  ]);
  assert.deepEqual(mergeKSortedListsLesson.patterns, ["heap", "k-way-merge", "frontier"]);

  for (const panel of ["frontier", "output"]) {
    assert.equal(new Set(trace.map((step) => step.views[panel])).size, trace.length, panel);
  }
  for (const property of ["nodes", "edges", "rootIds", "activeNodeIds", "changedNodeIds", "states", "annotations", "pointers"]) {
    assert.equal(new Set(trace.map((step) => step.views.frontier[property])).size, trace.length, property);
  }
  for (const property of ["values", "activeIndices", "ranges", "markers", "annotations", "changedIndices"]) {
    assert.equal(new Set(trace.map((step) => step.views.output[property])).size, trace.length, property);
  }
});

test("merge-k trace rejects shared mutable panel snapshots", () => {
  const trace = buildMergeKSortedListsTrace([[1, 3], [2, 4]]);
  trace[1].views.frontier.nodes = trace[0].views.frontier.nodes;
  assert.throws(() => assertTrace(trace, mergeKSortedListsLesson), /nodes objects|nodes snapshot/);
});
