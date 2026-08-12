import {
  longestConsecutive,
  normalizeConsecutiveValue,
  validateLongestConsecutiveInput
} from "../../arrays/longest-consecutive.mjs";
import { formatNumber } from "./input.mjs";

export { longestConsecutive };

export function buildLongestConsecutiveTrace(values) {
  validateLongestConsecutiveInput(values);

  const normalizedValues = values.map(normalizeConsecutiveValue);
  const uniqueValues = [...new Set(normalizedValues)];
  const valueSet = new Set(uniqueValues);
  const firstIndexByValue = new Map();
  normalizedValues.forEach((value, index) => {
    if (!firstIndexByValue.has(value)) firstIndexByValue.set(value, index);
  });

  const checkedValues = new Set();
  const sequenceStarts = new Set();
  const trace = [];
  let best = null;

  trace.push(createStep({
    trace,
    phase: "initialize",
    codeSteps: ["initialize-set"],
    values,
    uniqueValues,
    firstIndexByValue,
    checkedValues,
    sequenceStarts,
    best,
    currentValue: null,
    predecessor: null,
    isSequenceStart: null,
    currentRun: [],
    activeValues: [],
    annotation: null,
    narration: `Build a Set with ${uniqueValues.length} distinct ${uniqueValues.length === 1 ? "value" : "values"}. Membership checks can now avoid a nested scan.`,
    prompt: "Which values could begin a sequence rather than continue one?"
  }));

  for (const value of uniqueValues) {
    const predecessor = value > Number.MIN_SAFE_INTEGER ? value - 1 : null;
    const hasPredecessor = predecessor !== null && valueSet.has(predecessor);
    checkedValues.add(value);

    trace.push(createStep({
      trace,
      phase: "check-start",
      codeSteps: hasPredecessor
        ? ["check-predecessor", "skip-non-start"]
        : ["check-predecessor"],
      values,
      uniqueValues,
      firstIndexByValue,
      checkedValues,
      sequenceStarts,
      best,
      currentValue: value,
      predecessor,
      isSequenceStart: !hasPredecessor,
      currentRun: [],
      activeValues: [value],
      annotation: {
        value,
        label: predecessor === null
          ? "minimum safe integer: no in-domain predecessor"
          : hasPredecessor
            ? `${formatNumber(predecessor)} is present`
            : `${formatNumber(predecessor)} is absent`
      },
      narration: hasPredecessor
        ? `${formatNumber(value)} follows ${formatNumber(predecessor)}, so it belongs to a sequence that must be measured from an earlier value.`
        : predecessor === null
          ? `${formatNumber(value)} is the minimum safe integer, so no accepted input can contain its predecessor. It starts a sequence.`
          : `${formatNumber(predecessor)} is absent, so ${formatNumber(value)} is a sequence start.`,
      prompt: hasPredecessor
        ? "Why would measuring from this middle value repeat work?"
        : "How far can this sequence extend through Set membership checks?"
    }));

    if (hasPredecessor) continue;

    sequenceStarts.add(value);
    const currentRun = [value];
    let end = value;
    trace.push(createStep({
      trace,
      phase: "start-streak",
      codeSteps: ["start-streak"],
      values,
      uniqueValues,
      firstIndexByValue,
      checkedValues,
      sequenceStarts,
      best,
      currentValue: value,
      predecessor,
      isSequenceStart: true,
      currentRun,
      activeValues: currentRun,
      annotation: { value, label: "sequence starts here" },
      narration: `Start a candidate streak at ${formatNumber(value)} with length 1.`,
      prompt: "Is the next safe integer also present in the Set?"
    }));

    while (end < Number.MAX_SAFE_INTEGER && valueSet.has(end + 1)) {
      end += 1;
      currentRun.push(end);
      trace.push(createStep({
        trace,
        phase: "extend-streak",
        codeSteps: ["extend-streak"],
        values,
        uniqueValues,
        firstIndexByValue,
        checkedValues,
        sequenceStarts,
        best,
        currentValue: end,
        predecessor: end - 1,
        isSequenceStart: false,
        currentRun,
        activeValues: currentRun,
        annotation: { value: end, label: `candidate length ${currentRun.length}` },
        narration: `${formatNumber(end)} is present, extending the candidate streak to length ${currentRun.length}.`,
        prompt: end === Number.MAX_SAFE_INTEGER
          ? "The safe-integer boundary ends this streak. How does its length compare with the best?"
          : `Does the Set also contain ${formatNumber(end + 1)}?`
      }));
    }

    const candidate = {
      length: currentRun.length,
      start: value,
      end,
      values: [...currentRun]
    };
    const improved = best === null || candidate.length > best.length;
    if (improved) best = candidate;

    trace.push(createStep({
      trace,
      phase: improved ? "update-best" : "keep-best",
      codeSteps: improved ? ["compare-best", "update-best"] : ["compare-best", "keep-best"],
      values,
      uniqueValues,
      firstIndexByValue,
      checkedValues,
      sequenceStarts,
      best,
      currentValue: value,
      predecessor,
      isSequenceStart: true,
      currentRun,
      activeValues: currentRun,
      annotation: {
        value,
        label: improved ? `new best: length ${candidate.length}` : `candidate: length ${candidate.length}`
      },
      narration: improved
        ? `${formatRun(candidate.values)} becomes the best streak with length ${candidate.length}.`
        : `${formatRun(candidate.values)} has length ${candidate.length}, so the earlier best streak remains.`,
      prompt: improved
        ? "Which unchecked values can be skipped because their predecessor exists?"
        : "Why does an equal-length candidate not replace the earlier best?"
    }));
  }

  const result = longestConsecutive(values);
  trace.push({
    ...createStep({
      trace,
      phase: "complete",
      codeSteps: ["return"],
      values,
      uniqueValues,
      firstIndexByValue,
      checkedValues,
      sequenceStarts,
      best: result,
      currentValue: null,
      predecessor: null,
      isSequenceStart: null,
      currentRun: [],
      activeValues: [],
      annotation: null,
      narration: `${formatRun(result.values)} is the longest consecutive sequence, with length ${result.length}.`,
      prompt: "How did checking only sequence starts keep the expected running time linear?"
    }),
    result: cloneRun(result)
  });

  return trace;
}

export function consecutiveLookupKey(value) {
  if (!Number.isSafeInteger(value)) {
    throw new Error("Consecutive lookup keys require safe integers.");
  }
  return String(normalizeConsecutiveValue(value));
}

function createStep({
  trace,
  phase,
  codeSteps,
  values,
  uniqueValues,
  firstIndexByValue,
  checkedValues,
  sequenceStarts,
  best,
  currentValue,
  predecessor,
  isSequenceStart,
  currentRun,
  activeValues,
  annotation,
  narration,
  prompt
}) {
  const currentIndex = currentValue === null ? null : firstIndexByValue.get(currentValue);
  return {
    step: trace.length,
    phase,
    codeSteps,
    currentIndex,
    currentValue,
    predecessor,
    isSequenceStart,
    processedCount: checkedValues.size,
    uniqueCount: uniqueValues.length,
    candidateLength: currentRun.length,
    candidateStart: currentRun.length === 0 ? null : currentRun[0],
    candidateEnd: currentRun.length === 0 ? null : currentRun.at(-1),
    currentRun: [...currentRun],
    bestLength: best?.length ?? 0,
    bestStart: best?.start ?? null,
    bestEnd: best?.end ?? null,
    bestValues: best ? [...best.values] : [],
    views: {
      values: buildArrayView(values, firstIndexByValue, activeValues, best, currentIndex, annotation),
      set: buildSetView({
        uniqueValues,
        activeValues,
        currentRun,
        checkedValues,
        sequenceStarts,
        best,
        annotation
      })
    },
    narration,
    prompt
  };
}

function buildArrayView(values, firstIndexByValue, activeValues, best, currentIndex, annotation) {
  const activeIndices = activeValues.map((value) => firstIndexByValue.get(value));
  const bestMarkers = (best?.values ?? []).map((value) => ({
    index: firstIndexByValue.get(value),
    kind: "best",
    label: "best streak"
  }));
  return {
    values: [...values],
    activeIndices,
    ranges: [],
    markers: currentIndex === null
      ? bestMarkers
      : [
          ...bestMarkers,
          { index: currentIndex, kind: "inspect", label: "current lookup" }
        ],
    annotations: annotation === null
      ? []
      : [{ index: firstIndexByValue.get(annotation.value), label: annotation.label }],
    changedIndices: []
  };
}

function buildSetView({
  uniqueValues,
  activeValues,
  currentRun,
  checkedValues,
  sequenceStarts,
  best,
  annotation
}) {
  const activeSet = new Set(activeValues);
  const runSet = new Set(currentRun);
  const bestSet = new Set(best?.values ?? []);
  return {
    entries: uniqueValues.map((value) => {
      const { state, status } = entryStatus(
        value,
        activeSet,
        runSet,
        bestSet,
        checkedValues,
        sequenceStarts
      );
      return { key: consecutiveLookupKey(value), value: status, state };
    }),
    activeKeys: activeValues.map(consecutiveLookupKey),
    annotations: annotation === null
      ? []
      : [{ key: consecutiveLookupKey(annotation.value), label: annotation.label }],
    resultKeys: (best?.values ?? []).map(consecutiveLookupKey)
  };
}

function entryStatus(value, activeSet, runSet, bestSet, checkedValues, sequenceStarts) {
  if (activeSet.has(value) && runSet.has(value)) {
    return { state: "candidate", status: "current streak" };
  }
  if (activeSet.has(value)) return { state: "inspect", status: "checking start" };
  if (bestSet.has(value)) return { state: "best", status: "best streak" };
  if (sequenceStarts.has(value)) return { state: "sequence-start", status: "sequence start" };
  if (checkedValues.has(value)) return { state: "not-start", status: "not a start" };
  return { state: "present", status: "present" };
}

function cloneRun(run) {
  return { ...run, values: [...run.values] };
}

function formatRun(values) {
  return `[${values.map(formatNumber).join(", ")}]`;
}
