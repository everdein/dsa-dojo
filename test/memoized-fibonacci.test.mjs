import test from "node:test";
import assert from "node:assert/strict";
import {
  fibonacciMemoized,
  formatMemoizedFibonacciInput,
  maximumMemoizedFibonacciInput,
  memoizedFibonacci,
  parseMemoizedFibonacciInput,
  validateMemoizedFibonacciInput
} from "../dynamic-programming/memoized-fibonacci.mjs";
import {
  countRecursiveFibonacciCalls,
  recursiveFibonacci
} from "../recursion/fibonacci.mjs";
import {
  assertLesson,
  assertTrace,
  buildValidatedTrace
} from "../studio/src/lesson-contract.mjs";
import { buildMemoizedFibonacciTrace } from "../studio/src/memoized-fibonacci.mjs";
import { memoizedFibonacciLesson } from "../studio/src/lessons/memoized-fibonacci.mjs";

test("memoized Fibonacci returns the canonical bounded sequence", () => {
  const values = Array.from(
    { length: maximumMemoizedFibonacciInput + 1 },
    (_, value) => memoizedFibonacci(value)
  );
  assert.deepEqual(values, [0, 1, 1, 2, 3, 5, 8]);
  assert.equal(fibonacciMemoized(6), 8);
});

test("memoized and naive Fibonacci agree for every shared input", () => {
  for (let value = 0; value <= maximumMemoizedFibonacciInput; value += 1) {
    assert.equal(memoizedFibonacci(value), recursiveFibonacci(value));
  }
});

test("Memoized Fibonacci validates bounded nonnegative whole numbers", () => {
  assert.equal(validateMemoizedFibonacciInput(0), 0);
  assert.equal(
    validateMemoizedFibonacciInput(maximumMemoizedFibonacciInput),
    maximumMemoizedFibonacciInput
  );
  for (const value of [
    -1,
    1.5,
    Infinity,
    -Infinity,
    NaN,
    maximumMemoizedFibonacciInput + 1,
    "5",
    null,
    undefined
  ]) {
    assert.throws(
      () => validateMemoizedFibonacciInput(value),
      /whole number from 0/
    );
  }
});

test("Memoized Fibonacci parser and formatter round trip canonical inputs", () => {
  assert.equal(parseMemoizedFibonacciInput(" 0 "), 0);
  assert.equal(parseMemoizedFibonacciInput("6"), 6);
  for (let value = 0; value <= maximumMemoizedFibonacciInput; value += 1) {
    assert.equal(
      parseMemoizedFibonacciInput(formatMemoizedFibonacciInput(value)),
      value
    );
  }
  for (const source of [
    undefined,
    null,
    "",
    " ",
    "-1",
    "1.5",
    "7",
    "nope",
    "Infinity"
  ]) {
    assert.throws(() => parseMemoizedFibonacciInput(source));
  }
});

test("memoized trace reports linear work beside the L43 naive call count", () => {
  const expectedMemoizedCalls = [1, 1, 3, 5, 7, 9, 11];
  const expectedCacheHits = [0, 0, 0, 1, 2, 3, 4];
  for (let value = 0; value <= maximumMemoizedFibonacciInput; value += 1) {
    const complete = buildMemoizedFibonacciTrace(value).at(-1);
    assert.equal(complete.result, memoizedFibonacci(value));
    assert.equal(complete.memoizedCalls, expectedMemoizedCalls[value]);
    assert.equal(complete.calls, expectedMemoizedCalls[value]);
    assert.equal(complete.naiveCalls, countRecursiveFibonacciCalls(value));
    assert.equal(complete.cacheHits, expectedCacheHits[value]);
    assert.equal(complete.computations, value <= 1 ? 1 : value + 1);
    assert.equal(complete.memoSize, value <= 1 ? 1 : value + 1);
    assert.equal(complete.workSaved, complete.naiveCalls - complete.calls);
  }
});

test("cache hits are leaves that reuse a visible memo entry", () => {
  const trace = buildMemoizedFibonacciTrace(6);
  const cacheHitSteps = trace.filter(({ phase }) => phase === "cache-hit");
  assert.equal(cacheHitSteps.length, 4);

  for (const step of cacheHitSteps) {
    const callId = step.views.calls.activeNodeIds[0];
    const currentKey = String(step.currentValue);
    assert.equal(
      step.views.calls.edges.some(({ fromId }) => fromId === callId),
      false,
      `${callId} must not expand a repeated subtree`
    );
    assert.ok(
      step.views.calls.states.some(({ nodeId, kind }) => (
        nodeId === callId && kind === "cache-hit"
      ))
    );
    assert.deepEqual(step.views.memo.activeKeys, [currentKey]);
    assert.deepEqual(step.views.memo.resultKeys, [currentKey]);
    assert.ok(step.views.memo.entries.some(({ key }) => key === currentKey));
  }
});

test("trace caches base cases and each combined result in deterministic order", () => {
  const trace = buildMemoizedFibonacciTrace(6);
  for (const phase of [
    "initialize",
    "call",
    "expand",
    "base-case",
    "cache-hit",
    "store-result",
    "complete"
  ]) {
    assert.ok(trace.some((step) => step.phase === phase), phase);
  }
  assert.deepEqual(trace.at(-1).views.memo.entries, [
    { key: "1", value: 1, state: "cached" },
    { key: "0", value: 0, state: "cached" },
    { key: "2", value: 1, state: "cached" },
    { key: "3", value: 2, state: "cached" },
    { key: "4", value: 3, state: "cached" },
    { key: "5", value: 5, state: "cached" },
    { key: "6", value: 8, state: "cached" }
  ]);
  assert.equal(trace.at(-1).views.calls.nodes.length, 11);
  assert.equal(trace.at(-1).views.calls.edges.length, 10);
});

test("Memoized Fibonacci lesson has exact L50 metadata and round-trippable input", () => {
  assert.equal(assertLesson(memoizedFibonacciLesson), memoizedFibonacciLesson);
  assert.equal(memoizedFibonacciLesson.id, "dynamic-programming/memoized-fibonacci");
  assert.equal(memoizedFibonacciLesson.order, 50);
  assert.deepEqual(memoizedFibonacciLesson.prerequisites, [
    "recursion/recursive-fibonacci"
  ]);
  assert.deepEqual(memoizedFibonacciLesson.patterns, [
    "dynamic-programming",
    "memoization",
    "overlapping-subproblems"
  ]);
  assert.equal(Object.hasOwn(memoizedFibonacciLesson, "renderer"), false);
  assert.deepEqual(memoizedFibonacciLesson.views, [
    { id: "calls", renderer: "branching", heading: "Memoized call tree" },
    { id: "memo", renderer: "lookup", heading: "Memo table" }
  ]);
  const parsed = memoizedFibonacciLesson.input.parse({ value: "5" });
  assert.deepEqual(parsed, { value: 5 });
  assert.deepEqual(
    memoizedFibonacciLesson.input.parse(
      memoizedFibonacciLesson.input.serialize(parsed)
    ),
    parsed
  );
});

test("Memoized Fibonacci trace is deterministic, immutable, and deeply fresh", () => {
  const input = structuredClone(memoizedFibonacciLesson.input.defaultValue);
  const original = structuredClone(input);
  const first = buildValidatedTrace(memoizedFibonacciLesson, input);
  const second = buildMemoizedFibonacciTrace(input.value);

  assert.deepEqual(first, second);
  assert.deepEqual(input, original);
  assert.equal(assertTrace(first, memoizedFibonacciLesson), first);
  assert.deepEqual(first.at(-1).result, memoizedFibonacci(input.value));

  for (const panel of ["calls", "memo"]) {
    assert.equal(
      new Set(first.map((step) => step.views[panel])).size,
      first.length,
      panel
    );
  }
  for (const property of [
    "nodes",
    "edges",
    "rootIds",
    "activeNodeIds",
    "changedNodeIds",
    "states",
    "annotations",
    "pointers"
  ]) {
    assert.equal(
      new Set(first.map((step) => step.views.calls[property])).size,
      first.length,
      `calls.${property}`
    );
  }
  for (const property of ["entries", "activeKeys", "annotations", "resultKeys"]) {
    assert.equal(
      new Set(first.map((step) => step.views.memo[property])).size,
      first.length,
      `memo.${property}`
    );
  }
  for (const [panel, properties] of [
    ["calls", ["nodes", "edges", "states", "annotations", "pointers"]],
    ["memo", ["entries", "annotations"]]
  ]) {
    for (const property of properties) {
      const objects = first.flatMap((step) => step.views[panel][property]);
      assert.equal(
        new Set(objects).size,
        objects.length,
        `${panel}.${property} objects`
      );
    }
  }
  assert.equal(new Set(first.map(({ activePath }) => activePath)).size, first.length);
});

test("Memoized Fibonacci trace rejects shared renderer snapshots", () => {
  const trace = buildMemoizedFibonacciTrace(5);
  trace[1].views.memo.entries = trace[0].views.memo.entries;
  assert.throws(
    () => assertTrace(trace, memoizedFibonacciLesson),
    /entries snapshot/
  );
});
