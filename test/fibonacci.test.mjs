import test from "node:test";
import assert from "node:assert/strict";
import {
  countRecursiveFibonacciCalls,
  maximumRecursiveFibonacciInput,
  parseRecursiveFibonacciInput,
  recursiveFibonacci,
  validateRecursiveFibonacciInput
} from "../recursion/fibonacci.mjs";
import { buildRecursiveFibonacciTrace } from "../studio/src/fibonacci.mjs";
import { buildValidatedTrace } from "../studio/src/lesson-contract.mjs";
import { recursiveFibonacciLesson } from "../studio/src/lessons/fibonacci.mjs";

test("recursive Fibonacci returns the canonical sequence", () => {
  assert.deepEqual(
    Array.from({ length: maximumRecursiveFibonacciInput + 1 }, (_, value) => recursiveFibonacci(value)),
    [0, 1, 1, 2, 3, 5, 8]
  );
});

test("recursive Fibonacci validates its bounded whole-number input", () => {
  for (const value of [-1, 1.5, Infinity, NaN, maximumRecursiveFibonacciInput + 1, "5", null]) {
    assert.throws(() => validateRecursiveFibonacciInput(value));
  }
  assert.equal(parseRecursiveFibonacciInput(" 5 "), 5);
  for (const value of ["", "   ", null, undefined]) {
    assert.throws(() => parseRecursiveFibonacciInput(value));
    assert.throws(() => recursiveFibonacciLesson.input.parse({ value }));
  }
});

test("call counts and trace expose repeated subproblems", () => {
  assert.deepEqual([0, 1, 2, 3, 4, 5, 6].map(countRecursiveFibonacciCalls), [1, 1, 3, 5, 9, 15, 25]);
  const trace = buildRecursiveFibonacciTrace(6);
  assert.equal(trace.at(-1).result, 8);
  assert.equal(trace.at(-1).calls, 25);
  assert.ok(trace.at(-1).repeatedCalls > 0);
  assert.ok(trace.some((step) => step.view.states.some(({ kind }) => kind === "repeated")));
  assert.ok(trace.some(({ phase }) => phase === "base-case"));
  assert.ok(trace.some(({ phase }) => phase === "combine"));
});

test("recursive Fibonacci lesson is deterministic with fresh branching snapshots", () => {
  const trace = buildValidatedTrace(recursiveFibonacciLesson, recursiveFibonacciLesson.input.defaultValue);
  for (const property of ["nodes", "edges", "rootIds", "activeNodeIds", "changedNodeIds", "states", "annotations", "pointers"]) {
    assert.equal(new Set(trace.map((step) => step.view[property])).size, trace.length, property);
  }
});
