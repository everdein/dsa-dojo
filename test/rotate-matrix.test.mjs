import test from "node:test";
import assert from "node:assert/strict";
import {
  maximumRotateMatrixSize,
  rotateMatrix,
  validateSquareMatrix
} from "../matrices/rotate-matrix.mjs";
import { buildValidatedTrace } from "../studio/src/lesson-contract.mjs";
import {
  parseSquareMatrix,
  rotateMatrixLesson,
  serializeSquareMatrix
} from "../studio/src/lessons/rotate-matrix.mjs";
import { buildRotateMatrixTrace } from "../studio/src/rotate-matrix.mjs";

test("rotate-matrix returns clockwise rotations without mutating input", () => {
  const cases = [
    [[[1]], [[1]]],
    [[[1, 2], [3, 4]], [[3, 1], [4, 2]]],
    [[[1, 2, 3], [4, 5, 6], [7, 8, 9]], [[7, 4, 1], [8, 5, 2], [9, 6, 3]]]
  ];
  for (const [matrix, expected] of cases) {
    const original = structuredClone(matrix);
    assert.deepEqual(rotateMatrix(matrix), expected);
    assert.deepEqual(matrix, original);
  }
});

test("rotate-matrix rejects empty, jagged, sparse, nonsquare, nonfinite, and oversized matrices", () => {
  const sparseRow = Array(2);
  sparseRow[0] = 1;
  const sparseMatrix = Array(2);
  sparseMatrix[0] = [1, 2];
  for (const matrix of [
    undefined,
    [],
    [[1, 2]],
    [[1, 2], [3]],
    [[1, 2], sparseRow],
    sparseMatrix,
    [[1, Number.NaN], [3, 4]],
    [[1, Infinity], [3, 4]],
    Array.from({ length: maximumRotateMatrixSize + 1 }, () => Array(maximumRotateMatrixSize + 1).fill(0))
  ]) {
    assert.throws(() => validateSquareMatrix(matrix));
  }
});

test("rotate-matrix lesson parses and serializes its square row format", () => {
  assert.deepEqual(parseSquareMatrix("1, -2; 3.5, 4"), [[1, -2], [3.5, 4]]);
  assert.equal(serializeSquareMatrix([[1, -0], [3.5, 4]]), "1, -0; 3.5, 4");
  assert.throws(() => parseSquareMatrix(""), /at least one/);
  assert.throws(() => parseSquareMatrix("1,; 2, 3"), /between each comma/);
  assert.throws(() => parseSquareMatrix("1, 2;"), /between each semicolon/);
  assert.throws(() => parseSquareMatrix("1, 2; 3, nope"), /not finite/);
});

test("rotate-matrix trace exposes transpose and row-reversal swaps", () => {
  const trace = buildRotateMatrixTrace([[1, 2], [3, 4]]);
  assert.deepEqual(trace.map(({ phase }) => phase), ["initialize", "transpose", "reverse-row", "reverse-row", "complete"]);
  assert.deepEqual(trace.at(-1).result, [[3, 1], [4, 2]]);
  assert.deepEqual(trace[1].view.changedCells, [{ row: 0, column: 1 }, { row: 1, column: 0 }]);
  assert.deepEqual(trace[2].view.activeCells, [{ row: 0, column: 0 }, { row: 0, column: 1 }]);
});

test("rotate-matrix lesson satisfies deterministic grid trace ownership", () => {
  const trace = buildValidatedTrace(rotateMatrixLesson, rotateMatrixLesson.input.defaultValue);
  assert.deepEqual(trace.at(-1).result, rotateMatrix(rotateMatrixLesson.input.defaultValue.matrix));
  for (const property of ["values", "activeCells", "changedCells", "markers", "annotations"]) {
    assert.equal(new Set(trace.map((step) => step.view[property])).size, trace.length, property);
  }
  const rows = trace.flatMap((step) => step.view.values);
  assert.equal(new Set(rows).size, rows.length);
});
