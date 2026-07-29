import { findLargest, validateInput } from "../../arrays/find-largest.mjs";
import { formatNumber } from "./input.mjs";

export { findLargest };

export function buildFindLargestTrace(values) {
  validateInput(values);

  let largest = values[0];
  const trace = [{
    step: 0,
    phase: "initialize",
    activeIndex: 0,
    comparedValue: values[0],
    previousBestValue: null,
    bestValue: largest,
    bestIndex: 0,
    codeSteps: ["initialize"],
    changed: true,
    view: {
      values: [...values],
      activeIndices: [0],
      ranges: [],
      markers: [{ index: 0, kind: "best", label: "best" }]
    },
    narration: `Start with ${formatValue(largest)} as the best value so far.`,
    prompt: "Prediction: what should our best value be after the first step?"
  }];

  for (let index = 1; index < values.length; index += 1) {
    const previousBestValue = largest;
    const changed = values[index] > largest;
    if (changed) {
      largest = values[index];
    }

    trace.push({
      step: index,
      phase: "compare",
      activeIndex: index,
      comparedValue: values[index],
      previousBestValue,
      bestValue: largest,
      bestIndex: changed ? index : trace[trace.length - 1].bestIndex,
      codeSteps: changed ? ["compare", "update-largest"] : ["compare"],
      narration: changed
        ? `${formatValue(values[index])} becomes the new largest value because it is greater than ${formatValue(previousBestValue)}.`
        : `${formatValue(values[index])} is not greater than ${formatValue(previousBestValue)}, so the best value stays the same.`,
      changed,
      view: {
        values: [...values],
        activeIndices: [index],
        ranges: [],
        markers: [{
          index: changed ? index : trace[trace.length - 1].bestIndex,
          kind: "best",
          label: "best"
        }]
      },
      prompt: changed
        ? "Notice the handoff: the current value becomes the new best."
        : "Prediction: if the next value is smaller, what should stay unchanged?"
    });
  }

  trace.push({
    step: trace.length,
    phase: "complete",
    activeIndex: trace.at(-1).activeIndex,
    comparedValue: trace.at(-1).comparedValue,
    previousBestValue: largest,
    bestValue: largest,
    bestIndex: trace.at(-1).bestIndex,
    codeSteps: ["return"],
    changed: false,
    view: {
      values: [...values],
      activeIndices: [],
      ranges: [],
      markers: [{ index: trace.at(-1).bestIndex, kind: "best", label: "largest" }]
    },
    result: largest,
    narration: `The scan is complete. ${formatValue(largest)} is the largest value.`,
    prompt: "Can you explain exactly when the answer last changed?"
  });

  return trace;
}

export function formatValue(value) {
  return formatNumber(value);
}
