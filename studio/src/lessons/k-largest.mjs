import {
  kLargest,
  maximumKLargestValues,
  validateKLargestInput
} from "../../../heaps-and-priority-queues/k-largest.mjs";
import { formatNumber, parseNumberList, parsePositiveInteger } from "../input.mjs";
import { buildKLargestTrace } from "../k-largest.mjs";

export const kLargestLesson = {
  id: "heaps-and-priority-queues/k-largest",
  order: 31,
  topic: "Heaps and Priority Queues",
  prerequisites: ["heaps-and-priority-queues/heap-operations"],
  patterns: ["heap", "top-k", "bounded-candidates"],
  catalogLabel: "K Largest Elements",
  catalogDescription: "Keep only the best k candidates in a bounded min-heap.",
  title: "Find the k largest elements",
  summary: "Keep a min-heap with capacity k. Once full, its root is the smallest kept candidate, so an incoming value needs only one threshold comparison.",
  views: [
    { id: "values", renderer: "array", heading: "Input values" },
    { id: "heap", renderer: "array", heading: "Heap backing array" },
    { id: "tree", renderer: "branching", heading: "Min-heap tree" }
  ],
  input: {
    fields: [
      {
        id: "values",
        label: `Enter 1-${maximumKLargestValues} finite numbers`,
        type: "text",
        inputMode: "decimal",
        placeholder: "3, 2, 1, 5, 6, 4"
      },
      {
        id: "k",
        label: "How many largest values?",
        type: "number",
        inputMode: "numeric",
        min: 1
      }
    ],
    help: "K must be a positive whole number no larger than the input length. Duplicate values remain separate candidates.",
    defaultValue: { values: [3, 2, 1, 5, 6, 4], k: 2 },
    sampleValue: { values: [-4, 8, 2, 8, -1, 5], k: 3 },
    parse: (fields) => {
      const values = parseNumberList(fields.values, { maximumLength: maximumKLargestValues });
      const k = parsePositiveInteger(fields.k, "K");
      validateKLargestInput(values, k);
      return { values, k };
    },
    serialize: ({ values, k }) => ({
      values: values.map(formatNumber).join(", "),
      k: String(k)
    })
  },
  solve: ({ values, k }) => kLargest(values, k),
  buildTrace: (input) => buildKLargestTrace(input),
  code: {
    title: "Keep a bounded min-heap of winners",
    filename: "k-largest.mjs",
    sourcePath: "heaps-and-priority-queues/k-largest.mjs",
    lines: [
      { number: 32, text: "export function kLargest(values, k) {", steps: ["function"] },
      { number: 33, text: "  validateKLargestInput(values, k);", steps: ["initialize"] },
      { number: 35, text: "  const heap = [];", steps: ["initialize"] },
      { number: 36, text: "  for (const value of values) {", steps: ["read-value"] },
      { number: 37, text: "    if (heap.length < k) {", steps: ["accept-under-capacity"] },
      { number: 38, text: "      heap.push(value);", steps: ["accept-under-capacity"] },
      { number: 39, text: "      siftUpMinHeap(heap, heap.length - 1);", steps: ["sift-up"] },
      { number: 42, text: "    if (value <= heap[0]) continue;", steps: ["reject"] },
      { number: 44, text: "    heap[0] = value;", steps: ["replace-minimum"] },
      { number: 45, text: "    siftDownMinHeap(heap, 0);", steps: ["sift-down"] },
      { number: 48, text: "  return [...heap].sort(descendingNumberOrder);", steps: ["return"] },
      { number: 49, text: "}", steps: ["function"] }
    ]
  },
  stats: [
    {
      label: "Current value",
      value: (step) => step.currentValue === null ? "-" : formatNumber(step.currentValue)
    },
    {
      label: "Heap capacity",
      value: (step) => `${step.heapSize} / ${step.k}`,
      detail: (step) => `${step.capacityRemaining} open`
    },
    {
      label: "Minimum kept",
      value: (step) => formatNumber(step.minimumKept),
      detail: () => "root threshold"
    },
    {
      label: "Current top k",
      accent: true,
      value: (step) => `[${step.currentTopK.map(formatNumber).join(", ")}]`,
      detail: () => "displayed descending"
    }
  ],
  complexity: {
    chip: "BOUND THE CANDIDATES",
    time: "O(n log k)",
    space: "O(k)",
    explanation: "Each of n values makes one root comparison. An accepted value may restore heap order across at most log k levels, while rejected values take constant time. The heap never stores more than k candidates; sorting those k output values costs O(k log k)."
  },
  guide: {
    heading: "The root is the admission threshold."
  },
  legend: [
    { kind: "incoming", label: "incoming input" },
    { kind: "accepted", label: "accepted candidate" },
    { kind: "rejected", label: "rejected candidate" },
    { kind: "minimum", label: "smallest kept" },
    { kind: "active", label: "sifting slots" }
  ],
  reflection: {
    eyebrow: "BEFORE YOU MOVE ON",
    title: "Why is a min-heap useful for finding largest values?",
    body: "Try k equal to one, k equal to the full input length, negative values, and duplicates. Explain why the smallest kept candidate is exactly the one a better incoming value should replace."
  }
};
