import { maximumBitValue, parseBitValue } from "../../../bit-manipulation/model.mjs";
import { bitwiseParity } from "../../../bit-manipulation/parity.mjs";
import { buildBitwiseParityTrace } from "../bitwise-parity.mjs";

export const bitwiseParityLesson = {
  id: "bit-manipulation/parity",
  order: 53,
  topic: "Bit Manipulation",
  prerequisites: ["arrays/find-largest"],
  patterns: ["bit-manipulation", "mask", "least-significant-bit"],
  catalogLabel: "Bitwise Parity",
  catalogDescription: "Mask the least-significant bit to distinguish even from odd.",
  title: "Read parity from the lowest bit",
  summary: "The least-significant binary place represents one. Mask every other place away with & 1; a remaining zero is even and a remaining one is odd.",
  renderer: "array",
  input: {
    fields: [{ id: "value", label: `Enter a whole number from 0 to ${maximumBitValue}`, type: "number", inputMode: "numeric", min: "0", max: String(maximumBitValue), step: "1" }],
    help: "The Studio uses an eight-bit unsigned view so every bit position remains visible.",
    defaultValue: { value: 13 },
    sampleValue: { value: 42 },
    parse: ({ value }) => ({ value: parseBitValue(value) }),
    serialize: ({ value }) => ({ value: String(value) })
  },
  solve: ({ value }) => bitwiseParity(value),
  buildTrace: ({ value }) => buildBitwiseParityTrace(value),
  code: {
    title: "Keep only the one-bit place",
    filename: "parity.mjs",
    sourcePath: "bit-manipulation/parity.mjs",
    lines: [
      { number: 3, text: "export function bitwiseParity(value) {", steps: ["validate"] },
      { number: 4, text: "  validateBitValue(value);", steps: ["show-bits"] },
      { number: 5, text: "  const leastSignificantBit = value & 1;", steps: ["and-one"] },
      { number: 6, text: "  return {", steps: ["return"] },
      { number: 7, text: "    parity: leastSignificantBit === 0 ? \"even\" : \"odd\",", steps: ["return"] },
      { number: 8, text: "    leastSignificantBit", steps: ["return"] }
    ]
  },
  stats: [
    { label: "Decimal", value: (step) => String(step.value) },
    { label: "Width", value: () => "8 bits" },
    { label: "LSB", value: (step) => step.leastSignificantBit === null ? "-" : String(step.leastSignificantBit) },
    { label: "Parity", accent: true, value: (step) => step.leastSignificantBit === null ? "-" : step.leastSignificantBit === 0 ? "even" : "odd" }
  ],
  complexity: {
    chip: "MASK WITH 1",
    time: "O(1)",
    space: "O(1)",
    explanation: "One fixed-width bitwise AND reads the lowest bit without scanning digits or allocating an algorithmic data structure."
  },
  guide: { heading: "The lowest bit is the remainder modulo two." },
  legend: [
    { kind: "candidate", label: "fixed-width bits" },
    { kind: "current", label: "least-significant bit" },
    { kind: "result", label: "parity result" }
  ],
  reflection: {
    eyebrow: "BEFORE YOU MOVE ON",
    title: "Why does & 1 equal modulo two?",
    body: "Connect each binary place value to divisibility by two. Explain why every place except the one-bit place contributes an even amount."
  }
};
