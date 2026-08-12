import {
  bubbleSort,
  maximumBubbleSortValues
} from "../../../sorting/bubble-sort.mjs";
import { parseNumberList } from "../input.mjs";
import { buildBubbleSortTrace } from "../bubble-sort.mjs";

export const bubbleSortLesson = {
  id: "sorting/bubble-sort",
  order: 40,
  topic: "Sorting",
  prerequisites: ["arrays/reverse-array"],
  patterns: ["sorting", "adjacent-swap", "invariant"],
  catalogLabel: "Bubble Sort",
  catalogDescription: "Grow a settled suffix with adjacent comparisons and swaps.",
  title: "Sort by bubbling large values right",
  summary: "Compare adjacent values, swap inversions, and let each pass settle one largest remaining value at the end.",
  renderer: "array",
  input: {
    fields: [{ id: "values", label: `Enter 1-${maximumBubbleSortValues} finite numbers`, type: "text", inputMode: "decimal", placeholder: "5, 1, 4, 2, 8" }],
    help: "Try a sorted input to see the early-exit best case, or reverse the values for the most swaps.",
    defaultValue: { values: [5, 1, 4, 2, 8] },
    sampleValue: { values: [1, 2, 3, 4, 5] },
    parse: ({ values }) => ({ values: parseNumberList(values, { maximumLength: maximumBubbleSortValues }) }),
    serialize: ({ values }) => ({ values: values.join(", ") })
  },
  solve: ({ values }) => bubbleSort(values),
  buildTrace: ({ values }) => buildBubbleSortTrace(values),
  code: {
    title: "Settle one suffix position per pass",
    filename: "bubble-sort.mjs",
    sourcePath: "sorting/bubble-sort.mjs",
    lines: [
      { number: 15, text: "export function bubbleSort(values) {", steps: ["copy"] },
      { number: 17, text: "  const sorted = [...values];", steps: ["copy"] },
      { number: 18, text: "  for (let end = sorted.length - 1; end > 0; end -= 1) {", steps: ["outer-loop"] },
      { number: 19, text: "    let swapped = false;", steps: ["outer-loop"] },
      { number: 20, text: "    for (let index = 0; index < end; index += 1) {", steps: ["inner-loop"] },
      { number: 21, text: "      if (sorted[index] <= sorted[index + 1]) continue;", steps: ["compare"] },
      { number: 22, text: "      [sorted[index], sorted[index + 1]] = [sorted[index + 1], sorted[index]];", steps: ["swap"] },
      { number: 23, text: "      swapped = true;", steps: ["swap"] },
      { number: 10, text: "    }", steps: ["finish-pass"] },
      { number: 25, text: "    if (!swapped) break;", steps: ["finish-pass"] },
      { number: 6, text: "  }", steps: ["outer-loop"] },
      { number: 27, text: "  return sorted;", steps: ["return"] },
      { number: 13, text: "}", steps: ["return"] }
    ]
  },
  stats: [
    { label: "Comparisons", value: (step) => String(step.comparisons), detail: () => "adjacent pairs" },
    { label: "Swaps", value: (step) => String(step.swaps), detail: () => "inversions corrected" },
    { label: "Settled", accent: true, value: (step) => String(step.settledCount), detail: () => "rightmost positions" }
  ],
  complexity: {
    chip: "ADJACENT SWAPS",
    time: "O(n²)",
    space: "O(n)",
    spaceLabel: "total space",
    explanation: "Nested passes take quadratic time in the worst case, while a swap-free first pass gives O(n) best-case time. The returned copy preserves the input."
  },
  guide: { heading: "Watch the sorted suffix grow." },
  legend: [
    { kind: "left", label: "left neighbor" },
    { kind: "right", label: "right neighbor" },
    { kind: "changed", label: "swapped now" },
    { kind: "settled", label: "sorted suffix" }
  ],
  reflection: {
    eyebrow: "BEFORE YOU MOVE ON",
    title: "Why can the inner loop stop earlier each pass?",
    body: "After one full pass, the largest remaining value is at the end. Explain why later passes never need to compare that settled suffix again."
  }
};
