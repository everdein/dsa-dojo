import { findPairSum } from "../../../arrays/pair-sum.mjs";
import { formatNumber, parseNumberList } from "../input.mjs";
import { buildPairSumTrace } from "../pair-sum.mjs";

export const pairSumLesson = {
  id: "arrays/pair-sum",
  order: 9,
  topic: "Arrays",
  prerequisites: ["arrays/find-largest"],
  patterns: ["lookup"],
  catalogLabel: "Pair Sum",
  catalogDescription: "Remember earlier values so each complement takes one lookup.",
  title: "Find two values that reach a target",
  summary: "Scan left to right. For each value, look for the complement among earlier values, then remember the current value if no pair exists yet.",
  views: [
    { id: "values", renderer: "array", heading: "Input values" },
    { id: "seen", renderer: "lookup", heading: "Seen value → earliest index" }
  ],
  input: {
    fields: [
      {
        id: "values",
        label: "Enter 2–12 finite numbers",
        type: "text",
        inputMode: "decimal",
        placeholder: "2, 7, 11, 15"
      },
      {
        id: "target",
        label: "Target sum",
        type: "number",
        inputMode: "decimal",
        placeholder: "9"
      }
    ],
    help: "Duplicates and negative values are valid. The answer always uses two different indices.",
    defaultValue: { values: [2, 7, 11, 15], target: 9 },
    sampleValue: { values: [3, 3, -2, 8], target: 6 },
    parse: (fields) => {
      const values = parseNumberList(fields.values);
      if (values.length < 2) throw new Error("Enter at least two values for Pair Sum.");
      const target = Number(String(fields.target ?? "").trim());
      if (String(fields.target ?? "").trim() === "" || !Number.isFinite(target)) {
        throw new Error("Target sum must be a finite number.");
      }
      return { values, target };
    },
    serialize: ({ values, target }) => ({
      values: values.join(", "),
      target: formatNumber(target)
    })
  },
  solve: ({ values, target }) => findPairSum(values, target),
  buildTrace: buildPairSumTrace,
  code: {
    title: "Look backward in constant average time",
    filename: "pair-sum.mjs",
    sourcePath: "arrays/pair-sum.mjs",
    lines: [
      { number: 25, text: "export function findPairSum(values, target) {", steps: ["function"] },
      { number: 26, text: "  validatePairSumInput(values, target);", steps: ["initialize-map"] },
      { number: 27, text: "", steps: ["initialize-map"] },
      { number: 28, text: "  const earliestIndexByValue = new Map();", steps: ["initialize-map"] },
      { number: 29, text: "  for (let index = 0; index < values.length; index += 1) {", steps: ["compute-complement"] },
      { number: 30, text: "    const value = values[index];", steps: ["compute-complement"] },
      { number: 31, text: "    const complement = target - value;", steps: ["compute-complement"] },
      { number: 32, text: "", steps: ["lookup-complement"] },
      { number: 33, text: "    if (Number.isFinite(complement) && earliestIndexByValue.has(complement)) {", steps: ["lookup-complement"] },
      { number: 34, text: "      const leftIndex = earliestIndexByValue.get(complement);", steps: ["return-pair"] },
      { number: 35, text: "      return {", steps: ["return-pair"] },
      { number: 36, text: "        indices: [leftIndex, index],", steps: ["return-pair"] },
      { number: 37, text: "        values: [values[leftIndex], value]", steps: ["return-pair"] },
      { number: 38, text: "      };", steps: ["return-pair"] },
      { number: 39, text: "    }", steps: ["lookup-complement"] },
      { number: 40, text: "", steps: ["remember-value"] },
      { number: 41, text: "    if (!earliestIndexByValue.has(value)) {", steps: ["remember-value"] },
      { number: 42, text: "      earliestIndexByValue.set(value, index);", steps: ["remember-value"] },
      { number: 43, text: "    }", steps: ["remember-value"] },
      { number: 44, text: "  }", steps: ["compute-complement"] },
      { number: 45, text: "", steps: ["return-none"] },
      { number: 46, text: "  return null;", steps: ["return-none"] },
      { number: 47, text: "}", steps: ["function"] }
    ]
  },
  stats: [
    {
      label: "Current index",
      value: (step) => step.currentIndex === null ? "—" : String(step.currentIndex),
      detail: (step) => step.currentValue === null ? "scan not started" : `value ${formatNumber(step.currentValue)}`
    },
    {
      label: "Complement",
      value: (step) => step.currentIndex === null
        ? "—"
        : step.complementInRange
          ? formatNumber(step.complement)
          : "out of range",
      detail: (step) => `target ${formatNumber(step.target)}`
    },
    {
      label: "Values seen",
      value: (step) => String(step.valuesSeen),
      detail: () => "distinct lookup keys"
    },
    {
      label: "Result",
      accent: true,
      value: resultValue,
      detail: resultDetail
    }
  ],
  complexity: {
    chip: "COMPLEMENT LOOKUP",
    time: "O(n)",
    space: "O(n)",
    explanation: "Each value performs one average O(1) Map lookup and is stored at most once, replacing an O(n²) nested scan with O(n) average time. The map may hold O(n) distinct values."
  },
  guide: {
    heading: "Look before you remember."
  },
  legend: [
    { kind: "active", label: "current value" },
    { kind: "pair", label: "result pair" },
    { kind: "seen", label: "remembered value" },
    { kind: "result", label: "matching lookup entry" }
  ],
  reflection: {
    eyebrow: "BEFORE YOU MOVE ON",
    title: "Why must lookup happen before insertion?",
    body: "Try [3, 3] with target 6, a no-pair input, and repeated values. Explain how looking first guarantees two distinct indices and why preserving the earliest index makes the result deterministic."
  }
};

function resultValue(step) {
  if (step.pair) return `${step.pair.indices[0]} + ${step.pair.indices[1]}`;
  return step.phase === "complete" ? "none" : "searching";
}

function resultDetail(step) {
  if (step.pair) {
    return `${formatNumber(step.pair.values[0])} + ${formatNumber(step.pair.values[1])} = ${formatNumber(step.target)}`;
  }
  return step.phase === "complete" ? "no pair exists" : "checking complements";
}
