import test from "node:test";
import assert from "node:assert/strict";
import {
  frequencyEntries,
  maximumTopKFrequentValues,
  topKFrequent,
  validateTopKFrequentInput
} from "../heaps-and-priority-queues/top-k-frequent.mjs";
import { buildValidatedTrace } from "../studio/src/lesson-contract.mjs";
import { topKFrequentLesson } from "../studio/src/lessons/top-k-frequent.mjs";
import { buildTopKFrequentTrace } from "../studio/src/top-k-frequent.mjs";

test("top-k-frequent selects by descending frequency and stable first-seen ties", () => {
  assert.deepEqual(topKFrequent([1, 1, 1, 2, 2, 3], 2), [1, 2]);
  assert.deepEqual(topKFrequent([4, 5, 4, 5, 6], 2), [4, 5]);
  assert.deepEqual(topKFrequent([-2, -2, 3, 3, 3], 1), [3]);
  assert.deepEqual(topKFrequent([-0, 0, 1], 1), [0]);
});

test("top-k-frequent returns every distinct value when k equals distinct count", () => {
  assert.deepEqual(topKFrequent([3, 1, 2, 3], 3), [3, 1, 2]);
  assert.deepEqual(frequencyEntries([3, 1, 3]), [
    { value: 3, count: 2, firstIndex: 0 },
    { value: 1, count: 1, firstIndex: 1 }
  ]);
});

test("top-k-frequent rejects malformed arrays and invalid k", () => {
  const sparse = Array(2);
  sparse[0] = 1;
  for (const [values, k] of [
    [undefined, 1],
    [[], 1],
    [sparse, 1],
    [[1, Infinity], 1],
    [[1], 0],
    [[1], 2],
    [[1, 2], 1.5],
    [Array.from({ length: maximumTopKFrequentValues + 1 }, (_, index) => index), 1]
  ]) {
    assert.throws(() => validateTopKFrequentInput(values, k));
  }
});

test("top-k-frequent trace counts before maintaining a bounded heap", () => {
  const input = { values: [1, 1, 1, 2, 2, 3], k: 2 };
  const trace = buildTopKFrequentTrace(input);
  const lastCount = trace.findLastIndex(({ phase }) => phase === "count");
  const firstOffer = trace.findIndex(({ phase }) => phase === "offer");
  assert.ok(lastCount < firstOffer);
  assert.ok(trace.every((step) => step.heapSize <= input.k + (step.phase === "offer" ? 1 : 0)));
  assert.deepEqual(trace.at(-1).result, topKFrequent(input.values, input.k));
});

test("top-k-frequent lesson satisfies deterministic composite ownership", () => {
  const trace = buildValidatedTrace(topKFrequentLesson, topKFrequentLesson.input.defaultValue);
  for (const panel of ["counts", "heap"]) {
    assert.equal(new Set(trace.map((step) => step.views[panel])).size, trace.length, panel);
  }
  for (const property of ["nodes", "edges", "rootIds", "activeNodeIds", "changedNodeIds", "states", "annotations", "pointers"]) {
    assert.equal(new Set(trace.map((step) => step.views.heap[property])).size, trace.length, property);
  }
});
