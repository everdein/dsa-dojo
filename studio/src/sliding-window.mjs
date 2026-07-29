import {
  maxWindowSum,
  validateSlidingWindowInput
} from "../../arrays/sliding-window.mjs";
import { formatNumber } from "./input.mjs";

export { maxWindowSum };

export function buildSlidingWindowTrace({ values, size }) {
  validateSlidingWindowInput(values, size);

  let currentSum = values.slice(0, size).reduce((sum, value) => sum + value, 0);
  let bestSum = currentSum;
  let bestStart = 0;
  let bestEnd = size - 1;

  const trace = [{
    step: 0,
    phase: "initialize",
    codeSteps: ["initialize-window"],
    currentStart: 0,
    currentEnd: size - 1,
    currentSum,
    bestSum,
    bestStart,
    bestEnd,
    enteringIndex: null,
    leavingIndex: null,
    changed: true,
    view: buildWindowView(values, 0, size - 1, bestStart, bestEnd),
    narration: `Add the first ${size} values to create a window with sum ${formatNumber(currentSum)}.`,
    prompt: "Prediction: which value will leave and which value will enter when the window moves?"
  }];

  for (let end = size; end < values.length; end += 1) {
    const start = end - size + 1;
    const leavingIndex = start - 1;
    currentSum += values[end] - values[leavingIndex];
    const changed = currentSum > bestSum;

    if (changed) {
      bestSum = currentSum;
      bestStart = start;
      bestEnd = end;
    }

    trace.push({
      step: trace.length,
      phase: "slide",
      codeSteps: changed ? ["slide-window", "update-best"] : ["slide-window"],
      currentStart: start,
      currentEnd: end,
      currentSum,
      bestSum,
      bestStart,
      bestEnd,
      enteringIndex: end,
      leavingIndex,
      changed,
      view: buildWindowView(values, start, end, bestStart, bestEnd, leavingIndex, end),
      narration: changed
        ? `${formatNumber(values[leavingIndex])} leaves and ${formatNumber(values[end])} enters. The new sum ${formatNumber(currentSum)} becomes the best.`
        : `${formatNumber(values[leavingIndex])} leaves and ${formatNumber(values[end])} enters. The sum is ${formatNumber(currentSum)}, so the best stays ${formatNumber(bestSum)}.`,
      prompt: changed
        ? "What made this window better than every previous window?"
        : "Notice that moving the window only changed two values in the running sum."
    });
  }

  trace.push({
    step: trace.length,
    phase: "complete",
    codeSteps: ["return"],
    currentStart: trace.at(-1).currentStart,
    currentEnd: trace.at(-1).currentEnd,
    currentSum: trace.at(-1).currentSum,
    bestSum,
    bestStart,
    bestEnd,
    enteringIndex: null,
    leavingIndex: null,
    changed: false,
    view: {
      values: [...values],
      activeIndices: [],
      ranges: [{ start: bestStart, end: bestEnd, kind: "best", label: "best window" }],
      markers: []
    },
    result: { sum: bestSum, start: bestStart, end: bestEnd },
    narration: `The scan is complete. The best window runs from index ${bestStart} to ${bestEnd} with sum ${formatNumber(bestSum)}.`,
    prompt: "Can you explain why we never needed to add every window from scratch?"
  });

  return trace;
}

function buildWindowView(values, start, end, bestStart, bestEnd, leavingIndex, enteringIndex) {
  const markers = [];
  if (Number.isInteger(leavingIndex)) markers.push({ index: leavingIndex, kind: "leaving", label: "out" });
  if (Number.isInteger(enteringIndex)) markers.push({ index: enteringIndex, kind: "entering", label: "in" });
  return {
    values: [...values],
    activeIndices: Number.isInteger(enteringIndex) ? [enteringIndex] : [],
    ranges: [
      { start, end, kind: "window", label: "current window" },
      { start: bestStart, end: bestEnd, kind: "best", label: "best window" }
    ],
    markers
  };
}
