import {
  mergeIntervals,
  sortIntervalsByStart,
  validateIntervals
} from "../../patterns/intervals/merge-intervals.mjs";
import { maximumGridRows } from "./grid-renderer.mjs";

export { mergeIntervals };

export function buildMergeIntervalsTrace(intervals) {
  validateIntervals(intervals);
  const sorted = sortIntervalsByStart(intervals);
  const merged = [];
  const trace = [];
  let comparisons = 0;

  trace.push(createStep({
    trace,
    phase: "initialize",
    codeSteps: ["sort"],
    rows: sorted,
    sourceCount: sorted.length,
    processedCount: 0,
    outputCount: 0,
    comparisons,
    focusRows: [0],
    markers: [{ row: 0, column: 0, kind: "sorted", label: "sorted first" }],
    narration: "Sort a copy by start endpoint, breaking ties by end endpoint. The learner's original interval order stays unchanged.",
    prompt: "Why does start order let one current output interval absorb every possible overlap?"
  }));

  merged.push({ ...sorted[0] });
  trace.push(createStep({
    trace,
    phase: "seed",
    codeSteps: ["seed"],
    rows: composeWorkingRows(merged, sorted, 1),
    sourceCount: sorted.length,
    processedCount: 1,
    outputCount: 1,
    comparisons,
    currentInterval: merged[0],
    focusRows: [0],
    activeRows: [0],
    changedRows: [0],
    markers: [{ row: 0, column: 0, kind: "output", label: "first output" }],
    narration: `Seed the output with the earliest interval ${formatInterval(merged[0])}.`,
    prompt: "Which endpoint determines whether the next sorted interval can merge into this one?"
  }));

  for (let sortedIndex = 1; sortedIndex < sorted.length; sortedIndex += 1) {
    const candidate = sorted[sortedIndex];
    const current = merged.at(-1);
    const currentRow = merged.length - 1;
    const candidateRow = merged.length;
    comparisons += 1;

    trace.push(createStep({
      trace,
      phase: "compare",
      codeSteps: ["scan", "compare"],
      rows: composeWorkingRows(merged, sorted, sortedIndex),
      sourceCount: sorted.length,
      processedCount: sortedIndex,
      outputCount: merged.length,
      comparisons,
      currentInterval: current,
      candidateInterval: candidate,
      focusRows: [currentRow, candidateRow],
      activeRows: [currentRow, candidateRow],
      markers: [
        { row: currentRow, column: 0, kind: "current", label: "current output" },
        { row: candidateRow, column: 0, kind: "candidate", label: "next sorted" }
      ],
      annotations: [
        { row: currentRow, column: 1, label: `current end ${formatEndpoint(current.end)}` },
        { row: candidateRow, column: 0, label: `next start ${formatEndpoint(candidate.start)}` }
      ],
      narration: `Compare next start ${formatEndpoint(candidate.start)} with current end ${formatEndpoint(current.end)}.`,
      prompt: `Does ${formatEndpoint(candidate.start)} fall inside or touch the closed interval ending at ${formatEndpoint(current.end)}?`
    }));

    if (candidate.start <= current.end) {
      const previousEnd = current.end;
      if (candidate.end <= current.end) {
        trace.push(createStep({
          trace,
          phase: "contain",
          codeSteps: ["contain"],
          rows: composeWorkingRows(merged, sorted, sortedIndex + 1),
          sourceCount: sorted.length,
          processedCount: sortedIndex + 1,
          outputCount: merged.length,
          comparisons,
          currentInterval: current,
          candidateInterval: candidate,
          decision: "contained",
          focusRows: [currentRow],
          activeRows: [currentRow],
          markers: [{ row: currentRow, column: 0, kind: "contained", label: "already covered" }],
          annotations: [{ row: currentRow, column: 1, label: `contains ${formatInterval(candidate)}` }],
          narration: `${formatInterval(candidate)} is fully contained by ${formatInterval(current)}, so the output endpoint does not change.`,
          prompt: "Why would replacing the current end with the candidate end be wrong here?"
        }));
        continue;
      }

      current.end = candidate.end;
      trace.push(createStep({
        trace,
        phase: "merge",
        codeSteps: ["extend"],
        rows: composeWorkingRows(merged, sorted, sortedIndex + 1),
        sourceCount: sorted.length,
        processedCount: sortedIndex + 1,
        outputCount: merged.length,
        comparisons,
        currentInterval: current,
        candidateInterval: candidate,
        decision: "merged",
        focusRows: [currentRow],
        activeRows: [currentRow],
        changedCells: [{ row: currentRow, column: 1 }],
        markers: [{ row: currentRow, column: 0, kind: "merged", label: "overlap merged" }],
        annotations: [{
          row: currentRow,
          column: 1,
          label: `end ${formatEndpoint(previousEnd)} to ${formatEndpoint(current.end)}`
        }],
        narration: `${formatInterval(candidate)} overlaps or touches the current output, extending its end from ${formatEndpoint(previousEnd)} to ${formatEndpoint(current.end)}.`,
        prompt: "Which later starts can still merge with this extended end?"
      }));
      continue;
    }

    const previousEnd = current.end;
    merged.push({ ...candidate });
    const appendedRow = merged.length - 1;
    trace.push(createStep({
      trace,
      phase: "append",
      codeSteps: ["append"],
      rows: composeWorkingRows(merged, sorted, sortedIndex + 1),
      sourceCount: sorted.length,
      processedCount: sortedIndex + 1,
      outputCount: merged.length,
      comparisons,
      currentInterval: merged.at(-1),
      candidateInterval: candidate,
      decision: "disjoint",
      focusRows: [appendedRow],
      activeRows: [appendedRow],
      changedRows: [appendedRow],
      markers: [{ row: appendedRow, column: 0, kind: "output", label: "new output" }],
      annotations: [{ row: appendedRow, column: 0, label: `starts after ${formatEndpoint(previousEnd)}` }],
      narration: `${formatInterval(candidate)} starts after ${formatEndpoint(previousEnd)}, so it begins a new disjoint output interval.`,
      prompt: "Why can no later sorted interval merge backward across this gap?"
    }));
  }

  const result = cloneIntervals(merged);
  trace.push({
    ...createStep({
      trace,
      phase: "complete",
      codeSteps: ["return"],
      rows: result,
      sourceCount: sorted.length,
      processedCount: sorted.length,
      outputCount: result.length,
      comparisons,
      currentInterval: result.at(-1),
      decision: "complete",
      focusRows: [result.length - 1],
      markers: result.map((_, row) => ({ row, column: 0, kind: "result", label: "merged output" })),
      narration: `The scan reduces ${sorted.length} sorted ${sorted.length === 1 ? "interval" : "intervals"} to ${result.length} disjoint ${result.length === 1 ? "interval" : "intervals"}.`,
      prompt: "How do sorted starts guarantee that the returned intervals are ordered and non-overlapping?"
    }),
    result
  });

  return trace;
}

function createStep({
  trace,
  phase,
  codeSteps,
  rows,
  sourceCount,
  processedCount,
  outputCount,
  comparisons,
  narration,
  prompt,
  currentInterval = null,
  candidateInterval = null,
  decision = null,
  focusRows = [],
  activeRows = [],
  changedRows = [],
  changedCells = [],
  markers = [],
  annotations = []
}) {
  const viewport = createViewport({
    rows,
    focusRows,
    activeCells: activeRows.flatMap(intervalRowCells),
    changedCells: [
      ...changedRows.flatMap(intervalRowCells),
      ...changedCells
    ],
    markers,
    annotations
  });
  return {
    step: trace.length,
    phase,
    codeSteps,
    sourceCount,
    processedCount,
    outputCount,
    comparisons,
    currentInterval: cloneInterval(currentInterval),
    candidateInterval: cloneInterval(candidateInterval),
    decision,
    visibleStart: viewport.visibleStart,
    visibleEnd: viewport.visibleEnd,
    hiddenBefore: viewport.visibleStart,
    hiddenAfter: rows.length - viewport.visibleEnd - 1,
    totalRows: rows.length,
    view: viewport.view,
    narration,
    prompt
  };
}

function createViewport({ rows, focusRows, activeCells, changedCells, markers, annotations }) {
  const maximumStart = Math.max(0, rows.length - maximumGridRows);
  const lastFocus = focusRows.length === 0 ? 0 : Math.max(...focusRows);
  const visibleStart = Math.min(maximumStart, Math.max(0, lastFocus - maximumGridRows + 1));
  const visibleRows = rows.slice(visibleStart, visibleStart + maximumGridRows);
  const visibleEnd = visibleStart + visibleRows.length - 1;
  const translate = (items) => items
    .filter(({ row }) => row >= visibleStart && row <= visibleEnd)
    .map((item) => ({ ...item, row: item.row - visibleStart }));

  return {
    visibleStart,
    visibleEnd,
    view: {
      values: visibleRows.map(({ start, end }) => [start, end]),
      activeCells: translate(activeCells),
      changedCells: translate(changedCells),
      markers: translate(markers),
      annotations: translate(annotations)
    }
  };
}

function composeWorkingRows(merged, sorted, nextSortedIndex) {
  return [
    ...cloneIntervals(merged),
    ...cloneIntervals(sorted.slice(nextSortedIndex))
  ];
}

function intervalRowCells(row) {
  return [{ row, column: 0 }, { row, column: 1 }];
}

function cloneIntervals(intervals) {
  return intervals.map(({ start, end }) => ({ start, end }));
}

function cloneInterval(interval) {
  return interval === null || interval === undefined
    ? null
    : { start: interval.start, end: interval.end };
}

function formatInterval(interval) {
  return `[${formatEndpoint(interval.start)}, ${formatEndpoint(interval.end)}]`;
}

function formatEndpoint(value) {
  return Object.is(value, -0) ? "-0" : String(value);
}
