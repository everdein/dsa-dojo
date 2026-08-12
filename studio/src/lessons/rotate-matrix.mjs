import {
  maximumRotateMatrixSize,
  rotateMatrix,
  validateSquareMatrix
} from "../../../matrices/rotate-matrix.mjs";
import { buildRotateMatrixTrace } from "../rotate-matrix.mjs";

export const rotateMatrixLesson = {
  id: "matrices/rotate-matrix",
  order: 13,
  topic: "Matrices",
  prerequisites: ["matrices/traverse-matrix", "arrays/reverse-array"],
  patterns: ["matrix-transformation", "transpose", "two-pointers"],
  catalogLabel: "Rotate Matrix",
  catalogDescription: "Transpose a square grid, then reverse each row.",
  title: "Rotate a matrix clockwise",
  summary: "Turn rows into columns across the main diagonal, then reverse every row to complete a 90-degree clockwise rotation.",
  renderer: "grid",
  input: {
    heading: "Your square matrix",
    fields: [{
      id: "matrix",
      label: "Enter square rows separated by semicolons",
      type: "text",
      inputMode: "decimal",
      placeholder: "1, 2, 3; 4, 5, 6; 7, 8, 9"
    }],
    help: `Use commas between finite numbers and semicolons between 1-${maximumRotateMatrixSize} equal-length rows.`,
    defaultValue: { matrix: [[1, 2, 3], [4, 5, 6], [7, 8, 9]] },
    sampleValue: { matrix: [[1, 2], [3, 4]] },
    parse: ({ matrix }) => ({ matrix: parseSquareMatrix(matrix) }),
    serialize: ({ matrix }) => ({ matrix: serializeSquareMatrix(matrix) })
  },
  solve: ({ matrix }) => rotateMatrix(matrix),
  buildTrace: ({ matrix }) => buildRotateMatrixTrace(matrix),
  code: {
    title: "Transpose, then reverse rows",
    filename: "rotate-matrix.mjs",
    sourcePath: "matrices/rotate-matrix.mjs",
    lines: [
      { number: 26, text: "export function rotateMatrix(matrix) {", steps: ["function"] },
      { number: 27, text: "  validateSquareMatrix(matrix);", steps: ["copy"] },
      { number: 28, text: "  const rotated = matrix.map((row) => [...row]);", steps: ["copy"] },
      { number: 29, text: "", steps: ["copy"] },
      { number: 30, text: "  for (let row = 0; row < rotated.length; row += 1) {", steps: ["transpose-loop"] },
      { number: 31, text: "    for (let column = row + 1; column < rotated.length; column += 1) {", steps: ["transpose-loop"] },
      { number: 32, text: "      [rotated[row][column], rotated[column][row]] = [", steps: ["transpose-swap"] },
      { number: 33, text: "        rotated[column][row],", steps: ["transpose-swap"] },
      { number: 34, text: "        rotated[row][column]", steps: ["transpose-swap"] },
      { number: 35, text: "      ];", steps: ["transpose-swap"] },
      { number: 36, text: "    }", steps: ["transpose-loop"] },
      { number: 37, text: "  }", steps: ["transpose-loop"] },
      { number: 38, text: "", steps: ["row-loop"] },
      { number: 39, text: "  for (const row of rotated) row.reverse();", steps: ["row-loop", "reverse-row"] },
      { number: 40, text: "  return rotated;", steps: ["return"] },
      { number: 41, text: "}", steps: ["function"] }
    ]
  },
  stats: [
    {
      label: "Phase",
      value: (step) => phaseLabel(step.phase),
      detail: () => "two transformations"
    },
    {
      label: "Grid size",
      value: (step) => `${step.view.values.length} × ${step.view.values.length}`,
      detail: () => "square matrix"
    },
    {
      label: "Swaps",
      accent: true,
      value: (step) => String(step.swaps),
      detail: () => "diagonal + row swaps"
    }
  ],
  complexity: {
    chip: "TRANSPOSE + REVERSE",
    time: "O(n²)",
    space: "O(n²)",
    spaceLabel: "total space",
    explanation: "Every cell participates in a constant amount of work. The public function copies the n-by-n input so it remains immutable; the transformation itself needs only constant auxiliary state."
  },
  guide: {
    heading: "Change the axes in two moves."
  },
  legend: [
    { kind: "active", label: "current pair" },
    { kind: "transpose", label: "diagonal swap" },
    { kind: "left", label: "row left" },
    { kind: "right", label: "row right" },
    { kind: "result", label: "rotated result" }
  ],
  reflection: {
    eyebrow: "BEFORE YOU MOVE ON",
    title: "Why do these two transformations equal a clockwise turn?",
    body: "Track one corner and one edge value through the transpose and row reversal. Then predict which order would produce a counterclockwise rotation."
  }
};

export function parseSquareMatrix(value) {
  const source = String(value ?? "").trim();
  if (source === "") throw new Error("Enter at least one matrix row.");
  const rawRows = source.split(";");
  if (rawRows.some((row) => row.trim() === "")) {
    throw new Error("Enter numbers between each semicolon.");
  }
  const matrix = rawRows.map((row) => {
    const parts = row.split(",");
    if (parts.some((part) => part.trim() === "")) {
      throw new Error("Enter a number between each comma.");
    }
    return parts.map((part) => {
      const number = Number(part.trim());
      if (!Number.isFinite(number)) throw new Error(`Matrix value is not finite: ${part.trim() || "empty"}.`);
      return number;
    });
  });
  validateSquareMatrix(matrix);
  return matrix;
}

export function serializeSquareMatrix(matrix) {
  validateSquareMatrix(matrix);
  return matrix.map((row) => row.map((value) => Object.is(value, -0) ? "-0" : String(value)).join(", ")).join("; ");
}

function phaseLabel(phase) {
  if (phase === "initialize") return "copy";
  if (phase === "transpose") return "transpose";
  if (phase === "reverse-row") return "reverse rows";
  return "complete";
}
