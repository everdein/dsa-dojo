import {
  reverseArray,
  validateReverseArrayInput
} from "../../arrays/reverse-array.mjs";
import { formatNumber } from "./input.mjs";

export { reverseArray };

export function buildReverseArrayTrace(values) {
  validateReverseArrayInput(values);

  const working = [...values];
  const requiredSwaps = Math.floor(values.length / 2);
  const trace = [];
  let left = 0;
  let right = working.length - 1;
  let swapCount = 0;

  trace.push(createStep({
    trace,
    phase: "initialize",
    codeSteps: ["initialize"],
    working,
    left,
    right,
    swapCount,
    requiredSwaps,
    canSwap: left < right,
    swapped: false,
    narration: "Place one pointer at each end. These pointers identify the next mirrored pair.",
    prompt: "Prediction: which two values will trade places first?"
  }));

  while (true) {
    const canSwap = left < right;
    trace.push(createStep({
      trace,
      phase: "check",
      codeSteps: ["check-pointers"],
      working,
      left,
      right,
      swapCount,
      requiredSwaps,
      canSwap,
      swapped: false,
      narration: canSwap
        ? `Index ${left} is still left of index ${right}, so this pair needs to swap.`
        : left === right
          ? `Both pointers reached index ${left}. The center value is already in its final position.`
          : "The pointers crossed, so every mirrored pair is settled.",
      prompt: canSwap
        ? "What will be true about these two positions after the swap?"
        : "Why would another swap undo correct work?"
    }));

    if (!canSwap) break;

    const leftValue = working[left];
    const rightValue = working[right];
    working[left] = rightValue;
    working[right] = leftValue;
    swapCount += 1;

    trace.push(createStep({
      trace,
      phase: "swap",
      codeSteps: ["swap-values"],
      working,
      left,
      right,
      swapCount,
      requiredSwaps,
      canSwap: true,
      swapped: true,
      changedIndices: [left, right],
      annotations: [
        { index: left, label: `from ${right}` },
        { index: right, label: `from ${left}` }
      ],
      settleCurrentPair: true,
      previousLeftValue: leftValue,
      previousRightValue: rightValue,
      narration: `${formatNumber(leftValue)} and ${formatNumber(rightValue)} trade places. Both positions are now settled.`,
      prompt: "Notice that one swap finishes two positions at once."
    }));

    left += 1;
    right -= 1;

    trace.push(createStep({
      trace,
      phase: "advance",
      codeSteps: ["move-pointers"],
      working,
      left,
      right,
      swapCount,
      requiredSwaps,
      canSwap: left < right,
      swapped: false,
      narration: "Move both pointers inward to the next mirrored pair.",
      prompt: left <= right
        ? "Are the pointers still far enough apart for another swap?"
        : "The pointers have crossed. What does that tell us?"
    }));
  }

  trace.push({
    ...createStep({
      trace,
      phase: "complete",
      codeSteps: ["return"],
      working,
      left,
      right,
      swapCount,
      requiredSwaps,
      canSwap: false,
      swapped: false,
      complete: true,
      narration: `The reversal is complete after ${swapCount} ${swapCount === 1 ? "swap" : "swaps"}.`,
      prompt: "Can you explain why reversing n values needs only floor(n / 2) swaps?"
    }),
    result: [...working]
  });

  return trace;
}

function createStep({
  trace,
  phase,
  codeSteps,
  working,
  left,
  right,
  swapCount,
  requiredSwaps,
  canSwap,
  swapped,
  narration,
  prompt,
  annotations = [],
  changedIndices = [],
  settleCurrentPair = false,
  complete = false,
  previousLeftValue = null,
  previousRightValue = null
}) {
  const leftValue = isValidIndex(left, working.length) ? working[left] : null;
  const rightValue = isValidIndex(right, working.length) ? working[right] : null;
  return {
    step: trace.length,
    phase,
    codeSteps,
    leftIndex: left,
    rightIndex: right,
    leftValue,
    rightValue,
    previousLeftValue,
    previousRightValue,
    swapCount,
    requiredSwaps,
    canSwap,
    swapped,
    view: {
      values: [...working],
      activeIndices: complete ? [] : activePointerIndices(left, right, working.length),
      ranges: settledRanges(working.length, left, right, { settleCurrentPair, complete }),
      markers: complete ? [] : pointerMarkers(left, right, working.length),
      annotations: annotations.map((annotation) => ({ ...annotation })),
      changedIndices: [...changedIndices]
    },
    narration,
    prompt
  };
}

function activePointerIndices(left, right, length) {
  if (left > right) return [];
  return [...new Set([left, right].filter((index) => isValidIndex(index, length)))];
}

function pointerMarkers(left, right, length) {
  if (left > right || !isValidIndex(left, length) || !isValidIndex(right, length)) return [];
  if (left === right) return [{ index: left, kind: "both", label: "left + right" }];
  return [
    { index: left, kind: "left", label: "left" },
    { index: right, kind: "right", label: "right" }
  ];
}

function settledRanges(length, left, right, { settleCurrentPair = false, complete = false } = {}) {
  if (complete || left > right) {
    return [{ start: 0, end: length - 1, kind: "settled", label: "settled" }];
  }

  const ranges = [];
  const prefixEnd = settleCurrentPair ? left : left - 1;
  const suffixStart = settleCurrentPair ? right : right + 1;
  if (prefixEnd >= 0) {
    ranges.push({ start: 0, end: prefixEnd, kind: "settled", label: "settled" });
  }
  if (suffixStart < length) {
    ranges.push({ start: suffixStart, end: length - 1, kind: "settled", label: "settled" });
  }
  return ranges;
}

function isValidIndex(index, length) {
  return Number.isInteger(index) && index >= 0 && index < length;
}
