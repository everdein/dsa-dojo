import {
  countFrequencies,
  validateFrequencyInput
} from "../../arrays/frequency-count.mjs";
import { formatNumber } from "./input.mjs";

export { countFrequencies };

export function buildFrequencyCountTrace(values) {
  validateFrequencyInput(values);

  const counts = new Map();
  const trace = [];

  trace.push(createStep({
    trace,
    phase: "initialize",
    codeSteps: ["initialize"],
    values,
    counts,
    currentIndex: 0,
    processedCount: 0,
    previousCount: 0,
    nextCount: 1,
    changedKey: null,
    narration: "Start with an empty lookup. Each input value will create or update exactly one count.",
    prompt: "Prediction: what count should the first value receive?"
  }));

  for (let index = 0; index < values.length; index += 1) {
    const value = normalizedFrequencyValue(values[index]);
    const key = frequencyLookupKey(value);
    const previousCount = counts.get(key)?.count ?? 0;

    trace.push(createStep({
      trace,
      phase: "inspect",
      codeSteps: ["read-value", "read-count"],
      values,
      counts,
      currentIndex: index,
      processedCount: index,
      previousCount,
      nextCount: previousCount + 1,
      changedKey: null,
      narration: previousCount === 0
        ? `${formatNumber(value)} has no entry yet, so its count starts at one.`
        : `${formatNumber(value)} already has count ${previousCount}, so reuse that work instead of scanning backward.`,
      prompt: previousCount === 0
        ? "Will this update increase the number of distinct keys?"
        : "Which part changes: the key set, the stored count, or both?"
    }));

    const nextCount = previousCount + 1;
    counts.set(key, { value, count: nextCount });
    trace.push(createStep({
      trace,
      phase: previousCount === 0 ? "add-key" : "increment-count",
      codeSteps: previousCount === 0 ? ["write-count", "add-key"] : ["write-count", "increment-count"],
      values,
      counts,
      currentIndex: index,
      processedCount: index + 1,
      previousCount,
      nextCount,
      changedKey: key,
      narration: previousCount === 0
        ? `Add ${formatNumber(value)} with count 1. The lookup now tracks ${counts.size} distinct ${counts.size === 1 ? "value" : "values"}.`
        : `Increment ${formatNumber(value)} from ${previousCount} to ${nextCount}. The number of distinct keys stays ${counts.size}.`,
      prompt: "What invariant now holds for the processed prefix?"
    }));
  }

  const result = countFrequencies(values);
  trace.push({
    ...createStep({
      trace,
      phase: "complete",
      codeSteps: ["return"],
      values,
      counts,
      currentIndex: null,
      processedCount: values.length,
      previousCount: null,
      nextCount: null,
      changedKey: null,
      complete: true,
      narration: `The ${values.length} input values produce ${counts.size} distinct ${counts.size === 1 ? "key" : "keys"}. Every stored count now belongs to the result.`,
      prompt: "Why is the extra space O(k) rather than always O(n)?"
    }),
    result
  });

  return trace;
}

export function frequencyLookupKey(value) {
  if (!Number.isFinite(value)) {
    throw new Error("Frequency lookup keys require finite numbers.");
  }
  return String(normalizedFrequencyValue(value));
}

function createStep({
  trace,
  phase,
  codeSteps,
  values,
  counts,
  currentIndex,
  processedCount,
  previousCount,
  nextCount,
  changedKey,
  narration,
  prompt,
  complete = false
}) {
  const currentValue = currentIndex === null ? null : normalizedFrequencyValue(values[currentIndex]);
  const currentKey = currentValue === null ? null : frequencyLookupKey(currentValue);
  return {
    step: trace.length,
    phase,
    codeSteps,
    currentIndex,
    currentValue,
    currentKey,
    processedCount,
    distinctCount: counts.size,
    previousCount,
    nextCount,
    views: {
      values: buildArrayView(values, currentIndex, processedCount, phase, complete),
      counts: buildLookupView(counts, currentKey, changedKey, complete)
    },
    narration,
    prompt
  };
}

function buildArrayView(values, currentIndex, processedCount, phase, complete) {
  const currentProcessed = phase === "add-key" || phase === "increment-count";
  const prefixLength = complete
    ? values.length
    : Math.max(processedCount, currentProcessed && currentIndex !== null ? currentIndex + 1 : 0);
  return {
    values: [...values],
    activeIndices: currentIndex === null ? [] : [currentIndex],
    ranges: prefixLength > 0
      ? [{ start: 0, end: prefixLength - 1, kind: "counted", label: "counted prefix" }]
      : [],
    markers: currentIndex === null
      ? []
      : [{ index: currentIndex, kind: "read", label: "read" }],
    annotations: currentProcessed && currentIndex !== null
      ? [{ index: currentIndex, label: "count recorded" }]
      : [],
    changedIndices: []
  };
}

function buildLookupView(counts, currentKey, changedKey, complete) {
  return {
    entries: [...counts.entries()].map(([key, entry]) => ({
      key,
      value: entry.count,
      state: key === changedKey ? "updated" : "counted"
    })),
    activeKeys: currentKey !== null && counts.has(currentKey) ? [currentKey] : [],
    annotations: changedKey !== null && counts.has(changedKey)
      ? [{ key: changedKey, label: `count is ${counts.get(changedKey).count}` }]
      : [],
    resultKeys: complete ? [...counts.keys()] : []
  };
}

function normalizedFrequencyValue(value) {
  return Object.is(value, -0) ? 0 : value;
}
