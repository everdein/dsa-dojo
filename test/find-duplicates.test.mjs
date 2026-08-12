import test from "node:test";
import assert from "node:assert/strict";
import {
  findDuplicates,
  maximumDuplicateValues,
  validateFindDuplicatesInput
} from "../hash-maps-and-sets/find-duplicates.mjs";
import {
  buildFindDuplicatesTrace,
  numericLookupKey
} from "../studio/src/find-duplicates.mjs";
import { findDuplicatesLesson } from "../studio/src/lessons/find-duplicates.mjs";
import {
  assertLesson,
  buildValidatedTrace
} from "../studio/src/lesson-contract.mjs";

test("find-duplicates returns each value once in second-occurrence discovery order", () => {
  const cases = [
    [[4, 2, 7, 2, 4, 4, 9], [2, 4]],
    [[1, 2, 1, 2], [1, 2]],
    [[5, 5, 5, 5], [5]],
    [[1, 2, 3], []],
    [[-2, 3, -2, 3], [-2, 3]],
    [[-0, 0, -0], [0]]
  ];

  for (const [values, expected] of cases) {
    const original = [...values];
    assert.deepEqual(findDuplicates(values), expected);
    assert.deepEqual(values, original);
  }
});

test("find-duplicates rejects missing, empty, sparse, nonfinite, and oversized arrays", () => {
  const sparse = Array(2);
  sparse[1] = 4;
  for (const values of [undefined, null, [], sparse, [1, Number.NaN], [Infinity], [1, -Infinity]]) {
    assert.throws(() => validateFindDuplicatesInput(values));
  }
  assert.throws(
    () => validateFindDuplicatesInput(Array.from({ length: maximumDuplicateValues + 1 }, (_, index) => index)),
    /12 values or fewer/
  );
});

test("find-duplicates lookup keys mirror SameValueZero membership", () => {
  assert.equal(numericLookupKey(-0), "0");
  assert.equal(numericLookupKey(0), "0");
  assert.equal(numericLookupKey(-2.5), "-2.5");
  assert.throws(() => numericLookupKey(Number.NaN));
});

test("find-duplicates lesson is a valid array plus lookup composition", () => {
  assert.equal(findDuplicatesLesson.id, "hash-maps-and-sets/find-duplicates");
  assert.equal(findDuplicatesLesson.order, 14);
  assert.equal(Object.hasOwn(findDuplicatesLesson, "renderer"), false);
  assert.deepEqual(findDuplicatesLesson.prerequisites, ["arrays/pair-sum"]);
  assert.deepEqual(findDuplicatesLesson.patterns, ["set-membership", "duplicate-detection"]);
  assert.deepEqual(findDuplicatesLesson.views, [
    { id: "values", renderer: "array", heading: "Input values" },
    { id: "seen", renderer: "lookup", heading: "Seen set" }
  ]);
  assert.deepEqual(findDuplicatesLesson.input.parse({ values: "-0, 2, 2" }), {
    values: [-0, 2, 2]
  });
  assert.deepEqual(findDuplicatesLesson.input.serialize({ values: [-0, 2, 2] }), {
    values: "-0, 2, 2"
  });
  assert.equal(assertLesson(findDuplicatesLesson), findDuplicatesLesson);
  assert.deepEqual(
    buildValidatedTrace(findDuplicatesLesson, findDuplicatesLesson.input.defaultValue).at(-1).result,
    [2, 4]
  );
});

test("find-duplicates trace separates check, first record, duplicate, and later repeat", () => {
  const trace = buildFindDuplicatesTrace([5, 2, 5, 5]);
  assert.deepEqual(trace.map((step) => step.phase), [
    "initialize",
    "check",
    "record",
    "check",
    "record",
    "check",
    "duplicate",
    "check",
    "already-reported",
    "complete"
  ]);

  const firstCheck = trace[1];
  assert.deepEqual(firstCheck.views.seen.entries, []);
  assert.equal(firstCheck.occurrence, 1);

  const duplicate = trace.find((step) => step.phase === "duplicate");
  assert.equal(duplicate.currentIndex, 2);
  assert.equal(duplicate.occurrence, 2);
  assert.deepEqual(duplicate.duplicates, [5]);
  assert.deepEqual(duplicate.views.seen.activeKeys, ["5"]);
  assert.deepEqual(duplicate.views.seen.resultKeys, ["5"]);
  assert.deepEqual(
    duplicate.views.seen.entries.find((entry) => entry.key === "5"),
    { key: "5", value: "duplicate", state: "duplicate" }
  );

  const later = trace.find((step) => step.phase === "already-reported");
  assert.equal(later.occurrence, 3);
  assert.deepEqual(later.duplicates, [5]);
  assert.deepEqual(trace.at(-1).result, [5]);
});

test("find-duplicates trace preserves second-occurrence order and zero identity", () => {
  const trace = buildFindDuplicatesTrace([4, 2, 2, -0, 4, 0, 2]);
  assert.deepEqual(trace.at(-1).result, [2, 4, 0]);
  assert.deepEqual(trace.at(-1).views.seen.entries, [
    { key: "4", value: "duplicate", state: "duplicate" },
    { key: "2", value: "duplicate", state: "duplicate" },
    { key: "0", value: "duplicate", state: "duplicate" }
  ]);
  assert.deepEqual(trace.at(-1).views.seen.resultKeys, ["2", "4", "0"]);
});

test("find-duplicates all-unique trace returns an empty result", () => {
  const trace = buildFindDuplicatesTrace([1, 2, 3]);
  assert.equal(trace.some((step) => step.phase === "duplicate"), false);
  assert.deepEqual(trace.at(-1).result, []);
  assert.equal(trace.at(-1).distinctSeen, 3);
  assert.deepEqual(trace.at(-1).views.seen.resultKeys, []);
});

test("find-duplicates trace is deterministic, solver-aligned, immutable, and deeply owned", () => {
  const values = [-2, 4, -2, 7, 4, 4];
  const original = [...values];
  const first = buildFindDuplicatesTrace(values);
  const second = buildFindDuplicatesTrace([...values]);

  assert.deepEqual(first, second);
  assert.deepEqual(values, original);
  assert.deepEqual(first.at(-1).result, findDuplicates(values));
  first.forEach((step, index) => {
    assert.equal(step.step, index);
    assert.ok(step.codeSteps.length > 0);
    assert.equal(typeof step.narration, "string");
    assert.equal(typeof step.prompt, "string");
    assert.deepEqual(step.views.values.values, values);
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
