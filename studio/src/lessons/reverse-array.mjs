import { reverseArray } from "../../../arrays/reverse-array.mjs";
import { formatNumber, parseNumberList } from "../input.mjs";
import { buildReverseArrayTrace } from "../reverse-array.mjs";

export const reverseArrayLesson = {
  id: "arrays/reverse-array",
  order: 3,
  topic: "Arrays",
  prerequisites: ["arrays/find-largest"],
  patterns: ["two-pointers"],
  catalogLabel: "Reverse Array",
  catalogDescription: "Swap mirrored values with two inward-moving pointers.",
  title: "Reverse an array in pairs",
  summary: "Start at both ends. Swap mirrored values, then move inward until the pointers meet.",
  renderer: "array",
  input: {
    fields: [{
      id: "values",
      label: "Enter 1-12 finite numbers",
      type: "text",
      inputMode: "decimal",
      placeholder: "2, 1, 4, 3, 5"
    }],
    help: "Try an odd-length array, repeated values, or a single value to test the stopping rule.",
    defaultValue: { values: [2, 1, 4, 3, 5] },
    sampleValue: { values: [-3, 7, 7, 2] },
    parse: (fields) => ({ values: parseNumberList(fields.values) }),
    serialize: ({ values }) => ({ values: values.join(", ") })
  },
  solve: ({ values }) => reverseArray(values),
  buildTrace: ({ values }) => buildReverseArrayTrace(values),
  code: {
    title: "Swap mirrored pairs",
    filename: "reverse-array.mjs",
    sourcePath: "arrays/reverse-array.mjs",
    lines: [
      { number: 15, text: "export function reverseArray(values) {", steps: ["function"] },
      { number: 16, text: "  validateReverseArrayInput(values);", steps: ["initialize"] },
      { number: 18, text: "  const reversed = [...values];", steps: ["initialize"] },
      { number: 19, text: "  let left = 0;", steps: ["initialize"] },
      { number: 20, text: "  let right = reversed.length - 1;", steps: ["initialize"] },
      { number: 22, text: "  while (left < right) {", steps: ["check-pointers"] },
      { number: 23, text: "    const leftValue = reversed[left];", steps: ["swap-values"] },
      { number: 24, text: "    reversed[left] = reversed[right];", steps: ["swap-values"] },
      { number: 25, text: "    reversed[right] = leftValue;", steps: ["swap-values"] },
      { number: 26, text: "    left += 1;", steps: ["move-pointers"] },
      { number: 27, text: "    right -= 1;", steps: ["move-pointers"] },
      { number: 28, text: "  }", steps: ["check-pointers"] },
      { number: 30, text: "  return reversed;", steps: ["return"] },
      { number: 31, text: "}", steps: ["function"] }
    ]
  },
  stats: [
    {
      label: "Left pointer",
      value: (step) => step.phase === "complete" ? "-" : String(step.leftIndex),
      detail: (step) => pointerDetail(step, step.leftIndex)
    },
    {
      label: "Right pointer",
      value: (step) => step.phase === "complete" ? "-" : String(step.rightIndex),
      detail: (step) => pointerDetail(step, step.rightIndex)
    },
    {
      label: "Swaps",
      accent: true,
      value: (step) => `${step.swapCount} / ${step.requiredSwaps}`,
      detail: () => "each swap settles two positions"
    }
  ],
  complexity: {
    chip: "TWO POINTERS",
    time: "O(n)",
    space: "O(n)",
    spaceLabel: "total space",
    explanation: "The returned copy occupies O(n) space because this public function preserves the caller's input. Beyond that required output, the pointer-and-swap work uses O(1) auxiliary space."
  },
  guide: {
    heading: "Work from both ends."
  },
  legend: [
    { kind: "left", label: "left pointer" },
    { kind: "right", label: "right pointer" },
    { kind: "active", label: "current pair" },
    { kind: "changed", label: "swapped now" },
    { kind: "settled", label: "settled position" }
  ],
  reflection: {
    eyebrow: "BEFORE YOU MOVE ON",
    title: "Why do we stop when the pointers meet?",
    body: "Try one value, two values, and repeated values. Explain why each swap fixes two positions and why Math.floor(n / 2) swaps are enough."
  }
};

function pointerDetail(step, index) {
  if (step.phase === "complete") return "all positions settled";
  if (step.leftIndex > step.rightIndex) return "pointers crossed";
  if (!Number.isInteger(index) || index < 0 || index >= step.view.values.length) return "outside the array";
  return `value ${formatNumber(step.view.values[index])}`;
}
