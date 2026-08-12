import {
  countFrequencies,
  maximumFrequencyValues
} from "../../../arrays/frequency-count.mjs";
import { buildFrequencyCountTrace } from "../frequency-count.mjs";
import { formatNumber, parseNumberList } from "../input.mjs";

export const frequencyCountLesson = {
  id: "arrays/frequency-count",
  order: 10,
  topic: "Arrays",
  catalogLabel: "Frequency Count",
  catalogDescription: "Build reusable counts one input value at a time.",
  title: "Count how often each value appears",
  summary: "Scan once. Use one lookup entry per distinct value, incrementing a count whenever that value appears again.",
  prerequisites: ["arrays/find-largest"],
  patterns: ["frequency-counting"],
  views: [
    { id: "values", renderer: "array", heading: "Input values" },
    { id: "counts", renderer: "lookup", heading: "Counts" }
  ],
  input: {
    fields: [{
      id: "values",
      label: `Enter 1-${maximumFrequencyValues} finite numbers`,
      type: "text",
      inputMode: "decimal",
      placeholder: "1, 2, 2, 3, 1, 1"
    }],
    help: "Try duplicates, negative values, decimals, or an input where every value is distinct.",
    defaultValue: { values: [1, 2, 2, 3, 1, 1] },
    sampleValue: { values: [-2, 4, -2, 4, 4, 7] },
    parse: (fields) => ({
      values: parseNumberList(fields.values, { maximumLength: maximumFrequencyValues })
    }),
    serialize: ({ values }) => ({ values: values.join(", ") })
  },
  solve: ({ values }) => countFrequencies(values),
  buildTrace: ({ values }) => buildFrequencyCountTrace(values),
  code: {
    title: "Store one count per distinct value",
    filename: "frequency-count.mjs",
    sourcePath: "arrays/frequency-count.mjs",
    lines: [
      { number: 22, text: "export function countFrequencies(values) {", steps: ["function"] },
      { number: 23, text: "  validateFrequencyInput(values);", steps: ["initialize"] },
      { number: 24, text: "", steps: ["initialize"] },
      { number: 25, text: "  const counts = new Map();", steps: ["initialize"] },
      { number: 26, text: "  for (const value of values) {", steps: ["read-value"] },
      { number: 27, text: "    const normalizedValue = Object.is(value, -0) ? 0 : value;", steps: ["read-value"] },
      { number: 28, text: "    const previous = counts.get(normalizedValue) ?? 0;", steps: ["read-count"] },
      { number: 29, text: "    counts.set(normalizedValue, previous + 1);", steps: ["write-count", "add-key", "increment-count"] },
      { number: 30, text: "  }", steps: ["read-value"] },
      { number: 31, text: "", steps: ["return"] },
      { number: 32, text: "  return [...counts].map(([value, count]) => ({ value, count }));", steps: ["return"] },
      { number: 33, text: "}", steps: ["function"] }
    ]
  },
  stats: [
    {
      label: "Current index",
      value: (step) => step.currentIndex === null ? "-" : String(step.currentIndex)
    },
    {
      label: "Current value",
      value: (step) => step.currentValue === null ? "-" : formatNumber(step.currentValue)
    },
    {
      label: "Values counted",
      value: (step) => `${step.processedCount} / ${step.views.values.values.length}`
    },
    {
      label: "Distinct keys",
      accent: true,
      value: (step) => String(step.distinctCount),
      detail: () => "one entry per distinct value"
    }
  ],
  complexity: {
    chip: "COUNT AS YOU GO",
    time: "O(n)",
    space: "O(k)",
    explanation: "The scan visits n input values once. The lookup stores k entries, where k is the number of distinct values and can range from 1 through n. Reversible studio snapshots are separate visualization history."
  },
  guide: {
    heading: "Reuse the count already earned."
  },
  legend: [
    { kind: "read", label: "current input" },
    { kind: "counted", label: "counted state" },
    { kind: "updated", label: "updated count" }
  ],
  reflection: {
    eyebrow: "BEFORE YOU MOVE ON",
    title: "Why can k be smaller than n?",
    body: "Try all duplicates, all distinct values, and a mixture. Explain why repeated values increase stored counts without increasing the number of lookup entries."
  }
};
