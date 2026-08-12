import test from "node:test";
import assert from "node:assert/strict";
import {
  countFrequencies,
  maximumFrequencyValues,
  validateFrequencyInput
} from "../arrays/frequency-count.mjs";
import { buildFrequencyCountTrace, frequencyLookupKey } from "../studio/src/frequency-count.mjs";
import { lookupRendererAdapter } from "../studio/src/lookup-renderer.mjs";
import {
  assertLesson,
  assertTrace,
  buildValidatedTrace
} from "../studio/src/lesson-contract.mjs";
import { frequencyCountLesson } from "../studio/src/lessons/frequency-count.mjs";
import {
  registerRendererAdapter,
  rendererRegistry
} from "../studio/src/renderer-registry.mjs";

if (!rendererRegistry.has(lookupRendererAdapter.id)) {
  registerRendererAdapter(lookupRendererAdapter);
}

test("countFrequencies preserves first-seen order, Map equality, and its input", () => {
  const values = [2, -1, 2, -0, 0, -1, 3.5];
  const before = [...values];
  assert.deepEqual(countFrequencies(values), [
    { value: 2, count: 2 },
    { value: -1, count: 2 },
    { value: 0, count: 2 },
    { value: 3.5, count: 1 }
  ]);
  assert.deepEqual(values, before);
  assert.equal(frequencyLookupKey(-0), "0");
  assert.equal(frequencyLookupKey(0), "0");
});

test("Frequency Count rejects empty, sparse, non-finite, and oversized inputs", () => {
  for (const values of [
    null,
    [],
    [1, Number.NaN],
    [1, Infinity],
    Array(2),
    Array.from({ length: maximumFrequencyValues + 1 }, (_, index) => index)
  ]) {
    assert.throws(() => validateFrequencyInput(values), /Frequency Count/);
    assert.throws(() => countFrequencies(values), /Frequency Count/);
  }
  assert.throws(() => frequencyLookupKey(Infinity), /finite/);
});

test("Frequency Count lesson satisfies the composite contract deterministically", () => {
  assert.equal(assertLesson(frequencyCountLesson), frequencyCountLesson);
  const input = { values: [2, 1, 2, 3, 1] };
  const trace = buildValidatedTrace(frequencyCountLesson, input);
  assert.equal(assertTrace(trace, frequencyCountLesson), trace);
  assert.deepEqual(trace.at(-1).result, countFrequencies(input.values));
  assert.deepEqual(input, { values: [2, 1, 2, 3, 1] });
});

test("Frequency Count trace exposes new-key and increment decisions with prefix invariants", () => {
  const trace = buildFrequencyCountTrace([2, 1, 2]);
  assert.deepEqual(trace.map(({ phase }) => phase), [
    "initialize",
    "inspect",
    "add-key",
    "inspect",
    "add-key",
    "inspect",
    "increment-count",
    "complete"
  ]);

  const updates = trace.filter(({ phase }) => phase === "add-key" || phase === "increment-count");
  for (const step of updates) {
    const total = step.views.counts.entries.reduce((sum, entry) => sum + entry.value, 0);
    assert.equal(total, step.processedCount);
    assert.equal(step.distinctCount, step.views.counts.entries.length);
    assert.deepEqual(step.views.values.ranges, [{
      start: 0,
      end: step.processedCount - 1,
      kind: "counted",
      label: "counted prefix"
    }]);
  }

  assert.deepEqual(trace[2].views.counts.entries, [{ key: "2", value: 1, state: "updated" }]);
  assert.deepEqual(trace[6].views.counts.entries, [
    { key: "2", value: 2, state: "updated" },
    { key: "1", value: 1, state: "counted" }
  ]);
  assert.deepEqual(trace.at(-1).views.counts.resultKeys, ["2", "1"]);
});

test("Frequency Count trace owns every composite snapshot", () => {
  const trace = buildFrequencyCountTrace([1, 1]);
  trace[1].views.counts.entries = trace[0].views.counts.entries;
  assert.throws(
    () => assertTrace(trace, frequencyCountLesson),
    /View panel counts:.*entries snapshot/
  );
});

test("Frequency Count lesson parses and serializes bounded custom input", () => {
  assert.deepEqual(
    frequencyCountLesson.input.parse({ values: " -2, 4, -2, 4.5 " }),
    { values: [-2, 4, -2, 4.5] }
  );
  assert.deepEqual(
    frequencyCountLesson.input.serialize({ values: [-2, 4, -2] }),
    { values: "-2, 4, -2" }
  );
});
