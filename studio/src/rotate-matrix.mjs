import {
  rotateMatrix,
  validateSquareMatrix
} from "../../matrices/rotate-matrix.mjs";
import { formatNumber } from "./input.mjs";

export { rotateMatrix };

export function buildRotateMatrixTrace(matrix) {
  validateSquareMatrix(matrix);
  const working = matrix.map((row) => [...row]);
  const trace = [];
  let swaps = 0;

  trace.push(createStep({
    trace,
    phase: "initialize",
    codeSteps: ["copy"],
    working,
    swaps,
    narration: "Copy the square matrix so the learner's input stays unchanged.",
    prompt: "Which values sit across the main diagonal from one another?"
  }));

  for (let row = 0; row < working.length; row += 1) {
    for (let column = row + 1; column < working.length; column += 1) {
      const mirror = { row: column, column: row };
      const before = [working[row][column], working[mirror.row][mirror.column]];
      [working[row][column], working[mirror.row][mirror.column]] = [
        working[mirror.row][mirror.column],
        working[row][column]
      ];
      swaps += 1;
      trace.push(createStep({
        trace,
        phase: "transpose",
        codeSteps: ["transpose-loop", "transpose-swap"],
        working,
        swaps,
        activeCells: [{ row, column }, mirror],
        changedCells: [{ row, column }, mirror],
        markers: [
          { row, column, kind: "transpose", label: "across diagonal" },
          { ...mirror, kind: "transpose", label: "across diagonal" }
        ],
        annotations: [
          { row, column, label: `was ${formatNumber(before[1])}` },
          { ...mirror, label: `was ${formatNumber(before[0])}` }
        ],
        narration: `Swap row ${row}, column ${column} with row ${mirror.row}, column ${mirror.column} to transpose across the diagonal.`,
        prompt: "After the full transpose, which direction does each original column run?"
      }));
    }
  }

  for (let row = 0; row < working.length; row += 1) {
    for (let left = 0, right = working.length - 1; left < right; left += 1, right -= 1) {
      const before = [working[row][left], working[row][right]];
      [working[row][left], working[row][right]] = [working[row][right], working[row][left]];
      swaps += 1;
      trace.push(createStep({
        trace,
        phase: "reverse-row",
        codeSteps: ["row-loop", "reverse-row"],
        working,
        swaps,
        activeCells: [{ row, column: left }, { row, column: right }],
        changedCells: [{ row, column: left }, { row, column: right }],
        markers: [
          { row, column: left, kind: "left", label: "left" },
          { row, column: right, kind: "right", label: "right" }
        ],
        annotations: [
          { row, column: left, label: `was ${formatNumber(before[0])}` },
          { row, column: right, label: `was ${formatNumber(before[1])}` }
        ],
        narration: `Reverse row ${row} by swapping columns ${left} and ${right}.`,
        prompt: "How does reversing each transposed row turn the matrix clockwise?"
      }));
    }
  }

  trace.push({
    ...createStep({
      trace,
      phase: "complete",
      codeSteps: ["return"],
      working,
      swaps,
      markers: working.flatMap((rowValues, row) => rowValues.map((_, column) => ({
        row,
        column,
        kind: "result",
        label: "rotated"
      }))),
      narration: "Transposing and then reversing every row produces a 90-degree clockwise rotation.",
      prompt: "Where did the original top-left value move?"
    }),
    result: working.map((row) => [...row])
  });

  return trace;
}

function createStep({
  trace,
  phase,
  codeSteps,
  working,
  swaps,
  narration,
  prompt,
  activeCells = [],
  changedCells = [],
  markers = [],
  annotations = []
}) {
  return {
    step: trace.length,
    phase,
    codeSteps,
    swaps,
    view: {
      values: working.map((row) => [...row]),
      activeCells: activeCells.map((cell) => ({ ...cell })),
      changedCells: changedCells.map((cell) => ({ ...cell })),
      markers: markers.map((marker) => ({ ...marker })),
      annotations: annotations.map((annotation) => ({ ...annotation }))
    },
    narration,
    prompt
  };
}
