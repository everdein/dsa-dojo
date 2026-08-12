import {
  solveNQueens,
  validateNQueensSize
} from "../../backtracking/n-queens.mjs";

export { solveNQueens };

export function buildNQueensTrace(size) {
  validateNQueensSize(size);
  const trace = [];
  const placement = [];
  const columns = new Set();
  const falling = new Set();
  const rising = new Set();
  const solutions = [];
  let attempts = 0;
  let placements = 0;
  let pruned = 0;
  let backtracks = 0;

  const addStep = ({ phase, codeSteps, row, column, changed = [], narration, prompt, result }) => {
    const candidate = Number.isInteger(row) && Number.isInteger(column) ? row * size + column : null;
    const queenIndices = placement.map((placedColumn, placedRow) => placedRow * size + placedColumn);
    const cells = Array.from({ length: size * size }, (_, index) => {
      const cellRow = Math.floor(index / size);
      const cellColumn = index % size;
      return queenIndices.includes(index) ? 1 : 0;
    });
    const unsafe = [];
    for (let cellRow = 0; cellRow < size; cellRow += 1) {
      for (let cellColumn = 0; cellColumn < size; cellColumn += 1) {
        if (columns.has(cellColumn) || falling.has(cellRow - cellColumn) || rising.has(cellRow + cellColumn)) {
          unsafe.push(cellRow * size + cellColumn);
        }
      }
    }
    const step = {
      step: trace.length,
      phase,
      codeSteps,
      currentRow: row,
      currentColumn: column,
      attempts,
      placements,
      pruned,
      backtracks,
      solutionCount: solutions.length,
      placement: [...placement],
      views: {
        board: {
          values: cells,
          activeIndices: candidate === null ? [] : [candidate],
          ranges: [],
          markers: candidate === null ? [] : [{ index: candidate, kind: "current", label: "candidate square" }],
          annotations: [
            ...queenIndices.map((index) => ({ index, label: "queen" })),
            ...unsafe.filter((index) => !queenIndices.includes(index)).map((index) => ({ index, label: "attacked" }))
          ],
          changedIndices: [...changed]
        },
        choices: createChoiceTree(size, placement, row, column, phase)
      },
      narration,
      prompt
    };
    if (result !== undefined) step.result = result;
    trace.push(step);
  };

  addStep({
    phase: "initialize",
    codeSteps: ["initialize"],
    row: 0,
    column: null,
    narration: `Start with an empty ${size} by ${size} board and three empty attack sets.`,
    prompt: "Which columns are safe for the first row?"
  });

  const search = (row) => {
    if (row === size) {
      solutions.push([...placement]);
      addStep({
        phase: "record-solution",
        codeSteps: ["record"],
        row: row - 1,
        column: placement.at(-1),
        narration: `Every row has a queen. Record solution ${solutions.length}: [${placement.join(", ")}].`,
        prompt: "Why must search undo the final choice even after recording a solution?"
      });
      return;
    }
    for (let column = 0; column < size; column += 1) {
      attempts += 1;
      const index = row * size + column;
      const conflict = columns.has(column) || falling.has(row - column) || rising.has(row + column);
      addStep({
        phase: "inspect",
        codeSteps: ["try-column", "check-safe"],
        row,
        column,
        narration: conflict
          ? `Square (${row}, ${column}) is attacked by an existing queen.`
          : `Square (${row}, ${column}) is safe across its column and both diagonals.`,
        prompt: conflict ? "Which constraint lets this branch be pruned?" : "What state must be recorded before recursing?"
      });
      if (conflict) {
        pruned += 1;
        addStep({
          phase: "prune",
          codeSteps: ["skip-unsafe"],
          row,
          column,
          changed: [index],
          narration: `Prune (${row}, ${column}); no completion below an unsafe placement can be valid.`,
          prompt: "Which candidate in this row should be tested next?"
        });
        continue;
      }
      placement.push(column);
      columns.add(column);
      falling.add(row - column);
      rising.add(row + column);
      placements += 1;
      addStep({
        phase: "choose",
        codeSteps: ["choose", "recurse"],
        row,
        column,
        changed: [index],
        narration: `Place a queen at (${row}, ${column}) and recurse to row ${row + 1}.`,
        prompt: row + 1 === size ? "Does this placement complete a solution?" : "Which squares remain safe in the next row?"
      });
      search(row + 1);
      placement.pop();
      columns.delete(column);
      falling.delete(row - column);
      rising.delete(row + column);
      backtracks += 1;
      addStep({
        phase: "undo",
        codeSteps: ["undo"],
        row,
        column,
        changed: [index],
        narration: `Remove the queen from (${row}, ${column}) and restore all three constraint sets.`,
        prompt: "Which unexplored column can this row try next?"
      });
    }
  };

  search(0);
  addStep({
    phase: "complete",
    codeSteps: ["return"],
    row: null,
    column: null,
    narration: `Search exhausted every safe branch and found ${solutions.length} ${solutions.length === 1 ? "solution" : "solutions"}.`,
    prompt: "How did the constraint sets avoid scanning every earlier queen?",
    result: solutions.map((solution) => [...solution])
  });
  return trace;
}

function createChoiceTree(size, placement, currentRow, currentColumn, phase) {
  const nodes = [{ id: "root", value: "start" }];
  const edges = [];
  let parentId = "root";
  for (let row = 0; row < placement.length; row += 1) {
    const id = `choice-${row}-${placement[row]}`;
    nodes.push({ id, value: `r${row}:c${placement[row]}` });
    edges.push({ id: `edge-${row}`, fromId: parentId, toId: id, label: "choose" });
    parentId = id;
  }
  const candidateIsPlaced = Number.isInteger(currentRow)
    && Number.isInteger(currentColumn)
    && placement[currentRow] === currentColumn;
  const activeId = candidateIsPlaced ? `choice-${currentRow}-${currentColumn}` : parentId;
  return {
    nodes,
    edges,
    rootIds: ["root"],
    activeNodeIds: nodes.some(({ id }) => id === activeId) ? [activeId] : ["root"],
    changedNodeIds: phase === "choose" && candidateIsPlaced ? [activeId] : [],
    states: nodes.filter(({ id }) => id !== "root").map(({ id }) => ({ nodeId: id, kind: "chosen", label: "queen placement" })),
    annotations: Number.isInteger(currentRow) && Number.isInteger(currentColumn)
      ? [{ nodeId: activeId, label: `consider r${currentRow} c${currentColumn}` }]
      : [],
    pointers: [{ nodeId: activeId, kind: "current", label: "search path" }]
  };
}
