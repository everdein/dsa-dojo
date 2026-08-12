import {
  binarySearch,
  validateBinarySearchInput
} from "../../searching/binary-search.mjs";
import { formatNumber } from "./input.mjs";

export { binarySearch };

export function buildBinarySearchTrace({ values, target }) {
  validateBinarySearchInput(values, target);
  const trace = [];
  let left = 0;
  let right = values.length - 1;
  let middle = null;
  let comparisons = 0;
  let result = -1;

  trace.push(createStep({
    trace,
    phase: "initialize",
    codeSteps: ["initialize"],
    values,
    target,
    left,
    right,
    middle,
    comparisons,
    result,
    narration: "The entire sorted array is the initial candidate range.",
    prompt: "Which index will be the first midpoint?"
  }));

  while (left <= right) {
    middle = left + Math.floor((right - left) / 2);
    comparisons += 1;
    trace.push(createStep({
      trace,
      phase: "compare",
      codeSteps: ["loop", "middle", "compare"],
      values,
      target,
      left,
      right,
      middle,
      comparisons,
      result,
      narration: `Compare target ${formatNumber(target)} with midpoint value ${formatNumber(values[middle])} at index ${middle}.`,
      prompt: values[middle] === target
        ? "What result can we return immediately?"
        : values[middle] < target
          ? "Which half cannot contain the target?"
          : "Which half cannot contain the target?"
    }));
    if (values[middle] === target) {
      result = middle;
      trace.push(createStep({
        trace,
        phase: "found",
        codeSteps: ["return-found"],
        values,
        target,
        left,
        right,
        middle,
        comparisons,
        result,
        narration: `The midpoint equals the target, so index ${middle} is the answer.`,
        prompt: "Why is no further search necessary?"
      }));
      break;
    }
    if (values[middle] < target) {
      const oldMiddle = middle;
      left = middle + 1;
      trace.push(createStep({
        trace,
        phase: "discard-left",
        codeSteps: ["move-left"],
        values,
        target,
        left,
        right,
        middle,
        comparisons,
        result,
        narration: `${formatNumber(values[oldMiddle])} is too small. Discard it and every smaller value.`,
        prompt: left <= right ? "How much did the candidate range shrink?" : "What does an empty range prove?"
      }));
    } else {
      const oldMiddle = middle;
      right = middle - 1;
      trace.push(createStep({
        trace,
        phase: "discard-right",
        codeSteps: ["move-right"],
        values,
        target,
        left,
        right,
        middle,
        comparisons,
        result,
        narration: `${formatNumber(values[oldMiddle])} is too large. Discard it and every larger value.`,
        prompt: left <= right ? "How much did the candidate range shrink?" : "What does an empty range prove?"
      }));
    }
  }

  trace.push({
    ...createStep({
      trace,
      phase: "complete",
      codeSteps: result === -1 ? ["return-missing"] : ["return-found"],
      values,
      target,
      left,
      right,
      middle,
      comparisons,
      result,
      narration: result === -1
        ? `The candidate range is empty, so ${formatNumber(target)} is not present.`
        : `Binary search found ${formatNumber(target)} at index ${result}.`,
      prompt: "Why can binary search discard half after one comparison?"
    }),
    result
  });
  return trace;
}

function createStep({
  trace,
  phase,
  codeSteps,
  values,
  target,
  left,
  right,
  middle,
  comparisons,
  result,
  narration,
  prompt
}) {
  const hasRange = left <= right;
  const activeMiddle = Number.isInteger(middle) && middle >= left && middle <= right;
  return {
    step: trace.length,
    phase,
    codeSteps,
    target,
    leftIndex: left,
    rightIndex: right,
    middleIndex: middle,
    comparisons,
    foundIndex: result,
    candidateCount: hasRange ? right - left + 1 : 0,
    view: {
      values: [...values],
      activeIndices: activeMiddle ? [middle] : [],
      ranges: hasRange ? [{ start: left, end: right, kind: "candidate", label: "candidate range" }] : [],
      markers: activeMiddle ? [{ index: middle, kind: result === middle ? "result" : "middle", label: result === middle ? "found" : "middle" }] : [],
      annotations: result >= 0 ? [{ index: result, label: "target" }] : [],
      changedIndices: []
    },
    narration,
    prompt
  };
}
