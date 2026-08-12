import { bitWidth, toFixedBits } from "../../bit-manipulation/model.mjs";
import {
  singleNumber,
  validateSingleNumberInput
} from "../../bit-manipulation/single-number.mjs";

export { singleNumber };

export function buildSingleNumberTrace(values) {
  validateSingleNumberInput(values);
  const trace = [];
  let accumulator = 0;
  const seen = new Map();
  let cancellations = 0;

  const addStep = ({ phase, codeSteps, index = null, previous = accumulator, changedBits = [], narration, prompt, result }) => {
    const bits = toFixedBits(accumulator);
    const step = {
      step: trace.length,
      phase,
      codeSteps,
      index,
      currentValue: index === null ? null : values[index],
      previousAccumulator: previous,
      accumulator,
      cancellations,
      views: {
        values: {
          values: [...values],
          activeIndices: index === null ? [] : [index],
          ranges: [],
          markers: index === null ? [] : [{ index, kind: "current", label: "next XOR operand" }],
          annotations: values.map((value, valueIndex) => ({
            index: valueIndex,
            label: (seen.get(value) ?? 0) >= 2 ? "pair canceled" : valueIndex < (index ?? 0) ? "processed" : "pending"
          })),
          changedIndices: []
        },
        accumulator: {
          values: bits,
          activeIndices: changedBits.length ? [...changedBits] : [],
          ranges: [{ start: 0, end: bits.length - 1, kind: "candidate", label: `${bitWidth}-bit XOR accumulator` }],
          markers: [],
          annotations: bits.map((_, bitIndex) => ({ index: bitIndex, label: `bit ${bitWidth - bitIndex - 1}` })),
          changedIndices: [...changedBits]
        }
      },
      narration,
      prompt
    };
    if (result !== undefined) step.result = result;
    trace.push(step);
  };

  addStep({
    phase: "initialize",
    codeSteps: ["initialize"],
    narration: "Start the XOR accumulator at 0, the identity value: 0 XOR x equals x.",
    prompt: "What happens when the first value is XORed with zero?"
  });

  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    const previous = accumulator;
    const previousBits = toFixedBits(previous);
    accumulator ^= value;
    const nextBits = toFixedBits(accumulator);
    const changedBits = nextBits.flatMap((bit, bitIndex) => bit === previousBits[bitIndex] ? [] : [bitIndex]);
    const priorCount = seen.get(value) ?? 0;
    seen.set(value, priorCount + 1);
    if (priorCount === 1) cancellations += 1;
    addStep({
      phase: priorCount === 1 ? "cancel-pair" : "xor-value",
      codeSteps: ["loop", "xor-accumulator"],
      index,
      previous,
      changedBits,
      narration: priorCount === 1
        ? `${previous} XOR ${value} = ${accumulator}. The second ${value} cancels its first copy because x XOR x = 0.`
        : `${previous} XOR ${value} = ${accumulator}. XOR toggles every bit where ${value} has a one.`,
      prompt: priorCount === 1 ? "Why can this pair cancel even when other values appeared between it?" : "Which later duplicate may toggle these same bits back?"
    });
  }

  const result = singleNumber(values);
  addStep({
    phase: "complete",
    codeSteps: ["return"],
    narration: `Every pair canceled, leaving the unique value ${result} in the accumulator.`,
    prompt: "Which XOR laws make input order irrelevant?",
    result
  });
  return trace;
}
