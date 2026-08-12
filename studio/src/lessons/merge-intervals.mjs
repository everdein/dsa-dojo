import {
  formatIntervalList,
  maximumMergeIntervals,
  mergeIntervals,
  parseIntervalList
} from "../../../patterns/intervals/merge-intervals.mjs";
import { buildMergeIntervalsTrace } from "../merge-intervals.mjs";

export const mergeIntervalsLesson = {
  id: "patterns/merge-intervals",
  order: 23,
  topic: "Patterns",
  prerequisites: ["arrays/move-zeros"],
  patterns: ["intervals", "sorting", "linear-scan"],
  catalogLabel: "Merge Intervals",
  catalogDescription: "Sort closed intervals, then absorb every overlap into one active output.",
  title: "Merge overlapping closed intervals",
  summary: "Sort by start, carry one current output interval, and either contain, extend, or append each next interval in a single scan.",
  renderer: "grid",
  input: {
    heading: "Your closed intervals",
    fields: [{
      id: "intervals",
      label: `Enter 1-${maximumMergeIntervals} comma-separated start:end intervals`,
      type: "text",
      inputMode: "text",
      placeholder: "1:3, 2:6, 8:10"
    }],
    help: "Use a colon between finite endpoints so negative values remain unambiguous. Every start must be at or before its end.",
    defaultValue: {
      intervals: [
        { start: 8, end: 10 },
        { start: 1, end: 3 },
        { start: 2, end: 6 },
        { start: 10, end: 12 }
      ]
    },
    sampleValue: {
      intervals: [
        { start: -4, end: -1 },
        { start: -2, end: 4 },
        { start: 6, end: 7 }
      ]
    },
    parse: ({ intervals }) => ({ intervals: parseIntervalList(intervals) }),
    serialize: ({ intervals }) => ({ intervals: formatIntervalList(intervals) })
  },
  solve: ({ intervals }) => mergeIntervals(intervals),
  buildTrace: ({ intervals }) => buildMergeIntervalsTrace(intervals),
  code: {
    title: "Sort once, then extend one current interval",
    filename: "merge-intervals.mjs",
    sourcePath: "patterns/intervals/merge-intervals.mjs",
    lines: [
      { number: 83, text: "export function mergeIntervals(intervals) {", steps: ["function"] },
      { number: 84, text: "  const sorted = sortIntervalsByStart(intervals);", steps: ["sort"] },
      { number: 85, text: "  const merged = [];", steps: ["sort"] },
      { number: 87, text: "  for (const interval of sorted) {", steps: ["scan"] },
      { number: 88, text: "    const current = merged.at(-1);", steps: ["compare"] },
      { number: 89, text: "    if (!current || interval.start > current.end) {", steps: ["seed", "compare"] },
      { number: 90, text: "      merged.push({ ...interval });", steps: ["seed", "append"] },
      { number: 91, text: "      continue;", steps: ["append"] },
      { number: 93, text: "    if (interval.end > current.end) current.end = interval.end;", steps: ["contain", "extend"] },
      { number: 94, text: "  }", steps: ["scan"] },
      { number: 96, text: "  return merged;", steps: ["return"] },
      { number: 97, text: "}", steps: ["function"] }
    ]
  },
  stats: [
    {
      label: "Processed",
      value: (step) => `${step.processedCount}/${step.sourceCount}`,
      detail: () => "sorted intervals"
    },
    {
      label: "Output count",
      value: (step) => String(step.outputCount),
      detail: () => "disjoint so far"
    },
    {
      label: "Current output",
      accent: true,
      value: (step) => formatInterval(step.currentInterval),
      detail: (step) => phaseLabel(step.phase)
    },
    {
      label: "Visible rows",
      value: (step) => `${step.visibleStart + 1}-${step.visibleEnd + 1}`,
      detail: (step) => step.hiddenBefore + step.hiddenAfter === 0
        ? "all rows shown"
        : `${step.hiddenBefore + step.hiddenAfter} outside viewport`
    }
  ],
  complexity: {
    chip: "SORT + SCAN",
    time: "O(n log n)",
    space: "O(n)",
    explanation: "Sorting the copied intervals dominates the running time. The linear merge scan and immutable output each use at most one entry per input interval."
  },
  guide: {
    heading: "Only the latest output interval can overlap the next sorted start."
  },
  legend: [
    { kind: "sorted", label: "sorted first" },
    { kind: "current", label: "current output" },
    { kind: "candidate", label: "next interval" },
    { kind: "contained", label: "already covered" },
    { kind: "merged", label: "extended output" },
    { kind: "output", label: "new disjoint output" },
    { kind: "result", label: "final interval" }
  ],
  reflection: {
    eyebrow: "BEFORE YOU MOVE ON",
    title: "Why does sorting reduce every overlap decision to one comparison?",
    body: "State why an interval that starts after the current end cannot overlap any earlier emitted interval. Then explain why touching endpoints merge for closed intervals."
  }
};

function formatInterval(interval) {
  if (interval === null) return "-";
  return `[${formatEndpoint(interval.start)}, ${formatEndpoint(interval.end)}]`;
}

function formatEndpoint(value) {
  return Object.is(value, -0) ? "-0" : String(value);
}

function phaseLabel(phase) {
  if (phase === "initialize") return "sorted copy";
  if (phase === "seed") return "first output";
  if (phase === "compare") return "checking next";
  if (phase === "contain") return "contained";
  if (phase === "merge") return "extended";
  if (phase === "append") return "new output";
  return "complete";
}
