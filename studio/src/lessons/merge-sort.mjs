import {
  maximumMergeSortValues,
  mergeSort
} from "../../../sorting/merge-sort.mjs";
import { parseNumberList } from "../input.mjs";
import { buildMergeSortTrace } from "../merge-sort.mjs";

export const mergeSortLesson = {
  id: "sorting/merge-sort",
  order: 44,
  topic: "Sorting",
  prerequisites: ["arrays/reverse-array", "recursion/factorial"],
  patterns: ["sorting", "divide-and-conquer", "merge"],
  catalogLabel: "Merge Sort",
  catalogDescription: "Divide into singleton ranges, then merge sorted halves.",
  title: "Sort by dividing and merging",
  summary: "Build a recursion tree of smaller ranges. On the way back up, merge two sorted buffers into one larger sorted range.",
  views: [
    { id: "values", renderer: "array", heading: "Working array" },
    { id: "calls", renderer: "branching", heading: "Recursive ranges" }
  ],
  input: {
    fields: [{ id: "values", label: `Enter 1-${maximumMergeSortValues} finite numbers`, type: "text", inputMode: "decimal", placeholder: "8, 3, 5, 4, 7, 6, 1, 2" }],
    help: "At most eight values keep the complete divide-and-conquer tree visible.",
    defaultValue: { values: [8, 3, 5, 4, 7, 6, 1, 2] },
    sampleValue: { values: [5, 1, 4, 2, 3] },
    parse: ({ values }) => ({ values: parseNumberList(values, { maximumLength: maximumMergeSortValues }) }),
    serialize: ({ values }) => ({ values: values.join(", ") })
  },
  solve: ({ values }) => mergeSort(values),
  buildTrace: ({ values }) => buildMergeSortTrace(values),
  code: {
    title: "Sort halves before merging them",
    filename: "merge-sort.mjs",
    sourcePath: "sorting/merge-sort.mjs",
    lines: [
      { number: 27, text: "export function mergeSort(values) {", steps: ["check-base"] },
      { number: 29, text: "  if (values.length === 1) return [...values];", steps: ["return-singleton"] },
      { number: 30, text: "  const middle = Math.floor(values.length / 2);", steps: ["split"] },
      { number: 31, text: "  return mergeSortedValues(", steps: ["copy-halves", "return-merged"] },
      { number: 32, text: "    mergeSort(values.slice(0, middle)),", steps: ["recurse-left"] },
      { number: 33, text: "    mergeSort(values.slice(middle))", steps: ["recurse-right"] },
      { number: 34, text: "  );", steps: ["return-merged"] },
      { number: 19, text: "  while (leftIndex < left.length && rightIndex < right.length) {", steps: ["compare-fronts"] },
      { number: 20, text: "    if (left[leftIndex] <= right[rightIndex]) merged.push(left[leftIndex++]);", steps: ["write-left"] },
      { number: 21, text: "    else merged.push(right[rightIndex++]);", steps: ["write-right"] }
    ]
  },
  stats: [
    { label: "Splits", value: (step) => String(step.splits), detail: () => "non-leaf calls" },
    { label: "Merges", value: (step) => String(step.merges), detail: () => "completed ranges" },
    { label: "Comparisons", value: (step) => String(step.comparisons), detail: () => "buffer fronts" },
    { label: "Writes", accent: true, value: (step) => String(step.writes), detail: () => "merge output" }
  ],
  complexity: {
    chip: "DIVIDE AND MERGE",
    time: "O(n log n)",
    space: "O(n)",
    spaceLabel: "auxiliary space",
    explanation: "There are logarithmically many divide levels, and merging touches every value once per level. Temporary merge buffers use linear auxiliary space."
  },
  guide: { heading: "Every merge receives two already-sorted ranges." },
  legend: [
    { kind: "candidate", label: "active range" },
    { kind: "current", label: "active recursive call" },
    { kind: "merged", label: "sorted range" },
    { kind: "changed", label: "newly written value" }
  ],
  reflection: {
    eyebrow: "BEFORE YOU MOVE ON",
    title: "Why is each merge linear?",
    body: "Explain why only the two buffer fronts need comparison and why every value is written exactly once at each level of the recursion tree."
  }
};
