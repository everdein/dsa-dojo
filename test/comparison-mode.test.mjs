import assert from "node:assert/strict";
import test from "node:test";

import {
  comparisonFamilies,
  comparisonFamilyForLesson,
  comparisonReducer,
  comparisonSummary,
  createComparisonRun,
  getComparisonFamily
} from "../studio/src/comparison-mode.mjs";
import { getLesson } from "../studio/src/lessons/index.mjs";

test("comparison families define unique compatible algorithms and shared inputs", () => {
  assert.deepEqual(comparisonFamilies.map(({ id }) => id), ["sorting-strategies", "fibonacci-strategies"]);
  for (const family of comparisonFamilies) {
    assert.ok(family.lessonIds.length >= 2);
    assert.equal(new Set(family.lessonIds).size, family.lessonIds.length);
    assert.ok(family.defaultPair.every((id) => family.lessonIds.includes(id)));
    const parsed = family.input.parse(family.input.serialize(structuredClone(family.input.defaultValue)));
    assert.deepEqual(parsed, family.input.defaultValue);
  }
  assert.equal(comparisonFamilyForLesson("sorting/quick-sort").id, "sorting-strategies");
  assert.equal(comparisonFamilyForLesson("arrays/find-largest"), null);
  assert.throws(() => getComparisonFamily("unknown"), /Unknown comparison family/);
});

test("every algorithm pair agrees for family default and sample inputs", () => {
  for (const family of comparisonFamilies) {
    for (let leftIndex = 0; leftIndex < family.lessonIds.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < family.lessonIds.length; rightIndex += 1) {
        for (const input of [family.input.defaultValue, family.input.sampleValue]) {
          const run = createComparisonRun({
            family,
            leftLesson: getLesson(family.lessonIds[leftIndex]),
            rightLesson: getLesson(family.lessonIds[rightIndex]),
            input
          });
          assert.equal(comparisonSummary(run).resultsMatch, true);
          assert.notStrictEqual(run.input, input);
          assert.notStrictEqual(run.left.trace, run.right.trace);
        }
      }
    }
  }
});

test("sorting and Fibonacci families agree across boundary and adversarial shared inputs", () => {
  const casesByFamily = new Map([
    ["sorting-strategies", [
      { values: [7] },
      { values: [3, 3, 3] },
      { values: [-4, 0, -1, 9] },
      { values: [1, 2, 3, 4, 5, 6, 7, 8] },
      { values: [8, 7, 6, 5, 4, 3, 2, 1] }
    ]],
    ["fibonacci-strategies", Array.from({ length: 7 }, (_, value) => ({ value }))]
  ]);

  for (const family of comparisonFamilies) {
    for (const input of casesByFamily.get(family.id)) {
      for (let left = 0; left < family.lessonIds.length; left += 1) {
        for (let right = left + 1; right < family.lessonIds.length; right += 1) {
          const run = createComparisonRun({
            family,
            leftLesson: getLesson(family.lessonIds[left]),
            rightLesson: getLesson(family.lessonIds[right]),
            input
          });
          assert.equal(comparisonSummary(run).resultsMatch, true, `${family.id}: ${JSON.stringify(input)}`);
        }
      }
    }
  }
});

test("comparison stepping supports synchronized and independent inspection", () => {
  const family = getComparisonFamily("sorting-strategies");
  let run = createComparisonRun({
    family,
    leftLesson: getLesson("sorting/bubble-sort"),
    rightLesson: getLesson("sorting/merge-sort"),
    input: { values: [3, 1, 2] }
  });
  const original = structuredClone(run);

  run = comparisonReducer(run, { type: "NEXT" });
  assert.deepEqual([run.left.index, run.right.index, run.status], [1, 1, "paused"]);
  run = comparisonReducer(run, { type: "STEP_SIDE", side: "right", index: 4 });
  assert.deepEqual([run.left.index, run.right.index], [1, 4]);
  run = comparisonReducer(run, { type: "PREVIOUS" });
  assert.deepEqual([run.left.index, run.right.index], [0, 3]);
  assert.equal(original.left.index, 0);
  assert.throws(() => comparisonReducer(run, { type: "STEP_SIDE", side: "middle", index: 1 }), /Unknown comparison side/);
});

test("comparison playback clamps speed, restarts, and completes both traces", () => {
  const family = getComparisonFamily("fibonacci-strategies");
  let run = createComparisonRun({
    family,
    leftLesson: getLesson(family.defaultPair[0]),
    rightLesson: getLesson(family.defaultPair[1]),
    input: { value: 3 }
  });
  run = comparisonReducer(run, { type: "SET_SPEED", speed: 10 });
  assert.equal(run.speed, 250);
  run = comparisonReducer(run, { type: "PLAY" });
  while (run.status === "playing") run = comparisonReducer(run, { type: "TICK" });
  assert.equal(comparisonSummary(run).bothComplete, true);
  run = comparisonReducer(run, { type: "PLAY" });
  assert.deepEqual([run.left.index, run.right.index, run.status], [0, 0, "playing"]);
  run = comparisonReducer(run, { type: "RESET" });
  assert.deepEqual([run.left.index, run.right.index, run.status], [0, 0, "ready"]);
});

test("comparison rejects duplicate, incompatible, and disagreeing algorithms", () => {
  const family = getComparisonFamily("sorting-strategies");
  assert.throws(() => createComparisonRun({
    family,
    leftLesson: getLesson("sorting/bubble-sort"),
    rightLesson: getLesson("sorting/bubble-sort"),
    input: { values: [2, 1] }
  }), /different algorithms/);
  assert.throws(() => createComparisonRun({
    family,
    leftLesson: getLesson("arrays/find-largest"),
    rightLesson: getLesson("sorting/bubble-sort"),
    input: { values: [2, 1] }
  }), /does not belong/);
});
