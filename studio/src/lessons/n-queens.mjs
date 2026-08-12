import {
  maximumNQueensSize,
  solveNQueens
} from "../../../backtracking/n-queens.mjs";
import { buildNQueensTrace } from "../n-queens.mjs";

export const nQueensLesson = {
  id: "backtracking/n-queens",
  order: 47,
  topic: "Backtracking",
  prerequisites: ["backtracking/permutations"],
  patterns: ["backtracking", "constraint-search", "pruning"],
  catalogLabel: "N-Queens",
  catalogDescription: "Prune attacked squares while choosing one queen per row.",
  title: "Place queens with constraint search",
  summary: "Choose one safe column per row, recurse, record complete boards, then undo. Column and diagonal sets reject unsafe branches in constant time.",
  views: [
    { id: "board", renderer: "array", heading: "Board (row-major: 1 = queen)" },
    { id: "choices", renderer: "branching", heading: "Current choice path" }
  ],
  input: {
    fields: [{ id: "size", label: `Enter board size 1-${maximumNQueensSize}`, type: "number", inputMode: "numeric", min: "1", max: String(maximumNQueensSize), step: "1" }],
    help: "A solution lists the selected column for each row. Sizes 2 and 3 have no solutions; the interactive board is capped at 5 to keep every search step responsive and inspectable.",
    defaultValue: { size: 4 },
    sampleValue: { size: 5 },
    parse: ({ size }) => {
      const parsed = Number(size);
      if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > maximumNQueensSize) throw new Error(`Use a board size from 1 to ${maximumNQueensSize}.`);
      return { size: parsed };
    },
    serialize: ({ size }) => ({ size: String(size) })
  },
  solve: ({ size }) => solveNQueens(size),
  buildTrace: ({ size }) => buildNQueensTrace(size),
  code: {
    title: "Choose, prune, recurse, and undo",
    filename: "n-queens.mjs",
    sourcePath: "backtracking/n-queens.mjs",
    lines: [
      { number: 17, text: "  const search = (row) => {", steps: ["initialize"] },
      { number: 18, text: "    if (row === size) { solutions.push([...placement]); return; }", steps: ["record"] },
      { number: 22, text: "    for (let column = 0; column < size; column += 1) {", steps: ["try-column"] },
      { number: 25, text: "      if (columns.has(column) || falling.has(row - column)", steps: ["check-safe"] },
      { number: 26, text: "        || rising.has(row + column)) continue;", steps: ["skip-unsafe"] },
      { number: 27, text: "      placement.push(column);", steps: ["choose"] },
      { number: 31, text: "      search(row + 1);", steps: ["recurse"] },
      { number: 32, text: "      placement.pop();", steps: ["undo"] },
      { number: 38, text: "  return solutions;", steps: ["return"] }
    ]
  },
  stats: [
    { label: "Row", value: (step) => step.currentRow === null ? "-" : String(step.currentRow) },
    { label: "Attempts", value: (step) => String(step.attempts), detail: () => "candidate squares" },
    { label: "Pruned", value: (step) => String(step.pruned), detail: () => "constraint conflicts" },
    { label: "Solutions", accent: true, value: (step) => String(step.solutionCount), detail: () => "complete boards" }
  ],
  complexity: {
    chip: "CONSTRAINT SEARCH",
    time: "O(n!)",
    space: "O(n)",
    spaceLabel: "search state",
    explanation: "At most n choices remain at the first row, n - 1 at the next, and so on; pruning removes many branches. Placement and constraint sets grow only with recursion depth."
  },
  guide: { heading: "A conflict prunes an entire subtree." },
  legend: [
    { kind: "current", label: "candidate square" },
    { kind: "chosen", label: "queen on search path" },
    { kind: "changed", label: "placed or removed" },
    { kind: "attacked", label: "constraint conflict" }
  ],
  reflection: {
    eyebrow: "BEFORE YOU MOVE ON",
    title: "Why is one queen per row enough?",
    body: "Explain which constraint is enforced structurally by advancing one row per recursive call, and which three attack sets make every remaining safety check constant-time."
  }
};
