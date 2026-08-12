import test from "node:test";
import assert from "node:assert/strict";
import {
  maximumSlidingWindowValues,
  slidingWindowMaximum,
  validateSlidingWindowMaximumInput
} from "../queues/sliding-window-maximum.mjs";
import {
  buildSlidingWindowMaximumTrace,
  slidingWindowCandidateId
} from "../studio/src/sliding-window-maximum.mjs";
import {
  assertLesson,
  assertTrace,
  buildValidatedTrace
} from "../studio/src/lesson-contract.mjs";
import { slidingWindowMaximumLesson } from "../studio/src/lessons/sliding-window-maximum.mjs";

test("slidingWindowMaximum emits the standard maxima without mutating input", () => {
  const values = [1, 3, -1, -3, 5, 3, 6, 7];
  const before = [...values];
  assert.deepEqual(slidingWindowMaximum(values, 3), [3, 3, 5, 5, 6, 7]);
  assert.deepEqual(values, before);
});

test("slidingWindowMaximum handles duplicates, negative values, and boundary window sizes", () => {
  assert.deepEqual(slidingWindowMaximum([4, 4, 4], 2), [4, 4]);
  assert.deepEqual(slidingWindowMaximum([-4, -2, -5, -1, -3], 2), [-2, -2, -1, -1]);
  assert.deepEqual(slidingWindowMaximum([3, -1, 8], 1), [3, -1, 8]);
  assert.deepEqual(slidingWindowMaximum([-5, -2, -9], 3), [-2]);
});

test("Sliding Window Maximum rejects malformed arrays and invalid window sizes", () => {
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
    Array.from({ length: maximumSlidingWindowValues + 1 }, (_, index) => index)
  ]) {
    assert.throws(() => validateSlidingWindowMaximumInput(values, 1), /Sliding Window Maximum/);
    assert.throws(() => slidingWindowMaximum(values, 1), /Sliding Window Maximum/);
  }

  for (const size of [undefined, null, 0, -1, 1.5, 4, Number.NaN, "2"]) {
    assert.throws(
      () => validateSlidingWindowMaximumInput([1, 2, 3], size),
      /Window size/
    );
    assert.throws(() => slidingWindowMaximum([1, 2, 3], size), /Window size/);
  }
});

test("Sliding Window Maximum lesson exposes the required metadata and bounded parser", () => {
  assert.equal(assertLesson(slidingWindowMaximumLesson), slidingWindowMaximumLesson);
  assert.equal(slidingWindowMaximumLesson.id, "queues/sliding-window-maximum");
  assert.equal(slidingWindowMaximumLesson.order, 21);
  assert.deepEqual(slidingWindowMaximumLesson.prerequisites, [
    "arrays/sliding-window",
    "queues/queue-operations"
  ]);
  assert.deepEqual(slidingWindowMaximumLesson.patterns, [
    "sliding-window",
    "monotonic-deque"
  ]);
  assert.deepEqual(slidingWindowMaximumLesson.views, [
    { id: "values", renderer: "array", heading: "Input values" },
    { id: "candidates", renderer: "queue", heading: "Monotonic candidate deque" }
  ]);

  assert.deepEqual(
    slidingWindowMaximumLesson.input.parse({ values: " -4, -2, -5, -1 ", size: "2" }),
    { values: [-4, -2, -5, -1], size: 2 }
  );
  assert.deepEqual(
    slidingWindowMaximumLesson.input.serialize({ values: [-0, 2, 1], size: 2 }),
    { values: "-0, 2, 1", size: "2" }
  );
  assert.throws(
    () => slidingWindowMaximumLesson.input.parse({ values: "1, 2", size: "3" }),
    /Window size/
  );
});

test("Sliding Window Maximum lesson trace is deterministic, immutable, and solver-aligned", () => {
  const input = { values: [1, 3, -1, -3, 5, 3, 6, 7], size: 3 };
  const before = structuredClone(input);
  const trace = buildValidatedTrace(slidingWindowMaximumLesson, input);
  assert.equal(assertTrace(trace, slidingWindowMaximumLesson), trace);
  assert.deepEqual(trace.at(-1).result, slidingWindowMaximum(input.values, input.size));
  assert.deepEqual(input, before);
  assert.deepEqual(
    buildSlidingWindowMaximumTrace(input),
    buildSlidingWindowMaximumTrace(structuredClone(input))
  );
});

test("trace expires fronts, removes dominated backs, enqueues stable ids, and emits full windows", () => {
  const input = { values: [1, 3, -1, -3, 5, 3, 6, 7], size: 3 };
  const trace = buildSlidingWindowMaximumTrace(input);
  const expirations = trace.filter(({ phase }) => phase === "expire-front");
  const dominated = trace.filter(({ phase }) => phase === "remove-dominated");
  const enqueues = trace.filter(({ phase }) => phase === "enqueue");
  const emissions = trace.filter(({ phase }) => phase === "emit-maximum");

  assert.ok(expirations.length > 0);
  assert.ok(dominated.length > 0);
  assert.equal(enqueues.length, input.values.length);
  assert.equal(emissions.length, input.values.length - input.size + 1);
  assert.deepEqual(emissions.map(({ latestMaximum }) => latestMaximum), [3, 3, 5, 5, 6, 7]);

  assert.ok(expirations.every(({ removedIndex, currentStart }) => removedIndex < currentStart));
  assert.ok(dominated.every(({ removedIndex, currentIndex }) => (
    input.values[removedIndex] <= input.values[currentIndex]
  )));

  for (const step of enqueues) {
    assertStrictlyIncreasing(step.candidateIndices);
    assertStrictlyDecreasing(step.candidateIndices.map((index) => input.values[index]));
    assert.ok(step.candidateIndices.every((index) => index >= step.currentStart));
    assert.deepEqual(
      step.views.candidates.items.map(({ id }) => id),
      step.candidateIndices.map(slidingWindowCandidateId)
    );
    assert.deepEqual(
      step.views.candidates.items.map(({ value }) => value),
      step.candidateIndices.map((index) => input.values[index])
    );
  }

  for (const step of emissions) {
    assert.equal(step.windowReady, true);
    assert.equal(step.candidateIndices[0], step.maximumIndex);
    assert.equal(
      step.latestMaximum,
      Math.max(...input.values.slice(step.currentStart, step.currentEnd + 1))
    );
    assert.equal(step.views.candidates.frontItemId, slidingWindowCandidateId(step.maximumIndex));
  }
});

test("equal incoming values replace older candidates with index-stable queue items", () => {
  const trace = buildSlidingWindowMaximumTrace({ values: [4, 4, 4], size: 2 });
  const removals = trace.filter(({ phase }) => phase === "remove-dominated");
  assert.deepEqual(removals.map(({ removedIndex }) => removedIndex), [0, 1]);
  const emissions = trace.filter(({ phase }) => phase === "emit-maximum");
  assert.deepEqual(emissions.map(({ maximumIndex }) => maximumIndex), [1, 2]);
  assert.deepEqual(emissions.map(({ latestMaximum }) => latestMaximum), [4, 4]);
});

test("trace owns top-level, nested renderer, and derived history snapshots", () => {
  const trace = buildSlidingWindowMaximumTrace({ values: [2, 1, 5, 3], size: 2 });
  for (const panelId of ["values", "candidates"]) {
    assert.equal(new Set(trace.map((step) => step.views[panelId])).size, trace.length);
  }
  for (const property of ["values", "activeIndices", "ranges", "markers", "annotations", "changedIndices"]) {
    assert.equal(new Set(trace.map((step) => step.views.values[property])).size, trace.length);
  }
  for (const property of ["items", "activeItemIds", "changedItemIds", "annotations"]) {
    assert.equal(new Set(trace.map((step) => step.views.candidates[property])).size, trace.length);
  }
  for (const property of ["candidateIndices", "maxima", "outputs"]) {
    assert.equal(new Set(trace.map((step) => step[property])).size, trace.length);
  }
  for (const [panelId, properties] of [
    ["values", ["ranges", "markers", "annotations"]],
    ["candidates", ["items", "annotations"]]
  ]) {
    for (const property of properties) {
      const objects = trace.flatMap((step) => step.views[panelId][property]);
      assert.equal(new Set(objects).size, objects.length, `${panelId}.${property}`);
    }
  }
  const outputObjects = trace.flatMap((step) => step.outputs);
  assert.equal(new Set(outputObjects).size, outputObjects.length);

  trace[1].views.candidates.items = trace[0].views.candidates.items;
  assert.throws(
    () => assertTrace(trace, slidingWindowMaximumLesson),
    /View panel candidates:.*items snapshot/i
  );

  const nestedTrace = buildSlidingWindowMaximumTrace({ values: [2, 1, 5, 3], size: 2 });
  const populatedSteps = nestedTrace.filter((step) => step.views.candidates.items.length > 0);
  populatedSteps[1].views.candidates.items[0] = populatedSteps[0].views.candidates.items[0];
  assert.throws(
    () => assertTrace(nestedTrace, slidingWindowMaximumLesson),
    /View panel candidates:.*items objects/i
  );
});

test("candidate ids reject values that cannot identify a source index", () => {
  assert.equal(slidingWindowCandidateId(0), "index-0");
  assert.equal(slidingWindowCandidateId(11), "index-11");
  for (const index of [-1, 1.5, Number.NaN, Infinity, "1"]) {
    assert.throws(() => slidingWindowCandidateId(index), /non-negative integer/);
  }
});

function assertStrictlyIncreasing(values) {
  assert.ok(values.every((value, index) => index === 0 || values[index - 1] < value));
}

function assertStrictlyDecreasing(values) {
  assert.ok(values.every((value, index) => index === 0 || values[index - 1] > value));
}
