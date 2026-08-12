import {
  longestConsecutive,
  maximumConsecutiveValues,
  validateLongestConsecutiveInput
} from "../../../arrays/longest-consecutive.mjs";
import { buildLongestConsecutiveTrace } from "../longest-consecutive.mjs";
import { formatNumber, parseNumberList } from "../input.mjs";

export const longestConsecutiveLesson = {
  id: "arrays/longest-consecutive",
  order: 15,
  topic: "Arrays",
  catalogLabel: "Longest Consecutive Sequence",
  catalogDescription: "Find sequence starts, then grow only the runs that matter.",
  title: "Find the longest consecutive sequence",
  summary: "Put every distinct safe integer in a Set. A value starts a streak only when its predecessor is absent, so middle values never repeat the same walk.",
  prerequisites: ["hash-maps-and-sets/find-duplicates"],
  patterns: ["set-membership", "sequence-start"],
  views: [
    { id: "values", renderer: "array", heading: "Input values" },
    { id: "set", renderer: "lookup", heading: "Membership set" }
  ],
  input: {
    fields: [{
      id: "values",
      label: `Enter 1-${maximumConsecutiveValues} safe integers`,
      type: "text",
      inputMode: "numeric",
      placeholder: "100, 4, 200, 1, 3, 2"
    }],
    help: "Use comma-separated safe integers. Decimals and integers outside JavaScript's safe range are rejected because +1 and -1 must stay exact.",
    defaultValue: { values: [100, 4, 200, 1, 3, 2] },
    sampleValue: { values: [0, 3, 7, 2, 5, 8, 4, 6, 0, 1] },
    parse: (fields) => {
      const values = parseNumberList(fields.values, {
        maximumLength: maximumConsecutiveValues
      });
      validateLongestConsecutiveInput(values);
      return { values };
    },
    serialize: ({ values }) => ({
      values: values.map(formatNumber).join(", ")
    })
  },
  solve: ({ values }) => longestConsecutive(values),
  buildTrace: ({ values }) => buildLongestConsecutiveTrace(values),
  code: {
    title: "Start only where the predecessor is absent",
    filename: "longest-consecutive.mjs",
    sourcePath: "arrays/longest-consecutive.mjs",
    lines: [
      { number: 27, text: "export function longestConsecutive(values) {", steps: ["function"] },
      { number: 28, text: "  validateLongestConsecutiveInput(values);", steps: ["initialize-set"] },
      { number: 30, text: "  const uniqueValues = [...new Set(values.map(normalizeConsecutiveValue))];", steps: ["initialize-set"] },
      { number: 31, text: "  const valueSet = new Set(uniqueValues);", steps: ["initialize-set"] },
      { number: 32, text: "  let best = null;", steps: ["initialize-set"] },
      { number: 34, text: "  for (const start of uniqueValues) {", steps: ["check-predecessor"] },
      { number: 35, text: "    const hasPredecessor = start > Number.MIN_SAFE_INTEGER && valueSet.has(start - 1);", steps: ["check-predecessor"] },
      { number: 36, text: "    if (hasPredecessor) continue;", steps: ["skip-non-start"] },
      { number: 38, text: "    const streakValues = [start];", steps: ["start-streak"] },
      { number: 39, text: "    let end = start;", steps: ["start-streak"] },
      { number: 40, text: "    while (end < Number.MAX_SAFE_INTEGER && valueSet.has(end + 1)) {", steps: ["extend-streak"] },
      { number: 41, text: "      end += 1;", steps: ["extend-streak"] },
      { number: 42, text: "      streakValues.push(end);", steps: ["extend-streak"] },
      { number: 45, text: "    const candidate = {", steps: ["compare-best"] },
      { number: 46, text: "      length: streakValues.length,", steps: ["compare-best"] },
      { number: 47, text: "      start,", steps: ["compare-best"] },
      { number: 48, text: "      end,", steps: ["compare-best"] },
      { number: 49, text: "      values: streakValues", steps: ["compare-best"] },
      { number: 50, text: "    };", steps: ["compare-best"] },
      { number: 51, text: "    if (best === null || candidate.length > best.length) best = candidate;", steps: ["update-best", "keep-best"] },
      { number: 54, text: "  return { ...best, values: [...best.values] };", steps: ["return"] },
      { number: 55, text: "}", steps: ["function"] }
    ]
  },
  stats: [
    {
      label: "Current value",
      value: (step) => step.currentValue === null ? "-" : formatNumber(step.currentValue)
    },
    {
      label: "Distinct checked",
      value: (step) => `${step.processedCount} / ${step.uniqueCount}`
    },
    {
      label: "Candidate length",
      value: (step) => String(step.candidateLength)
    },
    {
      label: "Best length",
      accent: true,
      value: (step) => String(step.bestLength),
      detail: (step) => step.bestLength === 0
        ? "no sequence measured yet"
        : `${formatNumber(step.bestStart)} through ${formatNumber(step.bestEnd)}`
    }
  ],
  complexity: {
    chip: "STARTS ONLY",
    time: "O(n) average",
    space: "O(n)",
    explanation: "Building the Set takes O(n) expected time. Each distinct value is checked once, and only sequence starts launch an extension, so each member participates in at most one full streak walk. The Set stores at most n values. Reversible studio snapshots are separate visualization history."
  },
  guide: {
    heading: "A missing predecessor identifies the only useful starting points."
  },
  legend: [
    { kind: "inspect", label: "checking membership" },
    { kind: "candidate", label: "current streak" },
    { kind: "best", label: "best streak" }
  ],
  reflection: {
    eyebrow: "BEFORE YOU MOVE ON",
    title: "Why not grow a streak from every value?",
    body: "Compare a sequence start with one of its middle values. Explain how the predecessor check prevents the middle value from repeating work the start already performed."
  }
};
