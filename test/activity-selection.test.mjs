import test from "node:test";
import assert from "node:assert/strict";
import {
  activityId,
  activitySelection,
  formatActivityList,
  maximumActivityIntervals,
  parseActivityList,
  selectActivities,
  sortActivitiesByFinish,
  validateActivityIntervals
} from "../greedy/activity-selection.mjs";
import { buildActivitySelectionTrace } from "../studio/src/activity-selection.mjs";
import { activitySelectionLesson } from "../studio/src/lessons/activity-selection.mjs";
import {
  assertLesson,
  assertTrace,
  buildValidatedTrace
} from "../studio/src/lesson-contract.mjs";

test("activity selection chooses an immutable maximum schedule with original identities", () => {
  const intervals = [
    { start: 0, end: 6 },
    { start: 1, end: 4 },
    { start: 3, end: 5 },
    { start: 5, end: 7 },
    { start: 3, end: 9 },
    { start: 5, end: 9 },
    { start: 6, end: 10 },
    { start: 8, end: 11 },
    { start: 8, end: 12 },
    { start: 2, end: 14 }
  ];
  const original = structuredClone(intervals);
  const expected = [
    { id: "activity-1", originalIndex: 1, start: 1, end: 4 },
    { id: "activity-3", originalIndex: 3, start: 5, end: 7 },
    { id: "activity-7", originalIndex: 7, start: 8, end: 11 }
  ];
  const selected = selectActivities(intervals);

  assert.deepEqual(selected, expected);
  assert.deepEqual(activitySelection(intervals), expected);
  assert.deepEqual(intervals, original);
  assert.ok(selected.every((activity) => !intervals.includes(activity)));
  selected[0].start = 99;
  assert.deepEqual(intervals, original);
  assert.deepEqual(selectActivities(intervals), expected);
});

test("touching, negative, singleton, and overlapping activities are deterministic", () => {
  assert.deepEqual(selectActivities([{ start: -3, end: -1 }, { start: -1, end: 2 }, { start: 2, end: 4 }]), [
    { id: "activity-0", originalIndex: 0, start: -3, end: -1 },
    { id: "activity-1", originalIndex: 1, start: -1, end: 2 },
    { id: "activity-2", originalIndex: 2, start: 2, end: 4 }
  ]);
  assert.deepEqual(selectActivities([{ start: 7, end: 8 }]), [
    { id: "activity-0", originalIndex: 0, start: 7, end: 8 }
  ]);
  assert.deepEqual(selectActivities([
    { start: 0, end: 5 },
    { start: 1, end: 3 },
    { start: 2, end: 4 }
  ]), [
    { id: "activity-1", originalIndex: 1, start: 1, end: 3 }
  ]);
});

test("finish sorting has stable original ids and explicit deterministic tie breaks", () => {
  const sorted = sortActivitiesByFinish([
    { start: 3, end: 5 },
    { start: 1, end: 4 },
    { start: 2, end: 5 },
    { start: 2, end: 5 }
  ]);
  assert.deepEqual(sorted, [
    { id: "activity-1", originalIndex: 1, start: 1, end: 4 },
    { id: "activity-2", originalIndex: 2, start: 2, end: 5 },
    { id: "activity-3", originalIndex: 3, start: 2, end: 5 },
    { id: "activity-0", originalIndex: 0, start: 3, end: 5 }
  ]);
  assert.equal(activityId(0), "activity-0");
  assert.equal(activityId(maximumActivityIntervals - 1), "activity-9");
  assert.throws(() => activityId(-1));
  assert.throws(() => activityId(maximumActivityIntervals));
});

test("activity parser round trips finite colon intervals and validation rejects malformed input", () => {
  const intervals = parseActivityList(" 5:7, 1:4, -2:0, 8.5:10 ");
  assert.deepEqual(intervals, [
    { start: 5, end: 7 },
    { start: 1, end: 4 },
    { start: -2, end: 0 },
    { start: 8.5, end: 10 }
  ]);
  assert.equal(formatActivityList(intervals), "5:7, 1:4, -2:0, 8.5:10");
  assert.deepEqual(parseActivityList(formatActivityList([{ start: -0, end: 1 }])), [
    { start: -0, end: 1 }
  ]);

  const sparse = [{ start: 1, end: 2 }, { start: 3, end: 4 }];
  delete sparse[0];
  for (const candidate of [
    undefined,
    null,
    [],
    sparse,
    [[1, 2]],
    [{ start: 1 }],
    [{ start: 3, end: 2 }],
    [{ start: 2, end: 2 }],
    [{ start: Number.NaN, end: 2 }],
    [{ start: 1, end: Infinity }],
    Array.from({ length: maximumActivityIntervals + 1 }, (_, start) => ({
      start,
      end: start + 1
    }))
  ]) {
    assert.throws(() => validateActivityIntervals(candidate));
  }
  for (const source of [undefined, "", " ", "1-3", "1:", ":2", "1:2,", "a:2", "3:2", "2:2", "1e309:2"] ) {
    assert.throws(() => parseActivityList(source));
  }
});

test("earliest-finish count agrees with exhaustive compatible subsets", () => {
  const pool = [
    { start: 0, end: 1 },
    { start: 0, end: 2 },
    { start: 1, end: 2 },
    { start: 1, end: 3 },
    { start: 2, end: 3 },
    { start: 2, end: 4 },
    { start: 3, end: 4 }
  ];
  for (let inputMask = 1; inputMask < (1 << pool.length); inputMask += 1) {
    const intervals = pool.filter((_, index) => inputMask & (1 << index));
    assert.equal(selectActivities(intervals).length, maximumCompatibleCount(intervals));
  }
});

test("Activity Selection lesson declares exact L48 metadata and shared interval input", () => {
  assert.equal(assertLesson(activitySelectionLesson), activitySelectionLesson);
  assert.equal(activitySelectionLesson.id, "greedy/activity-selection");
  assert.equal(activitySelectionLesson.order, 48);
  assert.deepEqual(activitySelectionLesson.prerequisites, ["patterns/merge-intervals"]);
  assert.deepEqual(activitySelectionLesson.patterns, ["greedy", "intervals"]);
  assert.equal(Object.hasOwn(activitySelectionLesson, "renderer"), false);
  assert.deepEqual(activitySelectionLesson.views, [
    { id: "activities", renderer: "grid", heading: "Finish-sorted activities (start, end)" },
    { id: "decisions", renderer: "lookup", heading: "Original activity decisions" }
  ]);
  const parsed = activitySelectionLesson.input.parse({ intervals: "5:7, 1:4, 3:5" });
  assert.deepEqual(parsed, {
    intervals: [
      { start: 5, end: 7 },
      { start: 1, end: 4 },
      { start: 3, end: 5 }
    ]
  });
  assert.deepEqual(
    activitySelectionLesson.input.parse(activitySelectionLesson.input.serialize(parsed)),
    parsed
  );
});

test("trace preserves finish order and records accepted and rejected schedule decisions", () => {
  const intervals = structuredClone(activitySelectionLesson.input.defaultValue.intervals);
  const trace = buildValidatedTrace(activitySelectionLesson, { intervals });
  assert.deepEqual(trace.map(({ phase }) => phase), [
    "initialize",
    "consider", "accept",
    "consider", "reject",
    "consider", "accept",
    "consider", "reject",
    "consider", "reject",
    "consider", "accept",
    "complete"
  ]);
  assert.deepEqual(trace[0].views.activities.values, [
    [1, 4],
    [3, 5],
    [5, 7],
    [5, 9],
    [6, 10],
    [8, 11]
  ]);

  const decisions = trace.filter(({ phase }) => phase === "accept" || phase === "reject");
  assert.deepEqual(decisions.map(({ currentActivityId, phase }) => [currentActivityId, phase]), [
    ["activity-1", "accept"],
    ["activity-2", "reject"],
    ["activity-0", "accept"],
    ["activity-5", "reject"],
    ["activity-4", "reject"],
    ["activity-3", "accept"]
  ]);
  assert.deepEqual(trace.at(-1).views.decisions.entries.map(({ key, state }) => [key, state]), [
    ["activity-1", "accepted"],
    ["activity-2", "rejected"],
    ["activity-0", "accepted"],
    ["activity-5", "rejected"],
    ["activity-4", "rejected"],
    ["activity-3", "accepted"]
  ]);
  assert.deepEqual(trace.at(-1).views.decisions.resultKeys, [
    "activity-1",
    "activity-0",
    "activity-3"
  ]);
  assert.deepEqual(trace.at(-1).result, selectActivities(intervals));
  assert.match(trace[2].narration, /exchange/i);
  assert.match(activitySelectionLesson.reflection.body, /Replacing.*cannot reduce/i);
});

test("ten-activity trace uses a bounded moving grid viewport without losing identities", () => {
  const intervals = Array.from({ length: maximumActivityIntervals }, (_, index) => ({
    start: index * 2,
    end: index * 2 + 1
  })).reverse();
  const trace = buildActivitySelectionTrace(intervals);
  assert.ok(trace.every((step) => step.views.activities.values.length <= 8));
  assert.ok(trace.some((step) => step.hiddenBefore > 0));
  assert.ok(trace.every((step) => step.views.decisions.entries.length === 10));
  assert.equal(trace.at(-1).result.length, 10);
  assert.deepEqual(
    trace.at(-1).result.map(({ originalIndex }) => originalIndex),
    [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
  );
});

test("Activity Selection trace is deterministic, immutable, and deeply owns both panels", () => {
  const input = structuredClone(activitySelectionLesson.input.defaultValue);
  const original = structuredClone(input);
  const first = buildActivitySelectionTrace(input.intervals);
  const second = buildActivitySelectionTrace(structuredClone(input.intervals));

  assert.deepEqual(first, second);
  assert.deepEqual(input, original);
  assert.equal(assertTrace(first, activitySelectionLesson), first);
  assert.deepEqual(first.at(-1).result, selectActivities(input.intervals));
  first.forEach((step, index) => {
    assert.equal(step.step, index);
    assert.ok(step.codeSteps.length > 0);
    assert.equal(typeof step.narration, "string");
    assert.equal(typeof step.prompt, "string");
  });

  for (const [panelId, properties, objectProperties] of [
    ["activities", ["values", "activeCells", "changedCells", "markers", "annotations"], ["activeCells", "changedCells", "markers", "annotations"]],
    ["decisions", ["entries", "activeKeys", "annotations", "resultKeys"], ["entries", "annotations"]]
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
  const rows = first.flatMap((step) => step.views.activities.values);
  assert.equal(new Set(rows).size, rows.length, "grid rows");
  assert.equal(new Set(first.map((step) => step.selected)).size, first.length, "selected arrays");
  const selectedObjects = first.flatMap((step) => step.selected);
  assert.equal(new Set(selectedObjects).size, selectedObjects.length, "selected objects");
  assert.equal(new Set(first.map((step) => step.statusById)).size, first.length, "status objects");
  const currentActivities = first.map((step) => step.currentActivity).filter(Boolean);
  assert.equal(new Set(currentActivities).size, currentActivities.length, "current activity objects");
});

function maximumCompatibleCount(intervals) {
  let maximum = 0;
  for (let mask = 0; mask < (1 << intervals.length); mask += 1) {
    const subset = intervals
      .map((interval, index) => ({ ...interval, index }))
      .filter((_, index) => mask & (1 << index))
      .sort((left, right) => (
        left.end - right.end
        || left.start - right.start
        || left.index - right.index
      ));
    let lastFinish = null;
    let compatible = true;
    for (const interval of subset) {
      if (lastFinish !== null && interval.start < lastFinish) {
        compatible = false;
        break;
      }
      lastFinish = interval.end;
    }
    if (compatible) maximum = Math.max(maximum, subset.length);
  }
  return maximum;
}
