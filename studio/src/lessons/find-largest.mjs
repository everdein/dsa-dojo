import { findLargest } from "../../../arrays/find-largest.mjs";
import { buildFindLargestTrace, formatValue } from "../find-largest.mjs";
import { parseNumberList } from "../input.mjs";

export const findLargestLesson = {
  id: "arrays/find-largest",
  order: 1,
  topic: "Arrays",
  prerequisites: [],
  patterns: ["linear-scan"],
  catalogLabel: "Find Largest",
  catalogDescription: "Track one best value during a linear scan.",
  title: "Find the largest value",
  summary: "Scan once. Keep the best value seen so far. Notice exactly when the answer changes.",
  renderer: "array",
  input: {
    fields: [{
      id: "values",
      label: "Enter 1–12 finite numbers",
      type: "text",
      inputMode: "decimal",
      placeholder: "1, 2, 3, 4, 5"
    }],
    help: "Try negatives or duplicates to see whether the decision still holds.",
    defaultValue: { values: [1, 2, 3, 4, 5] },
    sampleValue: { values: [-3, 7, 2, 7, 4] },
    parse: (fields) => ({ values: parseNumberList(fields.values) }),
    serialize: ({ values }) => ({ values: values.join(", ") })
  },
  solve: ({ values }) => findLargest(values),
  buildTrace: ({ values }) => buildFindLargestTrace(values),
  code: {
    title: "One clear loop",
    filename: "find-largest.mjs",
    sourcePath: "arrays/find-largest.mjs",
    lines: [
      { number: 1, text: "export function findLargest(values) {", steps: ["function"] },
      { number: 2, text: "  validateInput(values);", steps: ["initialize"] },
      { number: 3, text: "  let largest = values[0];", steps: ["initialize"] },
      { number: 4, text: "  for (let index = 1; index < values.length; index += 1) {", steps: ["compare"] },
      { number: 5, text: "    if (largest < values[index]) {", steps: ["compare"] },
      { number: 6, text: "      largest = values[index];", steps: ["update-largest"] },
      { number: 7, text: "    }", steps: ["compare"] },
      { number: 8, text: "  }", steps: ["compare"] },
      { number: 9, text: "  return largest;", steps: ["return"] },
      { number: 10, text: "}", steps: ["function"] }
    ]
  },
  stats: [
    {
      label: "Current index",
      value: (step) => step.phase === "complete" ? "—" : String(step.activeIndex)
    },
    {
      label: "Current value",
      value: (step) => step.phase === "complete" ? "—" : formatValue(step.comparedValue)
    },
    {
      label: "Best so far",
      accent: true,
      value: (step) => formatValue(step.bestValue),
      detail: (step) => `at index ${step.bestIndex}`
    }
  ],
  complexity: {
    chip: "SCAN ONCE",
    time: "O(n)",
    space: "O(1)",
    explanation: "The algorithm only keeps the current best value. The studio records history for rewind, but that instrumentation is separate from the algorithm’s own space cost."
  },
  guide: {
    heading: "Stay curious."
  },
  legend: [
    { kind: "active", label: "current value" },
    { kind: "best", label: "best so far" }
  ],
  reflection: {
    eyebrow: "BEFORE YOU MOVE ON",
    title: "Can you explain the moment the answer changed?",
    body: "Try a duplicate, a negative-only array, and an array where the first value is already the largest. The goal is not speed. It’s being able to predict the next state."
  }
};
