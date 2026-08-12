import { bitWidth, toFixedBits, validateBitValue } from "../../bit-manipulation/model.mjs";
import { bitwiseParity } from "../../bit-manipulation/parity.mjs";

export { bitwiseParity };

export function buildBitwiseParityTrace(value) {
  validateBitValue(value);
  const bits = toFixedBits(value);
  const lsbIndex = bitWidth - 1;
  const result = bitwiseParity(value);
  return [
    createStep({
      step: 0,
      phase: "initialize",
      codeSteps: ["validate", "show-bits"],
      value,
      bits,
      activeIndices: [],
      markers: [],
      inspected: false,
      narration: `Write ${value} as ${bitWidth} fixed-width bits.`,
      prompt: "Which bit determines whether the value is even or odd?"
    }),
    createStep({
      step: 1,
      phase: "mask-lsb",
      codeSteps: ["and-one"],
      value,
      bits,
      activeIndices: [lsbIndex],
      markers: [{ index: lsbIndex, kind: "current", label: "least-significant bit" }],
      inspected: true,
      narration: `${value} & 1 keeps only the least-significant bit, producing ${result.leastSignificantBit}.`,
      prompt: `Why does a least-significant bit of ${result.leastSignificantBit} mean ${result.parity}?`
    }),
    {
      ...createStep({
        step: 2,
        phase: "complete",
        codeSteps: ["return"],
        value,
        bits,
        activeIndices: [lsbIndex],
        markers: [{ index: lsbIndex, kind: "result", label: result.parity }],
        inspected: true,
        narration: `${value} is ${result.parity} because its least-significant bit is ${result.leastSignificantBit}.`,
        prompt: "How would adding one change this bit and the parity?"
      }),
      result
    }
  ];
}

function createStep({ step, phase, codeSteps, value, bits, activeIndices, markers, inspected, narration, prompt }) {
  return {
    step,
    phase,
    codeSteps,
    value,
    leastSignificantBit: inspected ? bits.at(-1) : null,
    inspected,
    view: {
      values: [...bits],
      activeIndices: [...activeIndices],
      ranges: [{ start: 0, end: bits.length - 1, kind: "candidate", label: `${bitWidth}-bit representation` }],
      markers: markers.map((marker) => ({ ...marker })),
      annotations: bits.map((_, index) => ({ index, label: `bit ${bitWidth - index - 1}` })),
      changedIndices: []
    },
    narration,
    prompt
  };
}
