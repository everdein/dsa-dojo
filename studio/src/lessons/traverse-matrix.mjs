import {
  maximumMatrixColumns,
  maximumMatrixRows,
  traverseMatrix,
  validateMatrixInput
} from "../../../matrices/traverse-matrix.mjs";
import { formatNumber } from "../input.mjs";
import { buildTraverseMatrixTrace } from "../traverse-matrix.mjs";

export const traverseMatrixLesson = {
  id: "matrices/traverse-matrix",
  order: 12,
  topic: "Matrices",
  prerequisites: ["arrays/find-largest"],
  patterns: ["matrix-traversal", "linear-scan"],
  catalogLabel: "Matrix Traversal",
  catalogDescription: "Connect nested loops to row and column coordinates.",
  title: "Traverse a matrix row by row",
  summary: "Let the outer loop choose each row and the inner loop visit every column before moving down. Watch a two-dimensional grid become one row-major sequence.",
  renderer: "grid",
  input: {
    fields: [{
      id: "matrix",
      label: `Enter 1-${maximumMatrixRows} rows with 1-${maximumMatrixColumns} numbers per row`,
      type: "text",
      inputMode: "text",
      placeholder: "1, 2, 3; 4, 5, 6"
    }],
    help: "Separate rows with semicolons and values within each row with commas. Every row must have the same width.",
    defaultValue: { matrix: [[1, 2, 3], [4, 5, 6]] },
    sampleValue: { matrix: [[-2, 0], [7, 7], [4, 9]] },
    parse: (fields) => ({ matrix: parseMatrixText(fields.matrix) }),
    serialize: ({ matrix }) => ({ matrix: serializeMatrix(matrix) })
  },
  solve: ({ matrix }) => traverseMatrix(matrix),
  buildTrace: ({ matrix }) => buildTraverseMatrixTrace(matrix),
  code: {
    title: "Visit every row and column",
    filename: "traverse-matrix.mjs",
    sourcePath: "matrices/traverse-matrix.mjs",
    lines: [
      { number: 40, text: "export function traverseMatrix(matrix) {", steps: ["function"] },
      { number: 41, text: "  validateMatrixInput(matrix);", steps: ["initialize"] },
      { number: 3, text: "", steps: ["initialize"] },
      { number: 43, text: "  const values = [];", steps: ["initialize"] },
      { number: 13, text: "  for (let row = 0; row < matrix.length; row += 1) {", steps: ["iterate-row"] },
      { number: 45, text: "    for (let column = 0; column < matrix[row].length; column += 1) {", steps: ["iterate-column"] },
      { number: 46, text: "      values.push(matrix[row][column]);", steps: ["record-value"] },
      { number: 16, text: "    }", steps: ["iterate-column"] },
      { number: 7, text: "  }", steps: ["iterate-row"] },
      { number: 49, text: "  return values;", steps: ["return"] },
      { number: 38, text: "}", steps: ["function"] }
    ]
  },
  stats: [
    {
      label: "Current cell",
      value: (step) => step.currentRow === null
        ? "-"
        : `row ${step.currentRow}, col ${step.currentColumn}`,
      detail: (step) => step.currentValue === null
        ? "no active coordinate"
        : `value ${formatNumber(step.currentValue)}`
    },
    {
      label: "Cells visited",
      value: (step) => `${step.visitedCount} / ${step.totalCells}`,
      detail: () => "left to right, then top to bottom"
    },
    {
      label: "Traversal order",
      accent: true,
      value: (step) => formatValues(step.collectedValues),
      detail: (step) => `${step.rowCount} by ${step.columnCount} grid`
    }
  ],
  complexity: {
    chip: "NESTED LOOPS",
    time: "O(rows * columns)",
    space: "O(rows * columns)",
    spaceLabel: "output space",
    explanation: "Every cell is read once, so time follows the total number of cells. The returned flat sequence stores one value per cell; beyond that output, the algorithm uses only row and column counters."
  },
  guide: {
    heading: "Name both coordinates."
  },
  legend: [
    { kind: "current", label: "current cell" },
    { kind: "visited", label: "visited cell" }
  ],
  reflection: {
    eyebrow: "BEFORE YOU MOVE ON",
    title: "Which loop owns each movement?",
    body: "Try one row, one column, and a rectangular grid. Explain why the column resets to zero only after the inner loop finishes a row."
  }
};

export function parseMatrixText(raw) {
  const text = String(raw ?? "").trim();
  if (text === "") throw new Error("Enter at least one matrix row.");

  const rowTexts = text.split(";").map((row) => row.trim());
  if (rowTexts.some((row) => row === "")) {
    throw new Error("Separate nonempty matrix rows with semicolons.");
  }
  const matrix = rowTexts.map((row) => {
    const cells = row.split(",").map((cell) => cell.trim());
    if (cells.some((cell) => cell === "")) {
      throw new Error("Enter a number between each comma.");
    }
    const values = cells.map(Number);
    if (values.some((value) => !Number.isFinite(value))) {
      throw new Error("Use only finite numbers separated by commas and semicolons.");
    }
    return values;
  });

  validateMatrixInput(matrix);
  return matrix;
}

export function serializeMatrix(matrix) {
  validateMatrixInput(matrix);
  return matrix
    .map((row) => row.map(formatNumber).join(", "))
    .join("; ");
}

function formatValues(values) {
  return `[${values.map(formatNumber).join(", ")}]`;
}
