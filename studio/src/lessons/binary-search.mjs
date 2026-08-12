import {
  binarySearch,
  maximumBinarySearchValues
} from "../../../searching/binary-search.mjs";
import { formatNumber, parseNumberList } from "../input.mjs";
import { buildBinarySearchTrace } from "../binary-search.mjs";

export const binarySearchLesson = {
  id: "searching/binary-search",
  order: 24,
  topic: "Searching",
  prerequisites: ["arrays/find-largest"],
  patterns: ["binary-search", "divide-and-conquer"],
  catalogLabel: "Binary Search",
  catalogDescription: "Halve a sorted candidate range after each comparison.",
  title: "Search a sorted array by halving",
  summary: "Compare the target with the midpoint. Sorted order proves which half can be discarded while preserving every possible answer.",
  renderer: "array",
  input: {
    fields: [
      {
        id: "values",
        label: `Enter 1-${maximumBinarySearchValues} sorted finite numbers`,
        type: "text",
        inputMode: "decimal",
        placeholder: "-4, 1, 3, 7, 9, 12"
      },
      {
        id: "target",
        label: "Target",
        type: "number",
        inputMode: "decimal",
        placeholder: "7"
      }
    ],
    help: "Values must be in nondecreasing order. Duplicates are allowed; this version returns the first match it probes.",
    defaultValue: { values: [-4, 1, 3, 7, 9, 12], target: 7 },
    sampleValue: { values: [1, 3, 5, 7, 9], target: 6 },
    parse: (fields) => {
      const values = parseNumberList(fields.values, { maximumLength: maximumBinarySearchValues });
      const targetSource = String(fields.target ?? "").trim();
      const target = Number(targetSource);
      if (targetSource === "" || !Number.isFinite(target)) throw new Error("Target must be a finite number.");
      for (let index = 1; index < values.length; index += 1) {
        if (values[index] < values[index - 1]) throw new Error("Values must be sorted in nondecreasing order.");
      }
      return { values, target };
    },
    serialize: ({ values, target }) => ({ values: values.join(", "), target: formatNumber(target) })
  },
  solve: ({ values, target }) => binarySearch(values, target),
  buildTrace: buildBinarySearchTrace,
  code: {
    title: "Preserve the candidate range",
    filename: "binary-search.mjs",
    sourcePath: "searching/binary-search.mjs",
    lines: [
      { number: 18, text: "export function binarySearch(values, target) {", steps: ["function"] },
      { number: 19, text: "  validateBinarySearchInput(values, target);", steps: ["initialize"] },
      { number: 20, text: "  let left = 0;", steps: ["initialize"] },
      { number: 21, text: "  let right = values.length - 1;", steps: ["initialize"] },
      { number: 22, text: "  while (left <= right) {", steps: ["loop"] },
      { number: 23, text: "    const middle = left + Math.floor((right - left) / 2);", steps: ["middle"] },
      { number: 24, text: "    if (values[middle] === target) return middle;", steps: ["compare", "return-found"] },
      { number: 25, text: "    if (values[middle] < target) left = middle + 1;", steps: ["compare", "move-left"] },
      { number: 26, text: "    else right = middle - 1;", steps: ["compare", "move-right"] },
      { number: 27, text: "  }", steps: ["loop"] },
      { number: 28, text: "  return -1;", steps: ["return-missing"] },
      { number: 29, text: "}", steps: ["function"] }
    ]
  },
  stats: [
    {
      label: "Candidate range",
      value: (step) => String(step.candidateCount),
      detail: (step) => step.candidateCount ? `${step.leftIndex} through ${step.rightIndex}` : "empty"
    },
    {
      label: "Midpoint",
      value: (step) => step.middleIndex === null ? "-" : String(step.middleIndex),
      detail: (step) => step.middleIndex === null ? "not chosen" : `value ${formatNumber(step.view.values[step.middleIndex])}`
    },
    {
      label: "Comparisons",
      value: (step) => String(step.comparisons),
      detail: () => "one per midpoint"
    },
    {
      label: "Result",
      accent: true,
      value: (step) => step.foundIndex === -1 ? (step.phase === "complete" ? "not found" : "searching") : `index ${step.foundIndex}`,
      detail: (step) => `target ${formatNumber(step.target)}`
    }
  ],
  complexity: {
    chip: "HALVE THE RANGE",
    time: "O(log n)",
    space: "O(1)",
    explanation: "Every comparison removes about half of the remaining sorted candidates. The iterative version stores only three indices."
  },
  guide: {
    heading: "Discard only what sorted order disproves."
  },
  legend: [
    { kind: "candidate", label: "possible range" },
    { kind: "middle", label: "midpoint" },
    { kind: "result", label: "found target" }
  ],
  reflection: {
    eyebrow: "BEFORE YOU MOVE ON",
    title: "What invariant survives every discarded half?",
    body: "State why any target that exists must remain between left and right. Then explain why the same reasoning fails on an unsorted array."
  }
};
