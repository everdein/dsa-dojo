import {
  insertionSort,
  maximumInsertionSortValues
} from "../../../sorting/insertion-sort.mjs";
import { parseNumberList } from "../input.mjs";
import { buildInsertionSortTrace } from "../insertion-sort.mjs";

export const insertionSortLesson = {
  id: "sorting/insertion-sort",
  order: 41,
  topic: "Sorting",
  prerequisites: ["sorting/bubble-sort"],
  patterns: ["sorting", "sorted-prefix", "invariant"],
  catalogLabel: "Insertion Sort",
  catalogDescription: "Grow a sorted prefix by inserting one saved key at a time.",
  title: "Sort by inserting into a prefix",
  summary: "Save the next key, shift larger prefix values right, and insert the key into the gap that restores sorted order.",
  renderer: "array",
  input: {
    fields: [{ id: "values", label: `Enter 1-${maximumInsertionSortValues} finite numbers`, type: "text", inputMode: "decimal", placeholder: "5, 2, 4, 6, 1, 3" }],
    help: "Nearly sorted values show why few shifts can make Insertion Sort efficient in practice.",
    defaultValue: { values: [5, 2, 4, 6, 1, 3] },
    sampleValue: { values: [1, 2, 4, 3, 5] },
    parse: ({ values }) => ({ values: parseNumberList(values, { maximumLength: maximumInsertionSortValues }) }),
    serialize: ({ values }) => ({ values: values.join(", ") })
  },
  solve: ({ values }) => insertionSort(values),
  buildTrace: ({ values }) => buildInsertionSortTrace(values),
  code: {
    title: "Preserve a sorted prefix",
    filename: "insertion-sort.mjs",
    sourcePath: "sorting/insertion-sort.mjs",
    lines: [
      { number: 15, text: "export function insertionSort(values) {", steps: ["copy"] },
      { number: 16, text: "  const sorted = [...values];", steps: ["copy"] },
      { number: 17, text: "  for (let index = 1; index < sorted.length; index += 1) {", steps: ["outer-loop"] },
      { number: 18, text: "    const key = sorted[index];", steps: ["save-key"] },
      { number: 19, text: "    let position = index - 1;", steps: ["save-key"] },
      { number: 20, text: "    while (position >= 0 && sorted[position] > key) {", steps: ["while-compare"] },
      { number: 21, text: "      sorted[position + 1] = sorted[position];", steps: ["shift-right"] },
      { number: 22, text: "      position -= 1;", steps: ["shift-right"] },
      { number: 23, text: "    }", steps: ["while-compare"] },
      { number: 24, text: "    sorted[position + 1] = key;", steps: ["insert-key"] },
      { number: 25, text: "  }", steps: ["outer-loop"] },
      { number: 26, text: "  return sorted;", steps: ["return"] },
      { number: 27, text: "}", steps: ["return"] }
    ]
  },
  stats: [
    { label: "Sorted prefix", value: (step) => String(step.sortedCount), detail: () => "invariant length" },
    { label: "Comparisons", value: (step) => String(step.comparisons), detail: () => "key vs prefix" },
    { label: "Shifts", accent: true, value: (step) => String(step.shifts), detail: () => "values moved right" }
  ],
  complexity: {
    chip: "SORTED PREFIX",
    time: "O(n²)",
    space: "O(n)",
    spaceLabel: "total space",
    explanation: "A reverse-sorted input shifts through the whole prefix for quadratic work; a sorted input needs only one comparison per key. The returned copy preserves input."
  },
  guide: { heading: "Save the key before opening its gap." },
  legend: [
    { kind: "settled", label: "sorted prefix" },
    { kind: "current", label: "saved key" },
    { kind: "left", label: "prefix comparison" },
    { kind: "changed", label: "shift or insert" }
  ],
  reflection: {
    eyebrow: "BEFORE YOU MOVE ON",
    title: "Why save the key before shifting?",
    body: "Shifts overwrite array positions. Explain how the saved key preserves the value that will eventually fill the gap and restore the prefix invariant."
  }
};
