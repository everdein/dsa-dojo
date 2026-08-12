import {
  findDuplicates,
  validateFindDuplicatesInput
} from "../../hash-maps-and-sets/find-duplicates.mjs";
import { formatNumber } from "./input.mjs";

export { findDuplicates };

export function buildFindDuplicatesTrace(values) {
  validateFindDuplicatesInput(values);

  const trace = [];
  const seen = new Set();
  const emitted = new Set();
  const duplicates = [];
  let currentIndex = null;
  let currentValue = null;
  let occurrence = 0;

  trace.push(createStep({
    trace,
    phase: "initialize",
    codeSteps: ["initialize-sets"],
    values,
    seen,
    emitted,
    duplicates,
    currentIndex,
    currentValue,
    occurrence,
    narration: "Start with an empty seen set and an empty duplicate result. Each value will be classified by membership.",
    prompt: `Prediction: what should happen when ${formatNumber(values[0])} is checked for the first time?`
  }));

  for (let index = 0; index < values.length; index += 1) {
    currentIndex = index;
    currentValue = values[index];
    const key = numericLookupKey(currentValue);
    const wasSeen = seen.has(currentValue);
    const wasEmitted = emitted.has(currentValue);
    occurrence = wasSeen ? wasEmitted ? 3 : 2 : 1;

    trace.push(createStep({
      trace,
      phase: "check",
      codeSteps: ["scan-value", "check-seen"],
      values,
      seen,
      emitted,
      duplicates,
      currentIndex,
      currentValue,
      occurrence,
      activeKey: wasSeen ? key : null,
      narration: wasSeen
        ? `${formatNumber(currentValue)} is already in seen, so this occurrence is a duplicate.`
        : `${formatNumber(currentValue)} is not in seen, so this is its first occurrence.`,
      prompt: wasSeen
        ? wasEmitted
          ? "This duplicate was already reported. Should it be appended again?"
          : "This is the second occurrence. How should the result change?"
        : "What must the set remember before the scan advances?"
    }));

    if (!wasSeen) {
      seen.add(currentValue);
      trace.push(createStep({
        trace,
        phase: "record",
        codeSteps: ["record-seen"],
        values,
        seen,
        emitted,
        duplicates,
        currentIndex,
        currentValue,
        occurrence,
        activeKey: key,
        lookupAnnotations: [{ key, label: "added now" }],
        narration: `Add ${formatNumber(currentValue)} to seen. A later matching value can now be recognized immediately.`,
        prompt: index + 1 < values.length
          ? `Will ${formatNumber(values[index + 1])} already be in the set?`
          : "The scan has no values left. Which duplicates were discovered?"
      }));
      continue;
    }

    if (!wasEmitted) {
      emitted.add(currentValue);
      duplicates.push(canonicalResultValue(currentValue));
      trace.push(createStep({
        trace,
        phase: "duplicate",
        codeSteps: ["check-emitted", "append-duplicate", "mark-emitted"],
        values,
        seen,
        emitted,
        duplicates,
        currentIndex,
        currentValue,
        occurrence,
        activeKey: key,
        lookupAnnotations: [{ key, label: "second occurrence" }],
        narration: `${formatNumber(currentValue)} repeats for the first time. Append it once to the duplicate result.`,
        prompt: "What prevents a third occurrence from adding another copy?"
      }));
      continue;
    }

    trace.push(createStep({
      trace,
      phase: "already-reported",
      codeSteps: ["check-emitted"],
      values,
      seen,
      emitted,
      duplicates,
      currentIndex,
      currentValue,
      occurrence,
      activeKey: key,
      lookupAnnotations: [{ key, label: "already reported" }],
      narration: `${formatNumber(currentValue)} repeats again, but the result already contains it, so nothing is appended.`,
      prompt: "The output promises each duplicate once. Which invariant preserves that promise?"
    }));
  }

  trace.push({
    ...createStep({
      trace,
      phase: "complete",
      codeSteps: ["return-duplicates"],
      values,
      seen,
      emitted,
      duplicates,
      currentIndex,
      currentValue,
      occurrence,
      complete: true,
      narration: duplicates.length === 0
        ? "The scan finished without a second occurrence, so the duplicate result is empty."
        : `The scan found ${duplicates.length} ${duplicates.length === 1 ? "duplicate" : "duplicates"}, ordered by when each second occurrence appeared.`,
      prompt: "Why does one left-to-right pass preserve second-occurrence discovery order?"
    }),
    result: [...duplicates]
  });

  return trace;
}

function createStep({
  trace,
  phase,
  codeSteps,
  values,
  seen,
  emitted,
  duplicates,
  currentIndex,
  currentValue,
  occurrence,
  narration,
  prompt,
  activeKey = null,
  lookupAnnotations = [],
  complete = false
}) {
  return {
    step: trace.length,
    phase,
    codeSteps,
    currentIndex,
    currentValue,
    occurrence,
    distinctSeen: seen.size,
    duplicateCount: duplicates.length,
    duplicates: [...duplicates],
    views: {
      values: buildArrayView({
        values,
        currentIndex,
        currentValue,
        emitted,
        complete
      }),
      seen: buildLookupView({
        seen,
        emitted,
        activeKey,
        annotations: lookupAnnotations
      })
    },
    narration,
    prompt
  };
}

function buildArrayView({ values, currentIndex, currentValue, emitted, complete }) {
  const resultIndices = [];
  const resultKeys = new Set([...emitted].map(numericLookupKey));
  if (complete) {
    for (let index = 0; index < values.length; index += 1) {
      if (resultKeys.has(numericLookupKey(values[index]))) resultIndices.push(index);
    }
  }

  return {
    values: [...values],
    activeIndices: complete ? [] : currentIndex === null ? [] : [currentIndex],
    ranges: [],
    markers: resultIndices.map((index) => ({
      index,
      kind: "duplicate",
      label: "duplicate value"
    })),
    annotations: complete
      ? resultIndices.map((index) => ({ index, label: "duplicate" }))
      : currentIndex === null
        ? []
        : [{
            index: currentIndex,
            label: emitted.has(currentValue) ? "duplicate" : "checking"
          }],
    changedIndices: []
  };
}

function buildLookupView({ seen, emitted, activeKey, annotations }) {
  return {
    entries: [...seen].map((value) => {
      const duplicate = emitted.has(value);
      return {
        key: numericLookupKey(value),
        value: duplicate ? "duplicate" : "seen once",
        state: duplicate ? "duplicate" : "seen"
      };
    }),
    activeKeys: activeKey === null ? [] : [activeKey],
    annotations: annotations.map((annotation) => ({ ...annotation })),
    resultKeys: [...emitted].map(numericLookupKey)
  };
}

export function numericLookupKey(value) {
  if (!Number.isFinite(value)) throw new Error("Duplicate lookup keys require finite numbers.");
  return Object.is(value, -0) ? "0" : String(value);
}

function canonicalResultValue(value) {
  return Object.is(value, -0) ? 0 : value;
}
