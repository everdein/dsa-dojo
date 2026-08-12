import { bitWidth, toFixedBits, validateBitValue } from "../../bit-manipulation/model.mjs";
import { countSetBits } from "../../bit-manipulation/count-set-bits.mjs";

export { countSetBits };

export function buildCountSetBitsTrace(value) {
  validateBitValue(value);
  const trace = [];
  let working = value;
  let count = 0;

  trace.push(createStep({
    trace,
    phase: "initialize",
    codeSteps: ["initialize"],
    original: value,
    working,
    count,
    narration: `Start with ${value}. Each iteration will remove exactly one set bit.`,
    prompt: working === 0 ? "Are there any one bits to clear?" : "Which one bit is lowest?"
  }));

  while (working !== 0) {
    const before = working;
    const beforeBits = toFixedBits(before);
    const decremented = before - 1;
    const after = before & decremented;
    const afterBits = toFixedBits(after);
    const clearedIndex = beforeBits.findIndex((bit, index) => bit === 1 && afterBits[index] === 0);
    trace.push(createStep({
      trace,
      phase: "inspect-lowest-one",
      codeSteps: ["loop", "subtract-one"],
      original: value,
      working,
      count,
      activeIndex: clearedIndex,
      markerKind: "current",
      annotation: `${before} - 1 = ${decremented}`,
      narration: `Subtracting one flips the lowest one bit and every lower zero bit: ${before} - 1 = ${decremented}.`,
      prompt: "What will AND keep between the original and decremented patterns?"
    }));
    working = after;
    count += 1;
    trace.push(createStep({
      trace,
      phase: "clear-lowest-one",
      codeSteps: ["and-clear", "increment"],
      original: value,
      working,
      count,
      activeIndex: clearedIndex,
      changedIndex: clearedIndex,
      markerKind: "cleared",
      annotation: `cleared one · count ${count}`,
      narration: `${before} & ${decremented} = ${working}. One set bit was cleared, so the count becomes ${count}.`,
      prompt: working === 0 ? "Why does reaching zero prove every one bit was counted?" : "Which set bit will be cleared next?"
    }));
  }

  trace.push({
    ...createStep({
      trace,
      phase: "complete",
      codeSteps: ["return"],
      original: value,
      working,
      count,
      narration: `${value} contains ${count} set ${count === 1 ? "bit" : "bits"}.`,
      prompt: "Why is the iteration count proportional to ones rather than total bit width?"
    }),
    result: countSetBits(value)
  });
  return trace;
}

function createStep({ trace, phase, codeSteps, original, working, count, narration, prompt, activeIndex = null, changedIndex = null, markerKind = null, annotation = null }) {
  const bits = toFixedBits(working);
  return {
    step: trace.length,
    phase,
    codeSteps,
    original,
    working,
    count,
    view: {
      values: bits,
      activeIndices: activeIndex === null ? [] : [activeIndex],
      ranges: [{ start: 0, end: bits.length - 1, kind: "candidate", label: `${bitWidth}-bit working value` }],
      markers: activeIndex === null ? [] : [{ index: activeIndex, kind: markerKind, label: markerKind === "cleared" ? "cleared lowest one" : "lowest one" }],
      annotations: annotation === null || activeIndex === null ? bits.map((_, index) => ({ index, label: `bit ${bitWidth - index - 1}` })) : [{ index: activeIndex, label: annotation }],
      changedIndices: changedIndex === null ? [] : [changedIndex]
    },
    narration,
    prompt
  };
}
