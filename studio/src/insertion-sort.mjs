import {
  insertionSort,
  validateInsertionSortInput
} from "../../sorting/insertion-sort.mjs";
import { formatNumber } from "./input.mjs";

export { insertionSort };

export function buildInsertionSortTrace(values) {
  validateInsertionSortInput(values);
  const working = [...values];
  const trace = [];
  let comparisons = 0;
  let shifts = 0;
  let sortedEnd = 0;

  trace.push(createStep({ trace, phase: "initialize", codeSteps: ["copy"], working, comparisons, shifts, sortedEnd,
    narration: "The first value forms a sorted prefix of length one.", prompt: "Where should the next value be inserted inside this prefix?" }));

  for (let index = 1; index < working.length; index += 1) {
    const key = working[index];
    let position = index - 1;
    trace.push(createStep({ trace, phase: "choose-key", codeSteps: ["outer-loop", "save-key"], working, comparisons, shifts, sortedEnd,
      activeIndices: [index], markers: [{ index, kind: "current", label: "key" }], annotations: [{ index, label: `key ${formatNumber(key)}` }],
      narration: `Save ${formatNumber(key)} from index ${index}. The prefix through index ${sortedEnd} is already sorted.`,
      prompt: "How far left must this key travel?" }));

    while (position >= 0) {
      comparisons += 1;
      trace.push(createStep({ trace, phase: "compare", codeSteps: ["while-compare"], working, comparisons, shifts, sortedEnd,
        activeIndices: [position, position + 1], markers: [{ index: position, kind: "left", label: "compare" }, { index: position + 1, kind: "current", label: "key slot" }],
        narration: `Compare sorted-prefix value ${formatNumber(working[position])} with key ${formatNumber(key)}.`,
        prompt: working[position] > key ? "Why must the prefix value shift right?" : "Why is the insertion point just to its right?" }));
      if (working[position] <= key) break;
      working[position + 1] = working[position];
      shifts += 1;
      trace.push(createStep({ trace, phase: "shift", codeSteps: ["shift-right"], working, comparisons, shifts, sortedEnd,
        activeIndices: [position, position + 1], changedIndices: [position + 1], annotations: [{ index: position + 1, label: `from ${position}` }],
        narration: `Shift ${formatNumber(working[position])} right into index ${position + 1}, opening space farther left.`,
        prompt: "Should the key keep moving left?" }));
      position -= 1;
    }
    working[position + 1] = key;
    sortedEnd = index;
    trace.push(createStep({ trace, phase: "insert", codeSteps: ["insert-key"], working, comparisons, shifts, sortedEnd,
      activeIndices: [position + 1], changedIndices: [position + 1], markers: [{ index: position + 1, kind: "current", label: "inserted" }],
      narration: `Insert ${formatNumber(key)} at index ${position + 1}. The sorted prefix now ends at index ${sortedEnd}.`,
      prompt: "Which invariant is restored after this insertion?" }));
  }

  trace.push({ ...createStep({ trace, phase: "complete", codeSteps: ["return"], working, comparisons, shifts, sortedEnd: working.length - 1,
    narration: `Every value has been inserted into the sorted prefix using ${shifts} shifts.`, prompt: "Why is insertion sort fast on nearly sorted data?" }), result: [...working] });
  return trace;
}

function createStep({ trace, phase, codeSteps, working, comparisons, shifts, sortedEnd, narration, prompt, activeIndices = [], markers = [], annotations = [], changedIndices = [] }) {
  return {
    step: trace.length,
    phase,
    codeSteps,
    comparisons,
    shifts,
    sortedCount: sortedEnd + 1,
    view: {
      values: [...working],
      activeIndices: [...activeIndices],
      ranges: [{ start: 0, end: sortedEnd, kind: "settled", label: "sorted prefix" }],
      markers: markers.map((marker) => ({ ...marker })),
      annotations: annotations.map((annotation) => ({ ...annotation })),
      changedIndices: [...changedIndices]
    },
    narration,
    prompt
  };
}
