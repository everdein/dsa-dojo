import { maxWindowSum } from "../../../arrays/sliding-window.mjs";
import { buildSlidingWindowTrace } from "../sliding-window.mjs";
import { formatNumber, parseNumberList, parsePositiveInteger } from "../input.mjs";

export const slidingWindowLesson = {
  id: "arrays/sliding-window",
  order: 2,
  topic: "Arrays",
  prerequisites: ["arrays/find-largest"],
  patterns: ["sliding-window"],
  catalogLabel: "Sliding Window",
  catalogDescription: "Reuse a fixed-size range and its running sum.",
  title: "Find the best fixed window",
  summary: "Move a fixed-size window across the array. Update its sum by removing one value and adding one value.",
  renderer: "array",
  input: {
    fields: [
      {
        id: "values",
        label: "Enter 1–12 finite numbers",
        type: "text",
        inputMode: "decimal",
        placeholder: "2, 1, 5, 1, 3, 2"
      },
      {
        id: "size",
        label: "Window size",
        type: "number",
        inputMode: "numeric",
        min: 1
      }
    ],
    help: "The window size must be a whole number no larger than the array.",
    defaultValue: { values: [2, 1, 5, 1, 3, 2], size: 3 },
    sampleValue: { values: [-2, 4, -1, 6, -3, 2, 5], size: 3 },
    parse: (fields) => {
      const values = parseNumberList(fields.values);
      const size = parsePositiveInteger(fields.size, "Window size");
      if (size > values.length) throw new Error("Window size cannot be larger than the array.");
      return { values, size };
    },
    serialize: ({ values, size }) => ({ values: values.join(", "), size: String(size) })
  },
  solve: ({ values, size }) => maxWindowSum(values, size),
  buildTrace: buildSlidingWindowTrace,
  code: {
    title: "Reuse the previous sum",
    filename: "sliding-window.mjs",
    sourcePath: "arrays/sliding-window.mjs",
    lines: [
      { number: 16, text: "export function maxWindowSum(values, size) {", steps: ["function"] },
      { number: 17, text: "  validateSlidingWindowInput(values, size);", steps: ["initialize-window"] },
      { number: 19, text: "  let windowSum = 0;", steps: ["initialize-window"] },
      { number: 20, text: "  for (let index = 0; index < size; index += 1) {", steps: ["initialize-window"] },
      { number: 21, text: "    windowSum += values[index];", steps: ["initialize-window"] },
      { number: 23, text: "  }", steps: ["initialize-window"] },
      { number: 25, text: "  let bestSum = windowSum;", steps: ["initialize-window"] },
      { number: 26, text: "  let bestStart = 0;", steps: ["initialize-window"] },
      { number: 28, text: "  for (let end = size; end < values.length; end += 1) {", steps: ["slide-window"] },
      { number: 29, text: "    windowSum += values[end] - values[end - size];", steps: ["slide-window"] },
      { number: 31, text: "    if (windowSum > bestSum) {", steps: ["update-best"] },
      { number: 32, text: "      bestSum = windowSum;", steps: ["update-best"] },
      { number: 33, text: "      bestStart = end - size + 1;", steps: ["update-best"] },
      { number: 34, text: "    }", steps: ["update-best"] },
      { number: 35, text: "  }", steps: ["slide-window", "update-best"] },
      { number: 37, text: "  return {", steps: ["return"] },
      { number: 38, text: "    sum: bestSum,", steps: ["return"] },
      { number: 39, text: "    start: bestStart,", steps: ["return"] },
      { number: 40, text: "    end: bestStart + size - 1", steps: ["return"] },
      { number: 41, text: "  };", steps: ["return"] },
      { number: 42, text: "}", steps: ["function"] }
    ]
  },
  stats: [
    {
      label: "Current window",
      value: (step) => `${step.currentStart}–${step.currentEnd}`
    },
    {
      label: "Window sum",
      value: (step) => formatNumber(step.currentSum)
    },
    {
      label: "Best sum",
      accent: true,
      value: (step) => formatNumber(step.bestSum),
      detail: (step) => `indices ${step.bestStart}–${step.bestEnd}`
    }
  ],
  complexity: {
    chip: "REUSE WORK",
    time: "O(n)",
    space: "O(1)",
    explanation: "Each move removes one value and adds one value. Recomputing every window from scratch would repeat work; the running sum keeps each move constant-time."
  },
  guide: {
    heading: "Watch the boundaries."
  },
  legend: [
    { kind: "window", label: "current window" },
    { kind: "best", label: "best window" },
    { kind: "entering", label: "entering value" },
    { kind: "leaving", label: "leaving value" }
  ],
  reflection: {
    eyebrow: "BEFORE YOU MOVE ON",
    title: "What work did the window save?",
    body: "Try a window of size one, a window as large as the array, and an array containing only negative numbers. Explain why each move needs one subtraction and one addition."
  }
};
