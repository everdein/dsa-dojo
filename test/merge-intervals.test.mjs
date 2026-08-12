import test from "node:test";
import assert from "node:assert/strict";
import {
  formatIntervalList,
  maximumMergeIntervals,
  mergeIntervals,
  parseIntervalList,
  sortIntervalsByStart,
  validateIntervals
} from "../patterns/intervals/merge-intervals.mjs";
import {
  assertLesson,
  assertTrace,
  buildValidatedTrace
} from "../studio/src/lesson-contract.mjs";
import { buildMergeIntervalsTrace } from "../studio/src/merge-intervals.mjs";
import { mergeIntervalsLesson } from "../studio/src/lessons/merge-intervals.mjs";

test("merge-intervals sorts a copy and merges overlap, containment, and touching", () => {
  const intervals = [
    { start: 8, end: 10 },
    { start: 2, end: 6 },
    { start: 1, end: 3 },
    { start: 10, end: 12 },
    { start: 2, end: 4 }
  ];
  const before = structuredClone(intervals);
  assert.deepEqual(mergeIntervals(intervals), [
    { start: 1, end: 6 },
    { start: 8, end: 12 }
  ]);
  assert.deepEqual(intervals, before);
  assert.notEqual(mergeIntervals(intervals)[0], intervals[0]);
});

test("merge-intervals handles disjoint, singleton, equal starts, and negative endpoints", () => {
  assert.deepEqual(mergeIntervals([{ start: 4, end: 5 }]), [{ start: 4, end: 5 }]);
  assert.deepEqual(
    mergeIntervals([{ start: 3, end: 4 }, { start: -3, end: -1 }, { start: 1, end: 2 }]),
    [{ start: -3, end: -1 }, { start: 1, end: 2 }, { start: 3, end: 4 }]
  );
  assert.deepEqual(
    mergeIntervals([{ start: -2, end: 1 }, { start: -4, end: -2 }, { start: -2, end: 5 }]),
    [{ start: -4, end: 5 }]
  );
  assert.deepEqual(
    sortIntervalsByStart([{ start: 1, end: 5 }, { start: 1, end: 2 }]),
    [{ start: 1, end: 2 }, { start: 1, end: 5 }]
  );
});

test("merge-interval parser uses unambiguous colon endpoints and round trips", () => {
  const intervals = parseIntervalList(" 1:3, -2:4, 8.5:10 ");
  assert.deepEqual(intervals, [
    { start: 1, end: 3 },
    { start: -2, end: 4 },
    { start: 8.5, end: 10 }
  ]);
  assert.equal(formatIntervalList(intervals), "1:3, -2:4, 8.5:10");
  assert.deepEqual(parseIntervalList(formatIntervalList([{ start: -0, end: 2 }])), [{ start: -0, end: 2 }]);
});

test("merge-interval validation rejects malformed, sparse, reversed, nonfinite, and oversized input", () => {
  const sparse = [{ start: 1, end: 2 }, { start: 3, end: 4 }];
  delete sparse[0];
  for (const intervals of [
    undefined,
    null,
    [],
    sparse,
    [[1, 2]],
    [{ start: 1 }],
    [{ start: 3, end: 2 }],
    [{ start: Number.NaN, end: 2 }],
    [{ start: 1, end: Infinity }],
    Array.from({ length: maximumMergeIntervals + 1 }, (_, start) => ({ start, end: start + 1 }))
  ]) {
    assert.throws(() => validateIntervals(intervals));
  }
  for (const source of [undefined, "", " ", "1-3", "1:", ":2", "1:2,", "a:2", "3:2", "1e309:2", "1:2:3"]) {
    assert.throws(() => parseIntervalList(source));
  }
});

test("merge-interval trace exposes sorted initialization and every scan decision", () => {
  const trace = buildMergeIntervalsTrace([
    { start: 8, end: 10 },
    { start: 2, end: 6 },
    { start: 1, end: 7 },
    { start: 10, end: 12 }
  ]);
  assert.deepEqual(trace[0].view.values, [[1, 7], [2, 6], [8, 10], [10, 12]]);
  assert.ok(trace.some(({ phase }) => phase === "contain"));
  assert.ok(trace.some(({ phase }) => phase === "append"));
  assert.ok(trace.some(({ phase }) => phase === "merge"));
  assert.deepEqual(trace.at(-1).result, [{ start: 1, end: 7 }, { start: 8, end: 12 }]);
});

test("merge-interval trace windows ten intervals through the eight-row grid", () => {
  const intervals = Array.from({ length: maximumMergeIntervals }, (_, index) => ({
    start: index * 3,
    end: index * 3 + 1
  }));
  const trace = buildMergeIntervalsTrace(intervals);
  assert.ok(trace.every((step) => step.view.values.length <= 8));
  assert.ok(trace.some((step) => step.hiddenBefore > 0));
  assert.deepEqual(trace.at(-1).result, intervals);
});

test("merge-interval trace is deterministic, solver-aligned, immutable, and deeply owned", () => {
  const input = structuredClone(mergeIntervalsLesson.input.defaultValue);
  const trace = buildValidatedTrace(mergeIntervalsLesson, input);
  assert.deepEqual(input, mergeIntervalsLesson.input.defaultValue);
  assert.deepEqual(trace.at(-1).result, mergeIntervals(input.intervals));

  for (const property of ["values", "activeCells", "changedCells", "markers", "annotations"]) {
    assert.equal(new Set(trace.map((step) => step.view[property])).size, trace.length, property);
  }
  const rows = trace.flatMap((step) => step.view.values);
  assert.equal(new Set(rows).size, rows.length);
});

test("merge-interval lesson satisfies its full legacy grid contract", () => {
  assert.equal(assertLesson(mergeIntervalsLesson), mergeIntervalsLesson);
  const trace = buildValidatedTrace(mergeIntervalsLesson, mergeIntervalsLesson.input.sampleValue);
  assert.equal(assertTrace(trace, mergeIntervalsLesson), trace);
  assert.equal(mergeIntervalsLesson.order, 23);
  assert.deepEqual(mergeIntervalsLesson.prerequisites, ["arrays/move-zeros"]);
  assert.deepEqual(mergeIntervalsLesson.patterns, ["intervals", "sorting", "linear-scan"]);
  assert.deepEqual(
    mergeIntervalsLesson.input.parse(mergeIntervalsLesson.input.serialize({ intervals: [{ start: -2, end: 4 }] })),
    { intervals: [{ start: -2, end: 4 }] }
  );
});

test("merge-interval trace rejects shared mutable grid snapshots", () => {
  const trace = buildMergeIntervalsTrace([{ start: 1, end: 3 }, { start: 2, end: 4 }]);
  trace[1].view.values = trace[0].view.values;
  assert.throws(() => assertTrace(trace, mergeIntervalsLesson), /values snapshot/);
});
