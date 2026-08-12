import { findDuplicates } from "../../../hash-maps-and-sets/find-duplicates.mjs";
import { formatNumber, parseNumberList } from "../input.mjs";
import { buildFindDuplicatesTrace } from "../find-duplicates.mjs";

export const findDuplicatesLesson = {
  id: "hash-maps-and-sets/find-duplicates",
  order: 14,
  topic: "Hash Maps and Sets",
  prerequisites: ["arrays/pair-sum"],
  patterns: ["set-membership", "duplicate-detection"],
  catalogLabel: "Find Duplicates",
  catalogDescription: "Use set membership to classify first sightings and repeated values.",
  title: "Find duplicates with a set",
  summary: "Scan once. Remember each first occurrence, report a value when it repeats, and keep the output free of duplicate duplicates.",
  views: [
    { id: "values", renderer: "array", heading: "Input values" },
    { id: "seen", renderer: "lookup", heading: "Seen set" }
  ],
  input: {
    fields: [{
      id: "values",
      label: "Enter 1–12 finite numbers",
      type: "text",
      inputMode: "decimal",
      placeholder: "4, 2, 7, 2, 4, 4, 9"
    }],
    help: "Each duplicate appears once in the result, ordered by where its second occurrence is discovered.",
    defaultValue: { values: [4, 2, 7, 2, 4, 4, 9] },
    sampleValue: { values: [1, 2, 3, 4] },
    parse: (fields) => ({ values: parseNumberList(fields.values) }),
    serialize: ({ values }) => ({ values: values.map(formatNumber).join(", ") })
  },
  solve: ({ values }) => findDuplicates(values),
  buildTrace: ({ values }) => buildFindDuplicatesTrace(values),
  code: {
    title: "Classify by membership",
    filename: "find-duplicates.mjs",
    sourcePath: "hash-maps-and-sets/find-duplicates.mjs",
    lines: [
      { number: 23, text: "export function findDuplicates(values) {", steps: ["function"] },
      { number: 24, text: "  validateFindDuplicatesInput(values);", steps: ["initialize-sets"] },
      { number: 17, text: "", steps: ["initialize-sets"] },
      { number: 26, text: "  const seen = new Set();", steps: ["initialize-sets"] },
      { number: 27, text: "  const emitted = new Set();", steps: ["initialize-sets"] },
      { number: 28, text: "  const duplicates = [];", steps: ["initialize-sets"] },
      { number: 2, text: "", steps: ["scan-value"] },
      { number: 30, text: "  for (const value of values) {", steps: ["scan-value"] },
      { number: 31, text: "    if (seen.has(value)) {", steps: ["check-seen"] },
      { number: 32, text: "      if (!emitted.has(value)) {", steps: ["check-emitted"] },
      { number: 33, text: "        duplicates.push(canonicalResultValue(value));", steps: ["append-duplicate"] },
      { number: 34, text: "        emitted.add(value);", steps: ["mark-emitted"] },
      { number: 35, text: "      }", steps: ["check-emitted"] },
      { number: 36, text: "    } else {", steps: ["check-seen"] },
      { number: 37, text: "      seen.add(value);", steps: ["record-seen"] },
      { number: 13, text: "    }", steps: ["check-seen"] },
      { number: 6, text: "  }", steps: ["scan-value"] },
      { number: 2, text: "", steps: ["return-duplicates"] },
      { number: 41, text: "  return duplicates;", steps: ["return-duplicates"] },
      { number: 16, text: "}", steps: ["function"] }
    ]
  },
  stats: [
    {
      label: "Current index",
      value: (step) => step.currentIndex === null ? "—" : String(step.currentIndex),
      detail: (step) => step.currentValue === null ? "scan not started" : `value ${formatNumber(step.currentValue)}`
    },
    {
      label: "Occurrence",
      value: (step) => occurrenceLabel(step.occurrence),
      detail: (step) => step.occurrence <= 1 ? "membership decides this" : "already present in seen"
    },
    {
      label: "Distinct seen",
      value: (step) => String(step.distinctSeen),
      detail: () => "unique Set members"
    },
    {
      label: "Duplicates",
      accent: true,
      value: (step) => String(step.duplicateCount),
      detail: (step) => step.duplicates.length === 0
        ? "none discovered yet"
        : step.duplicates.map(formatNumber).join(", ")
    }
  ],
  complexity: {
    chip: "SET MEMBERSHIP",
    time: "O(n)",
    space: "O(n)",
    explanation: "Each value performs average O(1) Set membership work, so one scan takes O(n) average time. Seen, emitted, and the result may together store O(n) values."
  },
  guide: {
    heading: "Report the second sighting once."
  },
  legend: [
    { kind: "active", label: "current value" },
    { kind: "seen", label: "seen once" },
    { kind: "duplicate", label: "duplicate" }
  ],
  reflection: {
    eyebrow: "BEFORE YOU MOVE ON",
    title: "Which occurrence earns a place in the result?",
    body: "Try an all-unique array, one value repeated many times, interleaved duplicates, and -0 with 0. Explain why the second occurrence determines output order and why a separate emitted set prevents repeated results."
  }
};

function occurrenceLabel(occurrence) {
  if (occurrence === 1) return "first";
  if (occurrence === 2) return "second";
  if (occurrence >= 3) return "later";
  return "—";
}
