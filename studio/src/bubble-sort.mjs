import {
  bubbleSort,
  validateBubbleSortInput
} from "../../sorting/bubble-sort.mjs";
import { formatNumber } from "./input.mjs";

export { bubbleSort };

export function buildBubbleSortTrace(values) {
  validateBubbleSortInput(values);
  const working = [...values];
  const trace = [];
  let comparisons = 0;
  let swaps = 0;
  let settledStart = working.length;

  trace.push(createStep({ trace, phase: "initialize", codeSteps: ["copy"], working, comparisons, swaps, settledStart,
    narration: "Copy the input. Each complete pass will bubble its largest remaining value to the right edge.",
    prompt: "Which adjacent inversion will swap first?" }));

  for (let end = working.length - 1; end > 0; end -= 1) {
    let swapped = false;
    for (let index = 0; index < end; index += 1) {
      comparisons += 1;
      trace.push(createStep({ trace, phase: "compare", codeSteps: ["outer-loop", "inner-loop", "compare"], working, comparisons, swaps, settledStart,
        activeIndices: [index, index + 1], markers: [{ index, kind: "left", label: "left" }, { index: index + 1, kind: "right", label: "right" }],
        narration: `Compare ${formatNumber(working[index])} and ${formatNumber(working[index + 1])}.`,
        prompt: working[index] > working[index + 1] ? "Why are these neighbors inverted?" : "Why can this pair stay in place?" }));
      if (working[index] <= working[index + 1]) continue;
      const left = working[index];
      const right = working[index + 1];
      [working[index], working[index + 1]] = [right, left];
      swaps += 1;
      swapped = true;
      trace.push(createStep({ trace, phase: "swap", codeSteps: ["swap"], working, comparisons, swaps, settledStart,
        activeIndices: [index, index + 1], changedIndices: [index, index + 1], annotations: [{ index, label: `was ${formatNumber(left)}` }, { index: index + 1, label: `was ${formatNumber(right)}` }],
        narration: `Swap the inverted neighbors; ${formatNumber(left)} moves one position toward the right.`,
        prompt: "How far can one value move during a single pass?" }));
    }
    settledStart = end;
    trace.push(createStep({ trace, phase: "finish-pass", codeSteps: ["finish-pass"], working, comparisons, swaps, settledStart,
      narration: `${formatNumber(working[end])} is settled at index ${end}.${swapped ? " Another pass may still be needed." : " No swaps occurred, so the whole array is sorted."}`,
      prompt: swapped ? "Which unsorted prefix remains?" : "Why does a swap-free pass prove sorted order?" }));
    if (!swapped) {
      settledStart = 0;
      break;
    }
  }
  settledStart = 0;
  trace.push({ ...createStep({ trace, phase: "complete", codeSteps: ["return"], working, comparisons, swaps, settledStart,
    narration: `Bubble Sort completed with ${comparisons} comparisons and ${swaps} swaps.`,
    prompt: "Why can the best case stop after one pass?" }), result: [...working] });
  return trace;
}

function createStep({ trace, phase, codeSteps, working, comparisons, swaps, settledStart, narration, prompt, activeIndices = [], markers = [], annotations = [], changedIndices = [] }) {
  return {
    step: trace.length,
    phase,
    codeSteps,
    comparisons,
    swaps,
    settledCount: working.length - settledStart,
    view: {
      values: [...working],
      activeIndices: [...activeIndices],
      ranges: settledStart < working.length ? [{ start: settledStart, end: working.length - 1, kind: "settled", label: "settled suffix" }] : [],
      markers: markers.map((marker) => ({ ...marker })),
      annotations: annotations.map((annotation) => ({ ...annotation })),
      changedIndices: [...changedIndices]
    },
    narration,
    prompt
  };
}
