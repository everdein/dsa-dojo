import test from "node:test";
import assert from "node:assert/strict";
import {
  maximumMatrixColumns,
  maximumMatrixRows,
  traverseMatrix,
  validateMatrixInput
} from "../matrices/traverse-matrix.mjs";
import {
  assertLesson,
  assertTrace,
  buildValidatedTrace
} from "../studio/src/lesson-contract.mjs";
import {
  parseMatrixText,
  serializeMatrix,
  traverseMatrixLesson
} from "../studio/src/lessons/traverse-matrix.mjs";
import { buildTraverseMatrixTrace } from "../studio/src/traverse-matrix.mjs";

test("matrix traversal returns row-major values without mutating its input", () => {
  for (const [matrix, expected] of [
    [[[1, 2, 3], [4, 5, 6]], [1, 2, 3, 4, 5, 6]],
    [[[7]], [7]],
    [[[-2, 0, -2]], [-2, 0, -2]],
    [[[1], [2], [3]], [1, 2, 3]]
  ]) {
    const before = structuredClone(matrix);
    assert.deepEqual(traverseMatrix(matrix), expected);
    assert.deepEqual(matrix, before);
  }
});

test("matrix traversal rejects malformed, sparse, nonfinite, jagged, and oversized grids", () => {
  const sparseRows = Array(2);
  sparseRows[0] = [1, 2];
  const sparseCells = [Array(2)];
  sparseCells[0][0] = 1;

  for (const matrix of [
    undefined,
    null,
    [],
    [[]],
    [[1, 2], [3]],
    [[1, Number.NaN]],
    [[1, Infinity]],
    sparseRows,
    sparseCells
  ]) {
    assert.throws(() => validateMatrixInput(matrix));
    assert.throws(() => traverseMatrix(matrix));
  }
  assert.throws(
    () => validateMatrixInput(Array.from({ length: maximumMatrixRows + 1 }, () => [1])),
    /8 rows or fewer/
  );
  assert.throws(
    () => validateMatrixInput([Array.from({ length: maximumMatrixColumns + 1 }, () => 1)]),
    /8 columns or fewer/
  );
});

test("matrix text parser uses semicolon rows and comma-separated finite values", () => {
  assert.deepEqual(parseMatrixText(" 1, 2, -0 ; 3.5, 4, 5 "), [
    [1, 2, -0],
    [3.5, 4, 5]
  ]);
  assert.equal(serializeMatrix([[1, -0], [3.5, 4]]), "1, -0; 3.5, 4");
  assert.deepEqual(
    parseMatrixText(serializeMatrix([[1, -0], [3.5, 4]])),
    [[1, -0], [3.5, 4]]
  );

  for (const raw of [
    "",
    "1, 2;",
    ";1, 2",
    "1,,2",
    "1, nope",
    "1, Infinity",
    "1, 2; 3"
  ]) {
    assert.throws(() => parseMatrixText(raw));
  }
});

test("matrix traversal lesson satisfies metadata, input, and renderer contracts", () => {
  assert.equal(assertLesson(traverseMatrixLesson), traverseMatrixLesson);
  assert.equal(traverseMatrixLesson.id, "matrices/traverse-matrix");
  assert.equal(traverseMatrixLesson.order, 12);
  assert.equal(traverseMatrixLesson.renderer, "grid");
  assert.deepEqual(traverseMatrixLesson.prerequisites, ["arrays/find-largest"]);
  assert.deepEqual(traverseMatrixLesson.patterns, ["matrix-traversal", "linear-scan"]);
  assert.deepEqual(
    traverseMatrixLesson.input.parse({ matrix: "1, 2; 3, 4" }),
    { matrix: [[1, 2], [3, 4]] }
  );
  assert.deepEqual(
    traverseMatrixLesson.input.serialize({ matrix: [[1, 2], [3, 4]] }),
    { matrix: "1, 2; 3, 4" }
  );
});

test("matrix traversal trace records every row-major visit and completion", () => {
  const trace = buildTraverseMatrixTrace([[1, 2, 3], [4, 5, 6]]);
  const visits = trace.filter((step) => step.phase === "visit");

  assert.equal(trace.length, 8);
  assert.deepEqual(trace.map((step) => step.phase), [
    "initialize",
    "visit",
    "visit",
    "visit",
    "visit",
    "visit",
    "visit",
    "complete"
  ]);
  assert.deepEqual(visits.map((step) => [step.currentRow, step.currentColumn]), [
    [0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2]
  ]);
  assert.deepEqual(visits.map((step) => step.currentValue), [1, 2, 3, 4, 5, 6]);
  visits.forEach((step, index) => {
    assert.deepEqual(step.view.activeCells, [{ row: step.currentRow, column: step.currentColumn }]);
    assert.deepEqual(step.collectedValues, [1, 2, 3, 4, 5, 6].slice(0, index + 1));
    assert.equal(step.view.markers.length, index + 1);
    assert.equal(step.view.annotations.length, index + 1);
    assert.deepEqual(step.view.markers.at(-1), {
      row: step.currentRow,
      column: step.currentColumn,
      kind: "current",
      label: "current cell"
    });
    assert.equal(step.view.annotations.at(-1).label, `visit ${index + 1}`);
  });
  assert.deepEqual(trace.at(-1).result, [1, 2, 3, 4, 5, 6]);
  assert.deepEqual(trace.at(-1).view.activeCells, []);
  assert.ok(trace.at(-1).view.markers.every((marker) => marker.kind === "visited"));
});

test("matrix trace is deterministic, solver-aligned, immutable, and owns deep grid snapshots", () => {
  const input = { matrix: [[-2, 0], [7, 4]] };
  const before = structuredClone(input);
  const trace = buildValidatedTrace(traverseMatrixLesson, input);

  assert.equal(assertTrace(trace, traverseMatrixLesson), trace);
  assert.deepEqual(input, before);
  assert.deepEqual(trace.at(-1).result, traverseMatrix(input.matrix));
  assert.deepEqual(
    trace,
    buildTraverseMatrixTrace(structuredClone(input.matrix))
  );

  for (const property of ["values", "activeCells", "changedCells", "markers", "annotations"]) {
    assert.equal(
      new Set(trace.map((step) => step.view[property])).size,
      trace.length,
      property
    );
  }
  const rows = trace.flatMap((step) => step.view.values);
  assert.equal(new Set(rows).size, rows.length);
  for (const property of ["activeCells", "markers", "annotations"]) {
    const objects = trace.flatMap((step) => step.view[property]);
    assert.equal(new Set(objects).size, objects.length, property);
  }
});

test("matrix trace handles singleton, one-row, and one-column boundaries", () => {
  for (const matrix of [
    [[9]],
    [[1, 2, 3]],
    [[1], [2], [3]]
  ]) {
    const trace = buildTraverseMatrixTrace(matrix);
    assert.equal(trace.filter((step) => step.phase === "visit").length, matrix.length * matrix[0].length);
    assert.deepEqual(trace.at(-1).result, traverseMatrix(matrix));
  }
});
