import {
  slidingWindowMaximum,
  validateSlidingWindowMaximumInput
} from "../../queues/sliding-window-maximum.mjs";
import { formatNumber } from "./input.mjs";

export { slidingWindowMaximum };

export function buildSlidingWindowMaximumTrace({ values, size }) {
  validateSlidingWindowMaximumInput(values, size);

  const candidates = [];
  const outputs = [];
  const trace = [];

  trace.push(createStep({
    trace,
    phase: "initialize",
    codeSteps: ["initialize"],
    values,
    size,
    candidates,
    outputs,
    currentIndex: null,
    currentStart: null,
    currentEnd: null,
    processedCount: 0,
    windowReady: false,
    removedIndex: null,
    removalReason: null,
    maximumIndex: null,
    narration: "Start with an empty deque. It will keep only indices that can still become a window maximum.",
    prompt: "What ordering should candidate values maintain from front to back?"
  }));

  for (let index = 0; index < values.length; index += 1) {
    const fullWindowStart = index - size + 1;
    const currentStart = Math.max(0, fullWindowStart);
    const windowReady = fullWindowStart >= 0;
    const frontIndex = candidates[0] ?? null;

    trace.push(createStep({
      trace,
      phase: "inspect",
      codeSteps: ["read-value"],
      values,
      size,
      candidates,
      outputs,
      currentIndex: index,
      currentStart,
      currentEnd: index,
      processedCount: index,
      windowReady,
      removedIndex: null,
      removalReason: null,
      maximumIndex: null,
      activeCandidateIndices: frontIndex === null ? [] : [frontIndex],
      candidateAnnotations: frontIndex === null ? [] : [{
        index: frontIndex,
        label: frontIndex < fullWindowStart ? "check: expired" : "still in window"
      }],
      narration: windowReady
        ? `Read index ${index}, value ${formatNumber(values[index])}. The next complete window spans indices ${fullWindowStart}-${index}.`
        : `Read index ${index}, value ${formatNumber(values[index])}. The first window is still filling.`,
      prompt: frontIndex !== null && frontIndex < fullWindowStart
        ? "Why can the front candidate no longer affect this window?"
        : "Can the incoming value make candidates at the back unnecessary?"
    }));

    while (candidates.length > 0 && candidates[0] < fullWindowStart) {
      const removedIndex = candidates.shift();
      const newFront = candidates[0] ?? null;
      trace.push(createStep({
        trace,
        phase: "expire-front",
        codeSteps: ["expire-front"],
        values,
        size,
        candidates,
        outputs,
        currentIndex: index,
        currentStart,
        currentEnd: index,
        processedCount: index,
        windowReady,
        removedIndex,
        removalReason: "expired",
        maximumIndex: null,
        activeCandidateIndices: newFront === null ? [] : [newFront],
        changedCandidateIndices: newFront === null ? [] : [newFront],
        candidateAnnotations: newFront === null
          ? []
          : [{ index: newFront, label: "new front after expiry" }],
        narration: `Remove index ${removedIndex} from the front because it lies before window start ${fullWindowStart}.`,
        prompt: "Which remaining endpoint should be compared with the incoming value?"
      }));
    }

    while (
      candidates.length > 0
      && values[candidates.at(-1)] <= values[index]
    ) {
      const removedIndex = candidates.pop();
      const newBack = candidates.at(-1) ?? null;
      trace.push(createStep({
        trace,
        phase: "remove-dominated",
        codeSteps: ["remove-back"],
        values,
        size,
        candidates,
        outputs,
        currentIndex: index,
        currentStart,
        currentEnd: index,
        processedCount: index,
        windowReady,
        removedIndex,
        removalReason: "dominated",
        maximumIndex: null,
        activeCandidateIndices: newBack === null ? [] : [newBack],
        changedCandidateIndices: newBack === null ? [] : [newBack],
        candidateAnnotations: newBack === null
          ? []
          : [{ index: newBack, label: "new back after removal" }],
        narration: `Remove index ${removedIndex}, value ${formatNumber(values[removedIndex])}, from the back. Incoming ${formatNumber(values[index])} is at least as large and expires later.`,
        prompt: "Does the new back also lose every future comparison to the incoming value?"
      }));
    }

    candidates.push(index);
    trace.push(createStep({
      trace,
      phase: "enqueue",
      codeSteps: ["enqueue"],
      values,
      size,
      candidates,
      outputs,
      currentIndex: index,
      currentStart,
      currentEnd: index,
      processedCount: index + 1,
      windowReady,
      removedIndex: null,
      removalReason: null,
      maximumIndex: null,
      activeCandidateIndices: [index],
      changedCandidateIndices: [index],
      candidateAnnotations: [{ index, label: "entered at back" }],
      narration: `Enqueue index ${index}. Candidate values now decrease from front to back: ${formatCandidateValues(candidates, values)}.`,
      prompt: windowReady
        ? "Which deque endpoint now holds this window's maximum?"
        : "How many more values are needed before the first full window?"
    }));

    if (!windowReady) continue;

    const maximumIndex = candidates[0];
    const output = {
      windowStart: fullWindowStart,
      windowEnd: index,
      sourceIndex: maximumIndex,
      value: values[maximumIndex]
    };
    outputs.push(output);
    trace.push(createStep({
      trace,
      phase: "emit-maximum",
      codeSteps: ["emit-maximum"],
      values,
      size,
      candidates,
      outputs,
      currentIndex: index,
      currentStart: fullWindowStart,
      currentEnd: index,
      processedCount: index + 1,
      windowReady: true,
      removedIndex: null,
      removalReason: null,
      maximumIndex,
      activeCandidateIndices: [maximumIndex],
      candidateAnnotations: [{ index: maximumIndex, label: "maximum for this window" }],
      narration: `The front candidate is index ${maximumIndex}, so window ${fullWindowStart}-${index} emits ${formatNumber(output.value)}.`,
      prompt: "Why can no candidate behind the front be larger?"
    }));
  }

  const maxima = slidingWindowMaximum(values, size);
  const finalMaximumIndex = outputs.at(-1).sourceIndex;
  trace.push({
    ...createStep({
      trace,
      phase: "complete",
      codeSteps: ["return"],
      values,
      size,
      candidates,
      outputs,
      currentIndex: null,
      currentStart: values.length - size,
      currentEnd: values.length - 1,
      processedCount: values.length,
      windowReady: true,
      removedIndex: null,
      removalReason: null,
      maximumIndex: finalMaximumIndex,
      activeCandidateIndices: [finalMaximumIndex],
      candidateAnnotations: [{ index: finalMaximumIndex, label: "final window maximum" }],
      narration: `${outputs.length} ${outputs.length === 1 ? "window emits" : "windows emit"} maxima ${formatCandidateValues(maxima, null)}.`,
      prompt: "How does each index enter and leave the deque at most once?"
    }),
    result: [...maxima]
  });

  return trace;
}

export function slidingWindowCandidateId(index) {
  if (!Number.isInteger(index) || index < 0) {
    throw new Error("Sliding-window candidate ids require non-negative integer indices.");
  }
  return `index-${index}`;
}

function createStep({
  trace,
  phase,
  codeSteps,
  values,
  size,
  candidates,
  outputs,
  currentIndex,
  currentStart,
  currentEnd,
  processedCount,
  windowReady,
  removedIndex,
  removalReason,
  maximumIndex,
  narration,
  prompt,
  activeCandidateIndices = [],
  changedCandidateIndices = [],
  candidateAnnotations = []
}) {
  return {
    step: trace.length,
    phase,
    codeSteps,
    currentIndex,
    currentValue: currentIndex === null ? null : values[currentIndex],
    currentStart,
    currentEnd,
    windowSize: size,
    windowReady,
    processedCount,
    candidateCount: candidates.length,
    candidateIndices: [...candidates],
    removedIndex,
    removalReason,
    maximumIndex,
    outputCount: outputs.length,
    latestMaximum: outputs.length === 0 ? null : outputs.at(-1).value,
    maxima: outputs.map(({ value }) => value),
    outputs: outputs.map((output) => ({ ...output })),
    views: {
      values: buildArrayView({
        values,
        size,
        candidates,
        outputs,
        phase,
        currentIndex,
        currentStart,
        currentEnd,
        removedIndex,
        removalReason,
        maximumIndex,
        windowReady
      }),
      candidates: buildQueueView({
        values,
        candidates,
        phase,
        maximumIndex,
        activeCandidateIndices,
        changedCandidateIndices,
        candidateAnnotations
      })
    },
    narration,
    prompt
  };
}

function buildArrayView({
  values,
  size,
  candidates,
  outputs,
  phase,
  currentIndex,
  currentStart,
  currentEnd,
  removedIndex,
  removalReason,
  maximumIndex,
  windowReady
}) {
  const activeIndices = [...new Set([
    ...candidates,
    ...(currentIndex === null ? [] : [currentIndex]),
    ...(removedIndex === null ? [] : [removedIndex])
  ])];
  const markerByIndex = new Map();
  for (const output of outputs) {
    markerByIndex.set(output.sourceIndex, {
      index: output.sourceIndex,
      kind: "maximum",
      label: "emitted maximum"
    });
  }
  if (currentIndex !== null && phase !== "emit-maximum") {
    markerByIndex.set(currentIndex, {
      index: currentIndex,
      kind: "entering",
      label: "incoming value"
    });
  }
  if (removedIndex !== null) {
    markerByIndex.set(removedIndex, {
      index: removedIndex,
      kind: removalReason,
      label: removalReason === "expired" ? "expired from window" : "dominated at back"
    });
  }
  if (maximumIndex !== null && (phase === "emit-maximum" || phase === "complete")) {
    markerByIndex.set(maximumIndex, {
      index: maximumIndex,
      kind: "maximum",
      label: "window maximum"
    });
  }

  const annotationByIndex = new Map();
  if (removedIndex !== null) {
    annotationByIndex.set(removedIndex, removalReason === "expired"
      ? "outside current window"
      : `removed by ${formatNumber(values[currentIndex])}`);
  }
  if (phase === "enqueue" && currentIndex !== null) {
    annotationByIndex.set(currentIndex, "added to deque back");
  }
  if (phase === "emit-maximum" && maximumIndex !== null) {
    annotationByIndex.set(maximumIndex, `maximum for ${currentStart}-${currentEnd}`);
  }

  return {
    values: [...values],
    activeIndices,
    ranges: currentStart === null || currentEnd === null
      ? []
      : [{
          start: currentStart,
          end: currentEnd,
          kind: "window",
          label: windowReady ? "current window" : `building ${size}-value window`
        }],
    markers: [...markerByIndex.values()],
    annotations: [...annotationByIndex].map(([index, label]) => ({ index, label })),
    changedIndices: phase === "enqueue"
      ? [currentIndex]
      : phase === "expire-front" || phase === "remove-dominated"
        ? [...new Set([removedIndex, currentIndex])]
        : phase === "emit-maximum"
          ? [maximumIndex]
          : []
  };
}

function buildQueueView({
  values,
  candidates,
  phase,
  maximumIndex,
  activeCandidateIndices,
  changedCandidateIndices,
  candidateAnnotations
}) {
  const items = candidates.map((index, position) => ({
    id: slidingWindowCandidateId(index),
    value: values[index],
    state: maximumIndex === index && (phase === "emit-maximum" || phase === "complete")
      ? "window-maximum"
      : position === 0
        ? "front-candidate"
        : "candidate"
  }));
  return {
    structure: "queue",
    items,
    frontItemId: items[0]?.id ?? null,
    backItemId: items.at(-1)?.id ?? null,
    activeItemIds: activeCandidateIndices.map(slidingWindowCandidateId),
    changedItemIds: changedCandidateIndices.map(slidingWindowCandidateId),
    annotations: candidateAnnotations.map(({ index, label }) => ({
      itemId: slidingWindowCandidateId(index),
      label
    }))
  };
}

function formatCandidateValues(indicesOrValues, values) {
  const displayValues = values === null
    ? indicesOrValues
    : indicesOrValues.map((index) => values[index]);
  return `[${displayValues.map(formatNumber).join(", ")}]`;
}
