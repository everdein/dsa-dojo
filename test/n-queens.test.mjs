import test from "node:test";
import assert from "node:assert/strict";
import {
  isValidQueenPlacement,
  maximumNQueensSize,
  solveNQueens,
  validateNQueensSize
} from "../backtracking/n-queens.mjs";
import { buildValidatedTrace } from "../studio/src/lesson-contract.mjs";
import { nQueensLesson } from "../studio/src/lessons/n-queens.mjs";
import { buildNQueensTrace } from "../studio/src/n-queens.mjs";

test("N-Queens returns canonical solution counts and valid boards", () => {
  const counts = [1, 0, 0, 2, 10];
  for (let size = 1; size <= maximumNQueensSize; size += 1) {
    const solutions = solveNQueens(size);
    assert.equal(solutions.length, counts[size - 1]);
    assert.ok(solutions.every(isValidQueenPlacement));
    assert.equal(new Set(solutions.map((solution) => solution.join(","))).size, solutions.length);
  }
  assert.deepEqual(solveNQueens(4), [[1, 3, 0, 2], [2, 0, 3, 1]]);
});

test("N-Queens validates board bounds and placement shape", () => {
  for (const value of [0, -1, 1.5, Infinity, NaN, maximumNQueensSize + 1, "4"]) assert.throws(() => validateNQueensSize(value));
  for (const placement of [null, [0, 0], [0, 2], [0, 1, 2], [1, -1]]) assert.equal(isValidQueenPlacement(placement), false);
  assert.equal(maximumNQueensSize, 5);
  assert.match(nQueensLesson.input.help, /capped at 5.*responsive/i);
});

test("N-Queens trace exposes choose, prune, record, and undo", () => {
  const trace = buildNQueensTrace(4);
  for (const phase of ["inspect", "choose", "prune", "record-solution", "undo", "complete"]) {
    assert.ok(trace.some((step) => step.phase === phase), phase);
  }
  assert.deepEqual(trace.at(-1).result, solveNQueens(4));
  assert.equal(trace.at(-1).solutionCount, 2);
  assert.equal(trace.at(-1).placement.length, 0);
});

test("N-Queens lesson satisfies the deterministic composite renderer contract", () => {
  for (const input of [nQueensLesson.input.defaultValue, nQueensLesson.input.sampleValue, { size: 1 }, { size: 2 }]) {
    const trace = buildValidatedTrace(nQueensLesson, input);
    assert.deepEqual(trace.at(-1).result, solveNQueens(input.size));
    for (const panel of ["board", "choices"]) {
      assert.equal(new Set(trace.map((step) => step.views[panel])).size, trace.length, `${input.size}:${panel}`);
    }
  }
});
