import {
  maximumQuickSortValues,
  quickSort
} from "../../../sorting/quick-sort.mjs";
import { formatNumber, parseNumberList } from "../input.mjs";
import { buildQuickSortTrace } from "../quick-sort.mjs";

export const quickSortLesson = {
  id: "sorting/quick-sort",
  order: 45,
  topic: "Sorting",
  prerequisites: ["arrays/reverse-array", "recursion/factorial"],
  patterns: ["sorting", "partition", "divide-and-conquer"],
  catalogLabel: "Quick Sort",
  catalogDescription: "Maintain a partition invariant around a pivot and understand worst-case input.",
  title: "Partition around a pivot, then recurse",
  summary: "Scan each subrange once, keeping values at or below its pivot to the left and larger values to the right. Once the pivot reaches its final position, sort the independent sides recursively.",
  views: [
    { id: "values", renderer: "array", heading: "Working array" },
    { id: "calls", renderer: "branching", heading: "Recursive subranges" }
  ],
  input: {
    fields: [{
      id: "values",
      label: `Enter 1-${maximumQuickSortValues} finite numbers`,
      type: "text",
      inputMode: "decimal",
      placeholder: "8, 3, 1, 7, 0, 10, 2"
    }],
    help: "This lesson always chooses the final value in a subrange as its pivot. Try already sorted input to expose that rule's one-sided worst case.",
    defaultValue: { values: [8, 3, 1, 7, 0, 10, 2] },
    sampleValue: { values: [1, 3, 2, 6, 5, 7, 4] },
    parse: ({ values }) => ({
      values: parseNumberList(values, { maximumLength: maximumQuickSortValues })
    }),
    serialize: ({ values }) => ({
      values: values.map(formatNumber).join(", ")
    })
  },
  solve: ({ values }) => quickSort(values),
  buildTrace: ({ values }) => buildQuickSortTrace(values),
  code: {
    title: "Partition each range around its final value",
    filename: "quick-sort.mjs",
    sourcePath: "sorting/quick-sort.mjs",
    lines: [
      { number: 21, text: "export function quickSort(values) {", steps: ["initialize"] },
      { number: 23, text: "  const sorted = [...values];", steps: ["initialize"] },
      { number: 25, text: "  const sortRange = (start, end) => {", steps: ["check-base"] },
      { number: 26, text: "    if (start >= end) return;", steps: ["return-range"] },
      { number: 27, text: "    const pivotIndex = partitionQuickSortRange(sorted, start, end);", steps: ["choose-pivot", "place-pivot"] },
      { number: 28, text: "    sortRange(start, pivotIndex - 1);", steps: ["recurse-left"] },
      { number: 29, text: "    sortRange(pivotIndex + 1, end);", steps: ["recurse-right"] },
      { number: 33, text: "  return sorted;", steps: ["return"] },
      { number: 38, text: "  const pivot = values[end];", steps: ["choose-pivot"] },
      { number: 39, text: "  let boundary = start;", steps: ["choose-pivot"] },
      { number: 41, text: "  for (let scan = start; scan < end; scan += 1) {", steps: ["scan-value"] },
      { number: 42, text: "    if (values[scan] > pivot) continue;", steps: ["leave-right"] },
      { number: 43, text: "    if (scan !== boundary) swap(values, scan, boundary);", steps: ["accept-left", "swap-left"] },
      { number: 44, text: "    boundary += 1;", steps: ["accept-left"] },
      { number: 46, text: "  if (boundary !== end) swap(values, boundary, end);", steps: ["place-pivot"] }
    ]
  },
  stats: [
    {
      label: "Active range",
      value: (step) => `${step.activeStart}-${step.activeEnd}`,
      detail: (step) => `depth ${step.currentDepth}`
    },
    {
      label: "Pivot",
      value: (step) => step.pivotValue === null ? "-" : formatNumber(step.pivotValue),
      detail: (step) => step.pivotIndex === null ? "not selected" : `index ${step.pivotIndex}`
    },
    {
      label: "Comparisons",
      value: (step) => String(step.comparisons),
      detail: (step) => `${step.partitions} completed ${step.partitions === 1 ? "partition" : "partitions"}`
    },
    {
      label: "Swaps",
      accent: true,
      value: (step) => String(step.swaps),
      detail: (step) => `maximum depth ${step.maximumDepth}`
    }
  ],
  complexity: {
    chip: "PARTITION AND RECURSE",
    time: "O(n log n) average",
    space: "O(log n) average",
    spaceLabel: "call-stack space",
    explanation: "A balanced or typical partition tree has O(log n) levels and O(n) partition work per level, so best and average time are O(n log n). With this deterministic final-value pivot, sorted, reverse-sorted, or all-equal input creates one-sided ranges: O(n^2) time and O(n) call-stack space in the worst case."
  },
  guide: {
    heading: "Before every scan, the left region is <= the pivot and the middle region is > the pivot."
  },
  legend: [
    { kind: "pivot", label: "chosen pivot" },
    { kind: "left-partition", label: "values <= pivot" },
    { kind: "right-partition", label: "values > pivot" },
    { kind: "settled", label: "final sorted position" }
  ],
  reflection: {
    eyebrow: "BEFORE YOU MOVE ON",
    title: "When does the final-value pivot become a liability?",
    body: "Compare the balanced sample with already sorted input. Explain why one makes two smaller recursive problems while the other repeatedly removes only one pivot, and how randomized or median-informed pivot selection changes that risk."
  }
};
