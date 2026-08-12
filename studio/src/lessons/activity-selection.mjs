import {
  formatActivityList,
  maximumActivityIntervals,
  parseActivityList,
  selectActivities
} from "../../../greedy/activity-selection.mjs";
import { buildActivitySelectionTrace } from "../activity-selection.mjs";
import { formatNumber } from "../input.mjs";

export const activitySelectionLesson = {
  id: "greedy/activity-selection",
  order: 48,
  topic: "Greedy",
  prerequisites: ["patterns/merge-intervals"],
  patterns: ["greedy", "intervals"],
  catalogLabel: "Activity Selection",
  catalogDescription: "Choose each earliest-finishing compatible activity while preserving its original schedule identity.",
  title: "Select the largest compatible activity schedule",
  summary: "Sort by finish time, accept the next activity whose start reaches the current boundary, and reject overlaps without revisiting earlier choices.",
  views: [
    { id: "activities", renderer: "grid", heading: "Finish-sorted activities (start, end)" },
    { id: "decisions", renderer: "lookup", heading: "Original activity decisions" }
  ],
  input: {
    heading: "Your candidate activities",
    fields: [{
      id: "intervals",
      label: `Enter 1-${maximumActivityIntervals} comma-separated start:end activities`,
      type: "text",
      inputMode: "text",
      placeholder: "5:7, 1:4, 3:5, 8:11"
    }],
    help: "Use finite start:end values with start < end. Activities are [start, end), so one may start exactly when another finishes.",
    defaultValue: {
      intervals: [
        { start: 5, end: 7 },
        { start: 1, end: 4 },
        { start: 3, end: 5 },
        { start: 8, end: 11 },
        { start: 6, end: 10 },
        { start: 5, end: 9 }
      ]
    },
    sampleValue: {
      intervals: [
        { start: -3, end: -1 },
        { start: -1, end: 2 },
        { start: 0, end: 1 },
        { start: 2, end: 3 },
        { start: 2, end: 4 }
      ]
    },
    parse: ({ intervals }) => ({ intervals: parseActivityList(intervals) }),
    serialize: ({ intervals }) => ({ intervals: formatActivityList(intervals) })
  },
  solve: ({ intervals }) => selectActivities(intervals),
  buildTrace: ({ intervals }) => buildActivitySelectionTrace(intervals),
  code: {
    title: "Commit to the earliest compatible finish",
    filename: "activity-selection.mjs",
    sourcePath: "greedy/activity-selection.mjs",
    lines: [
      { number: 70, text: "export function selectActivities(intervals) {", steps: ["function"] },
      { number: 71, text: "  const sorted = sortActivitiesByFinish(intervals);", steps: ["sort-by-finish"] },
      { number: 72, text: "  const selected = [];", steps: ["sort-by-finish"] },
      { number: 73, text: "  let lastFinish = null;", steps: ["sort-by-finish"] },
      { number: 75, text: "  for (const activity of sorted) {", steps: ["scan"] },
      { number: 76, text: "    if (lastFinish === null || activity.start >= lastFinish) {", steps: ["check-compatible", "reject"] },
      { number: 77, text: "      selected.push({ ...activity });", steps: ["accept"] },
      { number: 78, text: "      lastFinish = activity.end;", steps: ["advance-finish"] },
      { number: 38, text: "    }", steps: ["check-compatible"] },
      { number: 81, text: "  return selected;", steps: ["return-selected"] },
      { number: 11, text: "}", steps: ["function"] }
    ]
  },
  stats: [
    {
      label: "Processed",
      value: (step) => `${step.processedCount}/${step.sourceCount}`,
      detail: () => "finish-sorted candidates"
    },
    {
      label: "Current",
      value: (step) => step.currentActivityId ?? "-",
      detail: (step) => step.currentActivity === null
        ? "no activity active"
        : `[${formatNumber(step.currentActivity.start)}, ${formatNumber(step.currentActivity.end)})`
    },
    {
      label: "Finish boundary",
      value: (step) => step.lastFinish === null ? "none" : formatNumber(step.lastFinish),
      detail: () => "next start must reach this"
    },
    {
      label: "Selected",
      accent: true,
      value: (step) => String(step.acceptedCount),
      detail: (step) => `${step.rejectedCount} rejected, ${step.pendingCount} pending`
    }
  ],
  complexity: {
    chip: "EARLIEST FINISH",
    time: "O(n log n)",
    space: "O(n)",
    explanation: "Sorting copied activities by finish dominates the O(n) scan. Stable identity records and the immutable selected result use O(n) space."
  },
  guide: {
    heading: "An earlier finish never leaves less room afterward."
  },
  legend: [
    { kind: "pending", label: "not considered yet" },
    { kind: "candidate", label: "current candidate" },
    { kind: "accepted", label: "compatible and selected" },
    { kind: "rejected", label: "overlaps selected schedule" },
    { kind: "selected", label: "final selected activity" }
  ],
  reflection: {
    eyebrow: "BEFORE YOU MOVE ON",
    title: "Why is the first greedy choice safe?",
    body: "Take any optimal schedule and compare its first activity with the greedy earliest finisher. Replacing that first activity cannot reduce the remaining time, so the rest of the optimal schedule still fits. Explain how repeating that exchange proves the whole greedy schedule is optimal."
  }
};
