import {
  traverseMatrix,
  validateMatrixInput
} from "../../matrices/traverse-matrix.mjs";
import { formatNumber } from "./input.mjs";

export { traverseMatrix };

export function buildTraverseMatrixTrace(matrix) {
  validateMatrixInput(matrix);

  const trace = [];
  const visitedCells = [];
  const collectedValues = [];
  const rowCount = matrix.length;
  const columnCount = matrix[0].length;
  const totalCells = rowCount * columnCount;

  trace.push(createStep({
    trace,
    phase: "initialize",
    codeSteps: ["initialize"],
    matrix,
    visitedCells,
    collectedValues,
    currentCell: null,
    narration: `Start with a ${rowCount} by ${columnCount} grid. The outer loop chooses a row; the inner loop moves across its columns.`,
    prompt: "Prediction: which coordinate will row-major traversal visit first?"
  }));

  for (let row = 0; row < rowCount; row += 1) {
    for (let column = 0; column < columnCount; column += 1) {
      const currentCell = { row, column };
      const currentValue = matrix[row][column];
      visitedCells.push(currentCell);
      collectedValues.push(currentValue);
      trace.push(createStep({
        trace,
        phase: "visit",
        codeSteps: ["iterate-row", "iterate-column", "record-value"],
        matrix,
        visitedCells,
        collectedValues,
        currentCell,
        narration: `Visit row ${row}, column ${column} and record ${formatNumber(currentValue)} as traversal value ${collectedValues.length}.`,
        prompt: column + 1 < columnCount
          ? "Which column comes next in this row?"
          : row + 1 < rowCount
            ? "This row is complete. Where does the outer loop move next?"
            : "Every coordinate has been visited. What should the algorithm return?"
      }));
    }
  }

  trace.push({
    ...createStep({
      trace,
      phase: "complete",
      codeSteps: ["return"],
      matrix,
      visitedCells,
      collectedValues,
      currentCell: null,
      complete: true,
      narration: `Traversal is complete after visiting all ${totalCells} ${totalCells === 1 ? "cell" : "cells"} in row-major order.`,
      prompt: "Can you explain why the inner loop finishes one complete row before the next row begins?"
    }),
    result: [...collectedValues]
  });

  return trace;
}

function createStep({
  trace,
  phase,
  codeSteps,
  matrix,
  visitedCells,
  collectedValues,
  currentCell,
  narration,
  prompt,
  complete = false
}) {
  const rowCount = matrix.length;
  const columnCount = matrix[0].length;
  const currentValue = currentCell === null
    ? null
    : matrix[currentCell.row][currentCell.column];

  return {
    step: trace.length,
    phase,
    codeSteps,
    currentRow: currentCell?.row ?? null,
    currentColumn: currentCell?.column ?? null,
    currentValue,
    rowCount,
    columnCount,
    visitedCount: visitedCells.length,
    totalCells: rowCount * columnCount,
    collectedValues: [...collectedValues],
    view: createGridView(matrix, visitedCells, currentCell, complete),
    narration,
    prompt
  };
}

function createGridView(matrix, visitedCells, currentCell, complete) {
  return {
    values: matrix.map((row) => [...row]),
    activeCells: complete || currentCell === null
      ? []
      : [{ row: currentCell.row, column: currentCell.column }],
    changedCells: [],
    markers: visitedCells.map((cell) => {
      const current = !complete
        && currentCell !== null
        && cell.row === currentCell.row
        && cell.column === currentCell.column;
      return {
        row: cell.row,
        column: cell.column,
        kind: current ? "current" : "visited",
        label: current ? "current cell" : "visited"
      };
    }),
    annotations: visitedCells.map((cell, index) => ({
      row: cell.row,
      column: cell.column,
      label: `visit ${index + 1}`
    }))
  };
}
