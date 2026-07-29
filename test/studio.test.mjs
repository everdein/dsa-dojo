import test from "node:test";
import assert from "node:assert/strict";
import { findLargest } from "../arrays/find-largest.mjs";
import { maxWindowSum } from "../arrays/sliding-window.mjs";
import { projectArrayView } from "../studio/src/array-renderer.mjs";
import { parseNumberList, parsePositiveInteger } from "../studio/src/input.mjs";
import {
  assertLesson,
  assertTrace,
  buildValidatedTrace
} from "../studio/src/lesson-contract.mjs";
import { getLesson, listLessons } from "../studio/src/lessons/index.mjs";
import { createPlayerState, playerReducer } from "../studio/src/player.mjs";
import { resolveRequest } from "../studio/server.mjs";

const lessons = listLessons();

test("registry exposes two unique, ordered lessons", () => {
  assert.deepEqual(lessons.map((lesson) => lesson.id), [
    "arrays/find-largest",
    "arrays/sliding-window"
  ]);
  assert.equal(new Set(lessons.map((lesson) => lesson.id)).size, lessons.length);
  assert.equal(getLesson("arrays/sliding-window").order, 2);
  assert.throws(() => getLesson("missing"));
});

test("every registered lesson satisfies the complete contract", () => {
  for (const lesson of lessons) assert.equal(assertLesson(lesson), lesson);
});

test("lesson contract rejects metadata and input definitions the browser cannot render", () => {
  const lesson = getLesson("arrays/find-largest");
  assert.throws(() => assertLesson({ ...lesson, catalogLabel: "" }));
  assert.throws(() => assertLesson({
    ...lesson,
    input: { ...lesson.input, parse: null }
  }));
  assert.throws(() => assertLesson({
    ...lesson,
    legend: []
  }));
});

test("every lesson default and sample produces a valid deterministic trace", () => {
  for (const lesson of lessons) {
    for (const input of [lesson.input.defaultValue, lesson.input.sampleValue]) {
      const before = structuredClone(input);
      const trace = buildValidatedTrace(lesson, input);
      assert.equal(assertTrace(trace, lesson), trace);
      assert.deepEqual(input, before);
      assert.equal(trace.at(-1).phase, "complete");
      assert.deepEqual(trace.at(-1).result, lesson.solve(input));
    }
  }
});

test("number-list input accepts whitespace, decimals, negatives, and duplicates", () => {
  assert.deepEqual(parseNumberList(" -2, 3.5, 3.5 "), [-2, 3.5, 3.5]);
});

test("number-list input rejects empty, missing, nonnumeric, nonfinite, and oversized values", () => {
  for (const raw of ["", "1,,2", "1, nope", "1, Infinity", Array.from({ length: 13 }, (_, index) => index).join(",")]) {
    assert.throws(() => parseNumberList(raw));
  }
});

test("positive-integer input rejects zero, fractions, and words", () => {
  assert.equal(parsePositiveInteger("3", "Size"), 3);
  for (const raw of ["0", "1.5", "three"]) {
    assert.throws(() => parsePositiveInteger(raw, "Size"));
  }
});

test("findLargest handles ordinary, singleton, negative, and duplicate values without mutation", () => {
  const values = [-3, 7, 2, 7, 4];
  const before = [...values];
  assert.equal(findLargest(values), 7);
  assert.equal(findLargest([4]), 4);
  assert.equal(findLargest([-8, -2, -2]), -2);
  assert.deepEqual(values, before);
});

test("findLargest rejects missing, empty, and nonfinite inputs", () => {
  assert.throws(() => findLargest());
  assert.throws(() => findLargest([]));
  assert.throws(() => findLargest([1, Number.NaN]));
});

test("maxWindowSum returns the best fixed range without mutating input", () => {
  const values = [2, 1, 5, 1, 3, 2];
  const before = [...values];
  assert.deepEqual(maxWindowSum(values, 3), { sum: 9, start: 2, end: 4 });
  assert.deepEqual(values, before);
});

test("maxWindowSum handles all-negative values and boundary window sizes", () => {
  assert.deepEqual(maxWindowSum([-5, -2, -8], 1), { sum: -2, start: 1, end: 1 });
  assert.deepEqual(maxWindowSum([3, -1, 4], 3), { sum: 6, start: 0, end: 2 });
});

test("maxWindowSum rejects invalid sizes and values", () => {
  for (const size of [0, 1.5, 4]) {
    assert.throws(() => maxWindowSum([1, 2, 3], size));
  }
  assert.throws(() => maxWindowSum([1, Number.NaN], 1));
});

test("find-largest trace covers update and no-update decisions", () => {
  const lesson = getLesson("arrays/find-largest");
  const trace = buildValidatedTrace(lesson, { values: [3, 5, 5, 1] });
  assert.ok(trace.some((step) => step.codeSteps.includes("update-largest")));
  assert.ok(trace.some((step) => step.phase === "compare" && !step.changed));
  assert.equal(trace.at(-1).bestIndex, 1);
});

test("sliding-window trace preserves range width and running sums", () => {
  const lesson = getLesson("arrays/sliding-window");
  const input = { values: [2, 1, 5, 1, 3, 2], size: 3 };
  const trace = buildValidatedTrace(lesson, input);
  for (const step of trace.filter((item) => item.phase !== "complete")) {
    assert.equal(step.currentEnd - step.currentStart + 1, input.size);
    const oracle = input.values
      .slice(step.currentStart, step.currentEnd + 1)
      .reduce((sum, value) => sum + value, 0);
    assert.equal(step.currentSum, oracle);
  }
  assert.equal(trace[1].leavingIndex, 0);
  assert.equal(trace[1].enteringIndex, 3);
});

test("array view projection exposes active, range, marker, and accessible state", () => {
  const models = projectArrayView({
    values: [2, 4, 6],
    activeIndices: [2],
    ranges: [{ start: 1, end: 2, kind: "window", label: "current window" }],
    markers: [{ index: 2, kind: "entering", label: "in" }],
    annotations: [{ index: 1, label: "left" }]
  });
  assert.equal(models[2].active, true);
  assert.equal(models[2].ranges[0].isEnd, true);
  assert.equal(models[2].markers[0].kind, "entering");
  assert.match(models[2].ariaLabel, /current window, in/);
  assert.equal(models[1].annotations[0].label, "left");
});

test("player loads lessons and input while preserving studio preferences", () => {
  let state = createState();
  state = playerReducer(state, { type: "SET_SPEED", speed: 500 });
  state = playerReducer(state, { type: "TOGGLE_GUIDE" });
  state = playerReducer(state, {
    type: "LOAD_LESSON",
    lessonId: "next",
    trace: [{ step: 0 }, { step: 1 }],
    input: { values: [2] }
  });
  assert.equal(state.lessonId, "next");
  assert.equal(state.index, 0);
  assert.equal(state.speed, 500);
  assert.equal(state.guideMinimized, true);
});

test("player next, previous, and indexed steps clamp and set coherent statuses", () => {
  let state = createState();
  state = playerReducer(state, { type: "NEXT" });
  assert.deepEqual([state.index, state.status], [1, "paused"]);
  state = playerReducer(state, { type: "STEP", index: 99 });
  assert.deepEqual([state.index, state.status], [2, "complete"]);
  state = playerReducer(state, { type: "PREVIOUS" });
  assert.deepEqual([state.index, state.status], [1, "paused"]);
  state = playerReducer(state, { type: "STEP", index: Number.NaN });
  assert.deepEqual([state.index, state.status], [0, "ready"]);
});

test("player play, tick, pause, reset, and validation error remain coherent", () => {
  let state = createState();
  state = playerReducer(state, { type: "PLAY" });
  assert.equal(state.status, "playing");
  state = playerReducer(state, { type: "TICK" });
  assert.deepEqual([state.index, state.status], [1, "playing"]);
  state = playerReducer(state, { type: "PAUSE" });
  assert.equal(state.status, "paused");
  state = playerReducer(state, { type: "VALIDATION_ERROR", message: "Invalid" });
  assert.equal(state.status, "error");
  assert.equal(state.index, 1);
  state = playerReducer(state, { type: "RESET" });
  assert.deepEqual([state.index, state.status, state.error], [0, "ready", ""]);
});

test("player restarts after completion and normalizes speed", () => {
  let state = createState();
  state = playerReducer(state, { type: "STEP", index: 2 });
  state = playerReducer(state, { type: "PLAY" });
  assert.deepEqual([state.index, state.status], [0, "playing"]);
  state = playerReducer(state, { type: "SET_SPEED", speed: Number.NaN });
  assert.equal(state.speed, 850);
  state = playerReducer(state, { type: "SET_SPEED", speed: 10 });
  assert.equal(state.speed, 250);
});

test("static server resolves only explicitly allowed directories", () => {
  assert.match(resolveRequest("/"), /studio[\\/]index\.html$/);
  assert.match(resolveRequest("/src/app.mjs"), /studio[\\/]src[\\/]app\.mjs$/);
  assert.match(resolveRequest("/arrays/find-largest.mjs"), /arrays[\\/]find-largest\.mjs$/);
  assert.equal(resolveRequest("/package.json"), null);
  assert.equal(resolveRequest("/arrays/%5c..%5cpackage.json"), null);
  assert.equal(resolveRequest("/arrays/%5c..%5c.git%5cconfig"), null);
  assert.equal(resolveRequest("/src/%5c..%5c..%5cpackage.json"), null);
});

function createState() {
  return createPlayerState({
    lessonId: "test",
    trace: [{ step: 0 }, { step: 1 }, { step: 2 }],
    input: { values: [1, 2, 3] }
  });
}
