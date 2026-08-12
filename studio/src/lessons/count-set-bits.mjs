import { maximumBitValue, parseBitValue } from "../../../bit-manipulation/model.mjs";
import { countSetBits } from "../../../bit-manipulation/count-set-bits.mjs";
import { buildCountSetBitsTrace } from "../count-set-bits.mjs";

export const countSetBitsLesson = {
  id: "bit-manipulation/count-set-bits",
  order: 54,
  topic: "Bit Manipulation",
  prerequisites: ["bit-manipulation/parity"],
  patterns: ["bit-manipulation", "brian-kernighan", "set-bits"],
  catalogLabel: "Count Set Bits",
  catalogDescription: "Clear the lowest one bit once per iteration.",
  title: "Count ones by clearing the lowest set bit",
  summary: "Subtracting one flips the lowest set bit and all bits below it. AND with the original clears exactly that one, so the number of loop iterations equals the number of ones.",
  renderer: "array",
  input: {
    fields: [{ id: "value", label: `Enter a whole number from 0 to ${maximumBitValue}`, type: "number", inputMode: "numeric", min: "0", max: String(maximumBitValue), step: "1" }],
    help: "Compare sparse one bits with dense patterns: work follows the number of ones, not the fixed width.",
    defaultValue: { value: 180 },
    sampleValue: { value: 255 },
    parse: ({ value }) => ({ value: parseBitValue(value) }),
    serialize: ({ value }) => ({ value: String(value) })
  },
  solve: ({ value }) => countSetBits(value),
  buildTrace: ({ value }) => buildCountSetBitsTrace(value),
  code: {
    title: "Clear one set bit per iteration",
    filename: "count-set-bits.mjs",
    sourcePath: "bit-manipulation/count-set-bits.mjs",
    lines: [
      { number: 3, text: "export function countSetBits(value) {", steps: ["initialize"] },
      { number: 7, text: "  while (working !== 0) {", steps: ["loop"] },
      { number: 8, text: "    working &= working - 1;", steps: ["subtract-one", "and-clear"] },
      { number: 9, text: "    count += 1;", steps: ["increment"] },
      { number: 11, text: "  return count;", steps: ["return"] }
    ]
  },
  stats: [
    { label: "Original", value: (step) => String(step.original) },
    { label: "Working", value: (step) => String(step.working) },
    { label: "Bits cleared", value: (step) => String(step.count), detail: () => "loop iterations" },
    { label: "Set-bit count", accent: true, value: (step) => step.phase === "complete" ? String(step.count) : "pending" }
  ],
  complexity: {
    chip: "CLEAR LOWEST ONE",
    time: "O(k)",
    space: "O(1)",
    explanation: "Each loop clears one of k set bits, so sparse values finish without inspecting every bit position. Only the working value and counter are stored."
  },
  guide: { heading: "x & (x - 1) removes exactly one one bit." },
  legend: [
    { kind: "candidate", label: "working bits" },
    { kind: "current", label: "lowest set bit" },
    { kind: "cleared", label: "bit cleared this iteration" },
    { kind: "changed", label: "updated bit" }
  ],
  reflection: {
    eyebrow: "BEFORE YOU MOVE ON",
    title: "Why does subtraction expose the lowest one?",
    body: "Trace one binary subtraction. Explain why all lower zeros become ones, the lowest one becomes zero, and higher bits remain unchanged before the AND."
  }
};
