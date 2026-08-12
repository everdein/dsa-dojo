import {
  maximumSlidingWindowValues,
  slidingWindowMaximum,
  validateSlidingWindowMaximumInput
} from "../../../queues/sliding-window-maximum.mjs";
import { formatNumber, parseNumberList, parsePositiveInteger } from "../input.mjs";
import { buildSlidingWindowMaximumTrace } from "../sliding-window-maximum.mjs";

export const slidingWindowMaximumLesson = {
  id: "queues/sliding-window-maximum",
  order: 21,
  topic: "Queues",
  prerequisites: ["arrays/sliding-window", "queues/queue-operations"],
  patterns: ["sliding-window", "monotonic-deque"],
  catalogLabel: "Sliding Window Maximum",
  catalogDescription: "Keep only candidates that can still lead a window.",
  title: "Emit every window maximum",
  summary: "Maintain a deque of source indices. Expire indices outside the window and remove smaller or equal values from the back before reading the maximum at the front.",
  views: [
    { id: "values", renderer: "array", heading: "Input values" },
    { id: "candidates", renderer: "queue", heading: "Monotonic candidate deque" }
  ],
  input: {
    fields: [
      {
        id: "values",
        label: `Enter 1-${maximumSlidingWindowValues} finite numbers`,
        type: "text",
        inputMode: "decimal",
        placeholder: "1, 3, -1, -3, 5, 3, 6, 7"
      },
      {
        id: "size",
        label: "Window size",
        type: "number",
        inputMode: "numeric",
        min: 1
      }
    ],
    help: "The window size must be a positive whole number no larger than the input array.",
    defaultValue: { values: [1, 3, -1, -3, 5, 3, 6, 7], size: 3 },
    sampleValue: { values: [-4, -2, -5, -1, -3], size: 2 },
    parse: (fields) => {
      const values = parseNumberList(fields.values, {
        maximumLength: maximumSlidingWindowValues
      });
      const size = parsePositiveInteger(fields.size, "Window size");
      validateSlidingWindowMaximumInput(values, size);
      return { values, size };
    },
    serialize: ({ values, size }) => ({
      values: values.map(formatNumber).join(", "),
      size: String(size)
    })
  },
  solve: ({ values, size }) => slidingWindowMaximum(values, size),
  buildTrace: (input) => buildSlidingWindowMaximumTrace(input),
  code: {
    title: "Keep a decreasing deque of candidate indices",
    filename: "sliding-window-maximum.mjs",
    sourcePath: "queues/sliding-window-maximum.mjs",
    lines: [
      { number: 28, text: "export function slidingWindowMaximum(values, size) {", steps: ["function"] },
      { number: 29, text: "  validateSlidingWindowMaximumInput(values, size);", steps: ["initialize"] },
      { number: 31, text: "  const candidates = [];", steps: ["initialize"] },
      { number: 32, text: "  const maxima = [];", steps: ["initialize"] },
      { number: 33, text: "  let front = 0;", steps: ["initialize"] },
      { number: 35, text: "  for (let index = 0; index < values.length; index += 1) {", steps: ["read-value"] },
      { number: 36, text: "    const windowStart = index - size + 1;", steps: ["read-value"] },
      { number: 37, text: "    while (front < candidates.length && candidates[front] < windowStart) front += 1;", steps: ["expire-front"] },
      { number: 38, text: "    if (front === size) {", steps: ["expire-front"] },
      { number: 39, text: "      candidates.splice(0, front);", steps: ["expire-front"] },
      { number: 40, text: "      front = 0;", steps: ["expire-front"] },
      { number: 41, text: "    }", steps: ["expire-front"] },
      { number: 42, text: "    while (", steps: ["remove-back"] },
      { number: 43, text: "      candidates.length > front", steps: ["remove-back"] },
      { number: 44, text: "      && values[candidates.at(-1)] <= values[index]", steps: ["remove-back"] },
      { number: 45, text: "    ) {", steps: ["remove-back"] },
      { number: 46, text: "      candidates.pop();", steps: ["remove-back"] },
      { number: 47, text: "    }", steps: ["remove-back"] },
      { number: 48, text: "    candidates.push(index);", steps: ["enqueue"] },
      { number: 49, text: "    if (windowStart >= 0) maxima.push(values[candidates[front]]);", steps: ["emit-maximum"] },
      { number: 52, text: "  return maxima;", steps: ["return"] },
      { number: 53, text: "}", steps: ["function"] }
    ]
  },
  stats: [
    {
      label: "Current index",
      value: (step) => step.currentIndex === null ? "-" : String(step.currentIndex)
    },
    {
      label: "Window",
      value: (step) => step.currentStart === null
        ? "not started"
        : `${step.currentStart}-${step.currentEnd}`,
      detail: (step) => step.windowReady ? "full window" : "still filling"
    },
    {
      label: "Candidates",
      value: (step) => String(step.candidateCount),
      detail: () => "decreasing front to back"
    },
    {
      label: "Latest maximum",
      accent: true,
      value: (step) => step.latestMaximum === null ? "-" : formatNumber(step.latestMaximum),
      detail: (step) => `${step.outputCount} emitted`
    }
  ],
  complexity: {
    chip: "MONOTONIC DEQUE",
    time: "O(n)",
    space: "O(k)",
    spaceLabel: "auxiliary space",
    explanation: "Every source index enters the deque once and leaves from one endpoint at most once, so all deque work is linear. At most k active candidates are stored for a window of size k; the returned maxima array is output space."
  },
  guide: {
    heading: "Keep only candidates with a future."
  },
  legend: [
    { kind: "window", label: "current window" },
    { kind: "entering", label: "incoming value" },
    { kind: "expired", label: "expired front" },
    { kind: "dominated", label: "dominated back" },
    { kind: "maximum", label: "emitted maximum" }
  ],
  reflection: {
    eyebrow: "BEFORE YOU MOVE ON",
    title: "Why can a dominated value never become useful again?",
    body: "Compare an older smaller candidate with the newer value that removes it. Explain why the newer value wins every future window they could share and remains eligible longer."
  }
};
