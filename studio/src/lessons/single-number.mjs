import {
  maximumBitValue,
  maximumSingleNumberValues,
  singleNumber
} from "../../../bit-manipulation/single-number.mjs";
import { parseNumberList } from "../input.mjs";
import { buildSingleNumberTrace } from "../single-number.mjs";

export const singleNumberLesson = {
  id: "bit-manipulation/single-number",
  order: 55,
  topic: "Bit Manipulation",
  prerequisites: ["bit-manipulation/parity"],
  patterns: ["bit-manipulation", "xor", "cancellation"],
  catalogLabel: "Find the Unique Value with XOR",
  catalogDescription: "Cancel equal pairs in any order to isolate one unique value.",
  title: "Find the unique value with XOR",
  summary: "XOR is associative and commutative, x XOR x is zero, and zero is the identity. Fold every value into one accumulator so duplicate pairs disappear regardless of position.",
  views: [
    { id: "values", renderer: "array", heading: "Input values" },
    { id: "accumulator", renderer: "array", heading: "XOR accumulator bits" }
  ],
  input: {
    fields: [{ id: "values", label: `Enter 1-${maximumSingleNumberValues} byte values (one single, all others paired)`, type: "text", inputMode: "numeric", placeholder: "4, 1, 2, 1, 2" }],
    help: `Use whole numbers from 0 to ${maximumBitValue}. Exactly one value must occur once; every other value must occur twice.`,
    defaultValue: { values: [4, 1, 2, 1, 2] },
    sampleValue: { values: [7, 3, 5, 3, 5, 9, 9] },
    parse: ({ values }) => ({ values: parseNumberList(values, { maximumLength: maximumSingleNumberValues }) }),
    serialize: ({ values }) => ({ values: values.join(", ") })
  },
  solve: ({ values }) => singleNumber(values),
  buildTrace: ({ values }) => buildSingleNumberTrace(values),
  code: {
    title: "Fold values with XOR cancellation",
    filename: "single-number.mjs",
    sourcePath: "bit-manipulation/single-number.mjs",
    lines: [
      { number: 26, text: "export function singleNumber(values) {", steps: ["initialize"] },
      { number: 27, text: "  validateSingleNumberInput(values);", steps: ["initialize"] },
      { number: 28, text: "  return values.reduce(", steps: ["loop"] },
      { number: 28, text: "    (accumulator, value) => accumulator ^ value,", steps: ["xor-accumulator"] },
      { number: 28, text: "    0", steps: ["return"] },
      { number: 28, text: "  );", steps: ["return"] }
    ]
  },
  stats: [
    { label: "Index", value: (step) => step.index === null ? "-" : String(step.index) },
    { label: "Current value", value: (step) => step.currentValue === null ? "-" : String(step.currentValue) },
    { label: "Pairs canceled", value: (step) => String(step.cancellations) },
    { label: "Accumulator", accent: true, value: (step) => String(step.accumulator) }
  ],
  complexity: {
    chip: "XOR CANCELLATION",
    time: "O(n)",
    space: "O(1)",
    explanation: "Every input value participates in one constant-width XOR. The accumulator is the only algorithmic storage, and duplicate values cancel without a set or frequency map."
  },
  guide: { heading: "Associativity lets equal values meet conceptually." },
  legend: [
    { kind: "current", label: "next operand" },
    { kind: "candidate", label: "accumulator bits" },
    { kind: "changed", label: "toggled bit" }
  ],
  reflection: {
    eyebrow: "COURSE COMPLETE",
    title: "Which XOR laws do the work?",
    body: "Name identity, self-cancellation, associativity, and commutativity. Explain why those laws remove every duplicate pair and leave exactly the unpaired value."
  }
};
