import test from "node:test";
import assert from "node:assert/strict";
import {
  findPairSum,
  maximumPairSumValues,
  validatePairSumInput
} from "../arrays/pair-sum.mjs";
import {
  buildPairSumTrace,
  lookupKey
} from "../studio/src/pair-sum.mjs";
import { pairSumLesson } from "../studio/src/lessons/pair-sum.mjs";

test("pair-sum finds the first one-pass complement match without mutating input", () => {
  const cases = [
    [[2, 7, 11, 15], 9, { indices: [0, 1], values: [2, 7] }],
    [[3, 3], 6, { indices: [0, 1], values: [3, 3] }],
    [[-5, 8, 2, 7], 2, { indices: [0, 3], values: [-5, 7] }],
    [[1, 4, 1, 5], 6, { indices: [0, 3], values: [1, 5] }],
    [[1, 2, 3], 10, null]
  ];

  for (const [values, target, expected] of cases) {
    const original = [...values];
    assert.deepEqual(findPairSum(values, target), expected);
    assert.deepEqual(values, original);
  }
});

test("pair-sum rejects malformed, sparse, nonfinite, undersized, and oversized input", () => {
  const sparse = Array(2);
  sparse[1] = 3;
  for (const values of [undefined, null, [], [1], sparse, [1, Number.NaN], [1, Infinity]]) {
    assert.throws(() => validatePairSumInput(values, 4));
  }
  assert.throws(
    () => validatePairSumInput(Array.from({ length: maximumPairSumValues + 1 }, (_, index) => index), 4),
    /12 values or fewer/
  );
  for (const target of [undefined, null, Number.NaN, Infinity, -Infinity]) {
    assert.throws(() => validatePairSumInput([1, 2], target));
  }
  assert.equal(findPairSum([Number.MAX_VALUE, -Number.MAX_VALUE], -Number.MAX_VALUE), null);
});

test("pair-sum uses Map-compatible canonical numeric lookup keys", () => {
  assert.equal(lookupKey(0), "0");
  assert.equal(lookupKey(-0), "0");
  assert.equal(lookupKey(1), "1");
  assert.equal(lookupKey(1.5), "1.5");
  assert.throws(() => lookupKey(Infinity));

  assert.deepEqual(
    findPairSum([-0, 1, 2], 0),
    null
  );
  assert.deepEqual(
    findPairSum([-0, 0], 0),
    { indices: [0, 1], values: [-0, 0] }
  );
});

test("pair-sum lesson parses bounded inputs and declares composite panels", () => {
  assert.deepEqual(pairSumLesson.input.parse({ values: "-2, 7, 4", target: "5" }), {
    values: [-2, 7, 4],
    target: 5
  });
  assert.deepEqual(pairSumLesson.input.serialize({ values: [-0, 2], target: -0 }), {
    values: "0, 2",
    target: "-0"
  });
  assert.throws(() => pairSumLesson.input.parse({ values: "2", target: "4" }), /at least two/);
  assert.throws(() => pairSumLesson.input.parse({ values: "2, 3", target: "" }), /finite number/);

  assert.equal(pairSumLesson.id, "arrays/pair-sum");
  assert.equal(pairSumLesson.order, 9);
  assert.equal(Object.hasOwn(pairSumLesson, "renderer"), false);
  assert.deepEqual(pairSumLesson.prerequisites, ["arrays/find-largest"]);
  assert.deepEqual(pairSumLesson.patterns, ["lookup"]);
  assert.deepEqual(pairSumLesson.views, [
    { id: "values", renderer: "array", heading: "Input values" },
    { id: "seen", renderer: "lookup", heading: "Seen value → earliest index" }
  ]);
});

test("pair-sum trace looks up before insertion and preserves earliest duplicate indices", () => {
  const trace = buildPairSumTrace({ values: [1, 4, 1, 5], target: 6 });

  assert.deepEqual(trace.map((step) => step.phase), [
    "initialize",
    "lookup",
    "remember",
    "lookup",
    "remember",
    "lookup",
    "keep-earliest",
    "lookup",
    "found",
    "complete"
  ]);
  assert.deepEqual(trace.at(-1).result, { indices: [0, 3], values: [1, 5] });
  const duplicate = trace.find((step) => step.phase === "keep-earliest");
  assert.deepEqual(
    duplicate.views.seen.entries.find((entry) => entry.key === "1"),
    { key: "1", value: 0, state: "seen" }
  );
  const found = trace.find((step) => step.phase === "found");
  assert.deepEqual(found.views.values.activeIndices, [3]);
  assert.deepEqual(found.views.values.markers.map((marker) => marker.index), [0, 3]);
  assert.deepEqual(found.views.seen.activeKeys, ["1"]);
  assert.deepEqual(found.views.seen.resultKeys, ["1"]);
});

test("pair-sum no-match trace returns null after recording every distinct value", () => {
  const trace = buildPairSumTrace({ values: [2, 4, 8], target: 7 });
  assert.equal(trace.at(-1).result, null);
  assert.equal(trace.at(-1).valuesSeen, 3);
  assert.deepEqual(trace.at(-1).views.seen.entries, [
    { key: "2", value: 0, state: "seen" },
    { key: "4", value: 1, state: "seen" },
    { key: "8", value: 2, state: "seen" }
  ]);
  assert.deepEqual(trace.at(-1).views.seen.resultKeys, []);
});

test("pair-sum trace is deterministic, solver-aligned, immutable, and owns every keyed snapshot", () => {
  const input = { values: [-3, 7, 2, 8], target: 5 };
  const original = structuredClone(input);
  const first = buildPairSumTrace(input);
  const second = buildPairSumTrace(structuredClone(input));

  assert.deepEqual(first, second);
  assert.deepEqual(input, original);
  assert.deepEqual(first.at(-1).result, findPairSum(input.values, input.target));
  first.forEach((step, index) => {
    assert.equal(step.step, index);
    assert.ok(step.codeSteps.length > 0);
    assert.equal(typeof step.narration, "string");
    assert.equal(typeof step.prompt, "string");
  });

  for (const panelId of ["values", "seen"]) {
    assert.equal(new Set(first.map((step) => step.views[panelId])).size, first.length, panelId);
  }
  for (const property of ["values", "activeIndices", "ranges", "markers", "annotations", "changedIndices"]) {
    assert.equal(
      new Set(first.map((step) => step.views.values[property])).size,
      first.length,
      `values.${property}`
    );
  }
  for (const property of ["entries", "activeKeys", "annotations", "resultKeys"]) {
    assert.equal(
      new Set(first.map((step) => step.views.seen[property])).size,
      first.length,
      `seen.${property}`
    );
  }
  for (const [panelId, properties] of [
    ["values", ["ranges", "markers", "annotations"]],
    ["seen", ["entries", "annotations"]]
  ]) {
    for (const property of properties) {
      const objects = first.flatMap((step) => step.views[panelId][property]);
      assert.equal(new Set(objects).size, objects.length, `${panelId}.${property}`);
    }
  }
});
