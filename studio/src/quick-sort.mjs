import {
  quickSort,
  validateQuickSortInput
} from "../../sorting/quick-sort.mjs";
import { formatNumber } from "./input.mjs";

export { quickSort };

export function buildQuickSortTrace(values) {
  validateQuickSortInput(values);

  const working = [...values];
  const trace = [];
  const rangeNodes = [];
  const rangeEdges = [];
  const knownRanges = new Set();
  const partitionedRanges = new Set();
  const completedRanges = new Set();
  const settledIndices = new Set();
  let comparisons = 0;
  let swaps = 0;
  let partitions = 0;
  let recursiveCalls = 0;
  let maximumDepth = 0;

  addRangeNode(0, working.length - 1, null, null);
  trace.push(createStep({
    trace,
    phase: "initialize",
    codeSteps: ["initialize"],
    working,
    rangeNodes,
    rangeEdges,
    partitionedRanges,
    completedRanges,
    settledIndices,
    comparisons,
    swaps,
    partitions,
    recursiveCalls,
    maximumDepth,
    start: 0,
    end: working.length - 1,
    depth: 1,
    pivotIndex: null,
    pivotValue: null,
    boundaryIndex: null,
    scanIndex: null,
    decision: null,
    swapIndices: [],
    changedIndices: [],
    annotations: [],
    treeAnnotation: "initial call",
    narration: "Copy the input so partition swaps cannot mutate the learner's array. The first recursive call owns the full range.",
    prompt: "Which deterministic value will this lesson choose as the first pivot?"
  }));

  sortRange(0, working.length - 1, 1);

  const result = quickSort(values);
  trace.push({
    ...createStep({
      trace,
      phase: "complete",
      codeSteps: ["return"],
      working,
      rangeNodes,
      rangeEdges,
      partitionedRanges,
      completedRanges,
      settledIndices,
      comparisons,
      swaps,
      partitions,
      recursiveCalls,
      maximumDepth,
      start: 0,
      end: working.length - 1,
      depth: 1,
      pivotIndex: null,
      pivotValue: null,
      boundaryIndex: null,
      scanIndex: null,
      decision: null,
      swapIndices: [],
      changedIndices: [],
      annotations: [],
      treeAnnotation: "fully sorted",
      narration: `Every recursive range has returned. The immutable result is [${working.map(formatNumber).join(", ")}].`,
      prompt: "How did pivot balance affect the recursion depth and total comparisons?"
    }),
    result: [...result]
  });

  return trace;

  function sortRange(start, end, depth) {
    recursiveCalls += 1;
    maximumDepth = Math.max(maximumDepth, depth);
    const rangeId = quickSortRangeId(start, end);

    if (start === end) {
      settledIndices.add(start);
      completedRanges.add(rangeId);
      trace.push(createStep({
        trace,
        phase: "base-case",
        codeSteps: ["check-base", "return-range"],
        working,
        rangeNodes,
        rangeEdges,
        partitionedRanges,
        completedRanges,
        settledIndices,
        comparisons,
        swaps,
        partitions,
        recursiveCalls,
        maximumDepth,
        start,
        end,
        depth,
        pivotIndex: start,
        pivotValue: working[start],
        boundaryIndex: null,
        scanIndex: null,
        decision: "singleton",
        swapIndices: [],
        changedIndices: [],
        annotations: [{ index: start, label: "singleton is sorted" }],
        treeAnnotation: `singleton ${formatNumber(working[start])}`,
        narration: `Range ${start}-${end} contains one value, so it is already sorted and returns immediately.`,
        prompt: "Which partitioned parent range was waiting for this return?"
      }));
      return;
    }

    const pivotValue = working[end];
    let boundary = start;
    trace.push(createStep({
      trace,
      phase: "choose-pivot",
      codeSteps: ["check-base", "choose-pivot"],
      working,
      rangeNodes,
      rangeEdges,
      partitionedRanges,
      completedRanges,
      settledIndices,
      comparisons,
      swaps,
      partitions,
      recursiveCalls,
      maximumDepth,
      start,
      end,
      depth,
      pivotIndex: end,
      pivotValue,
      boundaryIndex: boundary,
      scanIndex: null,
      decision: null,
      swapIndices: [],
      changedIndices: [],
      annotations: [{ index: end, label: `pivot ${formatNumber(pivotValue)}` }],
      treeAnnotation: `pivot ${formatNumber(pivotValue)} at ${end}`,
      narration: `Choose the final value ${formatNumber(pivotValue)} as the pivot for range ${start}-${end}. The boundary begins at ${start}.`,
      prompt: "Which side receives a scanned value that is less than or equal to the pivot?"
    }));

    for (let scan = start; scan < end; scan += 1) {
      comparisons += 1;
      const belongsLeft = working[scan] <= pivotValue;
      trace.push(createStep({
        trace,
        phase: "compare",
        codeSteps: ["scan-value"],
        working,
        rangeNodes,
        rangeEdges,
        partitionedRanges,
        completedRanges,
        settledIndices,
        comparisons,
        swaps,
        partitions,
        recursiveCalls,
        maximumDepth,
        start,
        end,
        depth,
        pivotIndex: end,
        pivotValue,
        boundaryIndex: boundary,
        scanIndex: scan,
        decision: belongsLeft ? "left" : "right",
        swapIndices: [],
        changedIndices: [],
        annotations: [{
          index: scan,
          label: `${formatNumber(working[scan])} ${belongsLeft ? "<=" : ">"} ${formatNumber(pivotValue)}`
        }],
        treeAnnotation: `scan ${scan}, boundary ${boundary}`,
        narration: `${formatNumber(working[scan])} is ${belongsLeft ? "less than or equal to" : "greater than"} pivot ${formatNumber(pivotValue)}, so it belongs on the ${belongsLeft ? "left" : "right"}.`,
        prompt: belongsLeft
          ? "Must this value swap into the next left position?"
          : "Why does the left boundary stay where it is?"
      }));

      if (!belongsLeft) {
        trace.push(createStep({
          trace,
          phase: "keep-right",
          codeSteps: ["leave-right"],
          working,
          rangeNodes,
          rangeEdges,
          partitionedRanges,
          completedRanges,
          settledIndices,
          comparisons,
          swaps,
          partitions,
          recursiveCalls,
          maximumDepth,
          start,
          end,
          depth,
          pivotIndex: end,
          pivotValue,
          boundaryIndex: boundary,
          scanIndex: scan,
          decision: "right",
          swapIndices: [],
          changedIndices: [],
          annotations: [{ index: scan, label: "stays in greater region" }],
          treeAnnotation: `boundary remains ${boundary}`,
          narration: `Leave ${formatNumber(working[scan])} in the greater-than region. The boundary remains ${boundary}.`,
          prompt: "What happens when a later scanned value does belong on the left?"
        }));
        continue;
      }

      const targetIndex = boundary;
      const didSwap = scan !== targetIndex;
      if (didSwap) {
        swap(working, scan, targetIndex);
        swaps += 1;
      }
      boundary += 1;
      trace.push(createStep({
        trace,
        phase: didSwap ? "swap-left" : "keep-left",
        codeSteps: didSwap ? ["accept-left", "swap-left"] : ["accept-left"],
        working,
        rangeNodes,
        rangeEdges,
        partitionedRanges,
        completedRanges,
        settledIndices,
        comparisons,
        swaps,
        partitions,
        recursiveCalls,
        maximumDepth,
        start,
        end,
        depth,
        pivotIndex: end,
        pivotValue,
        boundaryIndex: boundary,
        scanIndex: scan,
        decision: "left",
        swapIndices: didSwap ? [targetIndex, scan] : [],
        changedIndices: didSwap ? [targetIndex, scan] : [],
        annotations: [{
          index: targetIndex,
          label: didSwap ? `moved left from ${scan}` : "already in left region"
        }],
        treeAnnotation: `left boundary advances to ${boundary}`,
        narration: didSwap
          ? `Swap indices ${scan} and ${targetIndex}, then advance the left boundary to ${boundary}.`
          : `${formatNumber(working[targetIndex])} is already at the boundary; accept it left and advance the boundary to ${boundary}.`,
        prompt: "Which invariant now holds before the next scan?"
      }));
    }

    const originalPivotIndex = end;
    const didPlaceSwap = boundary !== end;
    if (didPlaceSwap) {
      swap(working, boundary, end);
      swaps += 1;
    }
    const pivotIndex = boundary;
    partitions += 1;
    settledIndices.add(pivotIndex);
    partitionedRanges.add(rangeId);
    trace.push(createStep({
      trace,
      phase: "place-pivot",
      codeSteps: ["place-pivot"],
      working,
      rangeNodes,
      rangeEdges,
      partitionedRanges,
      completedRanges,
      settledIndices,
      comparisons,
      swaps,
      partitions,
      recursiveCalls,
      maximumDepth,
      start,
      end,
      depth,
      pivotIndex,
      pivotValue,
      boundaryIndex: pivotIndex,
      scanIndex: null,
      decision: "pivot-settled",
      swapIndices: didPlaceSwap ? [pivotIndex, originalPivotIndex] : [],
      changedIndices: didPlaceSwap ? [pivotIndex, originalPivotIndex] : [],
      annotations: [{ index: pivotIndex, label: "pivot in final position" }],
      treeAnnotation: `pivot settles at ${pivotIndex}`,
      narration: didPlaceSwap
        ? `Swap the pivot into boundary index ${pivotIndex}. Every value left is <= ${formatNumber(pivotValue)} and every value right is greater.`
        : `The pivot is already at boundary index ${pivotIndex}. Its final sorted position is fixed.`,
      prompt: "Which two subranges can now be sorted independently?"
    }));

    const leftEnd = pivotIndex - 1;
    const rightStart = pivotIndex + 1;
    if (start <= leftEnd) addRangeNode(start, leftEnd, rangeId, "left");
    if (rightStart <= end) addRangeNode(rightStart, end, rangeId, "right");
    trace.push(createStep({
      trace,
      phase: "divide",
      codeSteps: ["recurse-left", "recurse-right"],
      working,
      rangeNodes,
      rangeEdges,
      partitionedRanges,
      completedRanges,
      settledIndices,
      comparisons,
      swaps,
      partitions,
      recursiveCalls,
      maximumDepth,
      start,
      end,
      depth,
      pivotIndex,
      pivotValue,
      boundaryIndex: pivotIndex,
      scanIndex: null,
      decision: "divide",
      swapIndices: [],
      changedIndices: [],
      annotations: [{ index: pivotIndex, label: "excluded from recursive calls" }],
      treeAnnotation: describeChildren(start, leftEnd, rightStart, end),
      narration: `Exclude settled pivot ${formatNumber(pivotValue)} and recurse into ${describeChildren(start, leftEnd, rightStart, end)}.`,
      prompt: "How would balanced versus one-sided subranges change recursion depth?"
    }));

    if (start <= leftEnd) sortRange(start, leftEnd, depth + 1);
    if (rightStart <= end) sortRange(rightStart, end, depth + 1);

    completedRanges.add(rangeId);
    trace.push(createStep({
      trace,
      phase: "return-range",
      codeSteps: ["return-range"],
      working,
      rangeNodes,
      rangeEdges,
      partitionedRanges,
      completedRanges,
      settledIndices,
      comparisons,
      swaps,
      partitions,
      recursiveCalls,
      maximumDepth,
      start,
      end,
      depth,
      pivotIndex,
      pivotValue,
      boundaryIndex: null,
      scanIndex: null,
      decision: "sorted",
      swapIndices: [],
      changedIndices: [],
      annotations: [{ index: pivotIndex, label: `range ${start}-${end} sorted` }],
      treeAnnotation: `sorted [${working.slice(start, end + 1).map(formatNumber).join(", ")}]`,
      narration: `Both recursive subranges have returned, so range ${start}-${end} is fully sorted.`,
      prompt: depth === 1 ? "Is the entire array now sorted?" : "Which parent call resumes next?"
    }));
  }

  function addRangeNode(start, end, parentId, label) {
    const id = quickSortRangeId(start, end);
    if (knownRanges.has(id)) return;
    knownRanges.add(id);
    rangeNodes.push({ id, value: start === end ? `${start}` : `${start}-${end}` });
    if (parentId !== null) {
      rangeEdges.push({
        id: `edge-${parentId}-${id}`,
        fromId: parentId,
        toId: id,
        label
      });
    }
  }
}

export function quickSortRangeId(start, end) {
  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end < start) {
    throw new Error("Quick Sort range ids require nonnegative ordered integer bounds.");
  }
  return `range-${start}-${end}`;
}

function createStep({
  trace,
  phase,
  codeSteps,
  working,
  rangeNodes,
  rangeEdges,
  partitionedRanges,
  completedRanges,
  settledIndices,
  comparisons,
  swaps,
  partitions,
  recursiveCalls,
  maximumDepth,
  start,
  end,
  depth,
  pivotIndex,
  pivotValue,
  boundaryIndex,
  scanIndex,
  decision,
  swapIndices,
  changedIndices,
  annotations,
  treeAnnotation,
  narration,
  prompt
}) {
  const activeRangeId = quickSortRangeId(start, end);
  return {
    step: trace.length,
    phase,
    codeSteps,
    activeStart: start,
    activeEnd: end,
    currentDepth: depth,
    pivotIndex,
    pivotValue,
    boundaryIndex,
    scanIndex,
    decision,
    swapIndices: [...swapIndices],
    comparisons,
    swaps,
    partitions,
    recursiveCalls,
    maximumDepth,
    settledCount: settledIndices.size,
    values: [...working],
    views: {
      values: buildArrayView({
        working,
        phase,
        start,
        end,
        pivotIndex,
        boundaryIndex,
        scanIndex,
        settledIndices,
        changedIndices,
        annotations
      }),
      calls: {
        nodes: rangeNodes.map((node) => ({ ...node })),
        edges: rangeEdges.map((edge) => ({ ...edge })),
        rootIds: [quickSortRangeId(0, working.length - 1)],
        activeNodeIds: [activeRangeId],
        changedNodeIds: changedIndices.length > 0 || phase === "base-case" || phase === "return-range"
          ? [activeRangeId]
          : [],
        states: rangeNodes.flatMap(({ id }) => [
          ...(partitionedRanges.has(id) ? [{ nodeId: id, kind: "partitioned", label: "pivot placed" }] : []),
          ...(completedRanges.has(id) ? [{ nodeId: id, kind: "sorted", label: "sorted range" }] : [])
        ]),
        annotations: [{ nodeId: activeRangeId, label: treeAnnotation }],
        pointers: [{ nodeId: activeRangeId, kind: "current", label: "active call" }]
      }
    },
    narration,
    prompt
  };
}

function buildArrayView({
  working,
  phase,
  start,
  end,
  pivotIndex,
  boundaryIndex,
  scanIndex,
  settledIndices,
  changedIndices,
  annotations
}) {
  const ranges = [{
    start,
    end,
    kind: phase === "return-range" || phase === "base-case" || phase === "complete"
      ? "sorted-range"
      : "subrange",
    label: phase === "return-range" || phase === "base-case" || phase === "complete"
      ? "sorted recursive range"
      : "active recursive range"
  }];
  if (boundaryIndex !== null && boundaryIndex > start) {
    ranges.push({
      start,
      end: boundaryIndex - 1,
      kind: "left-partition",
      label: "less than or equal to pivot"
    });
  }
  if (scanIndex !== null && scanIndex > boundaryIndex) {
    ranges.push({
      start: boundaryIndex,
      end: scanIndex - 1,
      kind: "right-partition",
      label: "greater than pivot"
    });
  }

  const markerByIndex = new Map();
  for (const index of settledIndices) {
    markerByIndex.set(index, { index, kind: "settled", label: "final position" });
  }
  if (boundaryIndex !== null) {
    markerByIndex.set(boundaryIndex, { index: boundaryIndex, kind: "boundary", label: "next left slot" });
  }
  if (scanIndex !== null) {
    markerByIndex.set(scanIndex, { index: scanIndex, kind: "scan", label: "scanned value" });
  }
  if (pivotIndex !== null) {
    markerByIndex.set(pivotIndex, { index: pivotIndex, kind: "pivot", label: "pivot" });
  }

  return {
    values: [...working],
    activeIndices: [...new Set([
      ...(pivotIndex === null ? [] : [pivotIndex]),
      ...(boundaryIndex === null ? [] : [boundaryIndex]),
      ...(scanIndex === null ? [] : [scanIndex])
    ])],
    ranges,
    markers: [...markerByIndex.values()],
    annotations: annotations.map((annotation) => ({ ...annotation })),
    changedIndices: [...new Set(changedIndices)]
  };
}

function describeChildren(start, leftEnd, rightStart, end) {
  const children = [];
  if (start <= leftEnd) children.push(`left ${start}-${leftEnd}`);
  if (rightStart <= end) children.push(`right ${rightStart}-${end}`);
  return children.join(" and ");
}

function swap(values, left, right) {
  [values[left], values[right]] = [values[right], values[left]];
}
