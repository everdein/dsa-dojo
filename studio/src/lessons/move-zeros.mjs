import { moveZeros } from "../../../arrays/move-zeros.mjs";
import { formatNumber, parseNumberList } from "../input.mjs";
import { buildMoveZerosTrace } from "../move-zeros.mjs";

export const moveZerosLesson = {
  id: "arrays/move-zeros",
  order: 4,
  topic: "Arrays",
  prerequisites: ["arrays/find-largest"],
  patterns: ["two-pointers"],
  catalogLabel: "Move Zeros",
  catalogDescription: "Compact non-zero values with read and write pointers.",
  title: "Move zeros to the end",
  summary: "Scan with read. Use write to preserve the order of non-zero values while zeros collect at the end.",
  renderer: "array",
  input: {
    fields: [{
      id: "values",
      label: "Enter 1-12 finite numbers",
      type: "text",
      inputMode: "decimal",
      placeholder: "0, 1, 0, 3, 12"
    }],
    help: "Try leading zeros, consecutive zeros, no zeros, or an array made entirely of zeros.",
    defaultValue: { values: [0, 1, 0, 3, 12] },
    sampleValue: { values: [4, 0, -2, 0, 4, 0, 7] },
    parse: (fields) => ({ values: parseNumberList(fields.values) }),
    serialize: ({ values }) => ({ values: values.join(", ") })
  },
  solve: ({ values }) => moveZeros(values),
  buildTrace: ({ values }) => buildMoveZerosTrace(values),
  code: {
    title: "Protect a stable prefix",
    filename: "move-zeros.mjs",
    sourcePath: "arrays/move-zeros.mjs",
    lines: [
      { number: 1, text: "export function moveZeros(values) {", steps: ["function"] },
      { number: 2, text: "  validateMoveZerosInput(values);", steps: ["initialize"] },
      { number: 3, text: "  const result = [...values];", steps: ["initialize"] },
      { number: 4, text: "  let write = 0;", steps: ["initialize"] },
      { number: 5, text: "  for (let read = 0; read < result.length; read += 1) {", steps: ["inspect"] },
      { number: 6, text: "    if (result[read] === 0) continue;", steps: ["inspect"] },
      { number: 7, text: "    if (read !== write) {", steps: ["swap"] },
      { number: 8, text: "      const readValue = result[read];", steps: ["swap"] },
      { number: 9, text: "      result[read] = result[write];", steps: ["swap"] },
      { number: 10, text: "      result[write] = readValue;", steps: ["swap"] },
      { number: 11, text: "    }", steps: ["swap"] },
      { number: 12, text: "    write += 1;", steps: ["advance-write"] },
      { number: 13, text: "  }", steps: ["inspect"] },
      { number: 14, text: "  return result;", steps: ["return"] },
      { number: 15, text: "}", steps: ["function"] }
    ]
  },
  stats: [
    {
      label: "Read index",
      value: (step) => step.phase === "complete" ? "-" : String(step.readIndex),
      detail: (step) => step.phase === "complete" ? "scan complete" : `value ${formatNumber(step.readValue)}`
    },
    {
      label: "Write pointer",
      value: (step) => writePointerValue(step),
      detail: (step) => writePointerDetail(step)
    },
    {
      label: "Non-zeros placed",
      accent: true,
      value: (step) => `${step.nonZeroCount} / ${step.totalNonZeros}`,
      detail: (step) => `stable prefix: ${step.nonZeroCount} ${step.nonZeroCount === 1 ? "cell" : "cells"}`
    }
  ],
  complexity: {
    chip: "TWO POINTERS",
    time: "O(n)",
    space: "O(n)",
    spaceLabel: "total space",
    explanation: "The scan considers each value once. The returned copy occupies O(n) space because this public function preserves the caller's input. Beyond that required output, compaction uses O(1) auxiliary space."
  },
  guide: {
    heading: "Protect the invariant."
  },
  legend: [
    { kind: "read", label: "read pointer" },
    { kind: "write", label: "write pointer" },
    { kind: "changed", label: "moved now" },
    { kind: "settled", label: "stable prefix" }
  ],
  reflection: {
    eyebrow: "BEFORE YOU MOVE ON",
    title: "What does the write pointer guarantee?",
    body: "Write equals the number of non-zero values already placed and marks the next destination. When write trails read, explain why that destination must be zero and why moving a value there preserves relative order."
  }
};

function writePointerValue(step) {
  if (step.phase === "complete") return "-";
  return step.nextWriteIndex < step.view.values.length ? String(step.nextWriteIndex) : "done";
}

function writePointerDetail(step) {
  if (step.phase === "complete" || step.nextWriteIndex >= step.view.values.length) {
    return "all non-zeros placed";
  }
  return "next non-zero destination";
}
