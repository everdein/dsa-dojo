import {
  maximumTopKFrequentValues,
  topKFrequent
} from "../../../heaps-and-priority-queues/top-k-frequent.mjs";
import { formatNumber, parseNumberList, parsePositiveInteger } from "../input.mjs";
import { buildTopKFrequentTrace } from "../top-k-frequent.mjs";

export const topKFrequentLesson = {
  id: "heaps-and-priority-queues/top-k-frequent",
  order: 32,
  topic: "Heaps and Priority Queues",
  prerequisites: ["arrays/frequency-count", "heaps-and-priority-queues/heap-operations"],
  patterns: ["frequency-counting", "top-k", "heap"],
  catalogLabel: "Top K Frequent Elements",
  catalogDescription: "Compose a frequency map with a bounded min-heap.",
  title: "Select the top k frequent values",
  summary: "Count each distinct value, then keep only k frequency candidates in a min-heap whose root is always the weakest survivor.",
  views: [
    { id: "counts", renderer: "lookup", heading: "Frequency map" },
    { id: "heap", renderer: "branching", heading: "Bounded min-heap" }
  ],
  input: {
    fields: [
      {
        id: "values",
        label: `Enter 1-${maximumTopKFrequentValues} finite numbers`,
        type: "text",
        inputMode: "decimal",
        placeholder: "1, 1, 1, 2, 2, 3"
      },
      {
        id: "k",
        label: "How many frequent values?",
        type: "number",
        inputMode: "numeric",
        min: 1,
        max: maximumTopKFrequentValues,
        placeholder: "2"
      }
    ],
    help: "k cannot exceed the number of distinct values. Frequency ties preserve first appearance order.",
    defaultValue: { values: [1, 1, 1, 2, 2, 3], k: 2 },
    sampleValue: { values: [-2, 4, -2, 4, 7, 4], k: 2 },
    parse: (fields) => {
      const values = parseNumberList(fields.values, { maximumLength: maximumTopKFrequentValues });
      const distinct = new Set(values.map((value) => Object.is(value, -0) ? 0 : value));
      const k = parsePositiveInteger(fields.k, { maximum: distinct.size });
      return { values, k };
    },
    serialize: ({ values, k }) => ({ values: values.join(", "), k: String(k) })
  },
  solve: ({ values, k }) => topKFrequent(values, k),
  buildTrace: buildTopKFrequentTrace,
  code: {
    title: "Keep only k frequency candidates",
    filename: "top-k-frequent.mjs",
    sourcePath: "heaps-and-priority-queues/top-k-frequent.mjs",
    lines: [
      { number: 22, text: "export function topKFrequent(values, k) {", steps: ["initialize-counts"] },
      { number: 23, text: "  validateTopKFrequentInput(values, k);", steps: ["initialize-counts"] },
      { number: 24, text: "  const entries = frequencyEntries(values);", steps: ["count-values"] },
      { number: 25, text: "  const heap = [];", steps: ["offer-entry"] },
      { number: 26, text: "  for (const entry of entries) {", steps: ["offer-entry"] },
      { number: 27, text: "    heap.push(entry);", steps: ["offer-entry"] },
      { number: 28, text: "    siftUp(heap, heap.length - 1);", steps: ["sift-up"] },
      { number: 29, text: "    if (heap.length > k) removeMinimum(heap);", steps: ["trim-heap", "sift-down"] },
      { number: 30, text: "  }", steps: ["offer-entry"] },
      { number: 31, text: "  return [...heap]", steps: ["return"] },
      { number: 32, text: "    .sort((left, right) => right.count - left.count || left.firstIndex - right.firstIndex)", steps: ["return"] },
      { number: 33, text: "    .map(({ value }) => value);", steps: ["return"] },
      { number: 34, text: "}", steps: ["return"] }
    ]
  },
  stats: [
    {
      label: "Distinct values",
      value: (step) => String(step.distinctCount),
      detail: () => "frequency candidates"
    },
    {
      label: "Heap size",
      value: (step) => `${step.heapSize} / ${step.k}`,
      detail: () => "bounded candidate set"
    },
    {
      label: "Current candidate",
      value: (step) => step.currentValue === null ? "-" : formatNumber(step.currentValue),
      detail: (step) => step.currentCount === null ? "not selected" : `frequency ${step.currentCount}`
    },
    {
      label: "Result size",
      accent: true,
      value: (step) => String(step.selectedValues.length),
      detail: () => "ordered after selection"
    }
  ],
  complexity: {
    chip: "MAP + BOUNDED HEAP",
    time: "O(n + d log k)",
    space: "O(d + k)",
    explanation: "Counting n inputs takes linear time. Each of d distinct frequency entries enters a heap of at most k items, costing O(log k)."
  },
  guide: {
    heading: "Keep the weakest winner at the root."
  },
  legend: [
    { kind: "counted", label: "frequency known" },
    { kind: "minimum", label: "weakest candidate" },
    { kind: "result", label: "top-k survivor" }
  ],
  reflection: {
    eyebrow: "BEFORE YOU MOVE ON",
    title: "Why use a min-heap for the largest frequencies?",
    body: "The root is the easiest item to remove. Explain why keeping the weakest current winner at that position lets a new stronger candidate replace it in logarithmic time."
  }
};
