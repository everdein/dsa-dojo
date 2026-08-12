import {
  formatHeapProgram,
  maximumHeapOperations,
  parseHeapProgram,
  runHeapOperations
} from "../../../heaps-and-priority-queues/heap-operations.mjs";
import { buildHeapOperationsTrace } from "../heap-operations.mjs";
import { formatNumber } from "../input.mjs";

export const heapOperationsLesson = {
  id: "heaps-and-priority-queues/heap-operations",
  order: 30,
  topic: "Heaps and Priority Queues",
  prerequisites: ["arrays/reverse-array", "trees/inorder-traversal"],
  patterns: ["heap", "complete-tree", "sift"],
  catalogLabel: "Heap Insert and Remove",
  catalogDescription: "Keep the minimum at the root by sifting new and replacement values through a complete tree.",
  title: "Insert and remove from a min-heap",
  summary: "Append and sift up to insert. Move the last value to the root and sift down to remove the minimum without breaking complete-tree shape.",
  views: [
    { id: "heap", renderer: "array", heading: "Heap array" },
    { id: "tree", renderer: "branching", heading: "Complete-tree view" }
  ],
  input: {
    fields: [{
      id: "program",
      label: `Enter 1-${maximumHeapOperations} comma-separated operations`,
      type: "text",
      inputMode: "text",
      placeholder: "insert 5, insert 2, remove, insert 7"
    }],
    help: "Use insert followed by a finite number, or remove after at least one value has been inserted and not removed.",
    defaultValue: { operations: [
      { type: "insert", value: 5 },
      { type: "insert", value: 2 },
      { type: "insert", value: 7 },
      { type: "insert", value: 1 },
      { type: "remove" },
      { type: "insert", value: 3 },
      { type: "remove" }
    ] },
    sampleValue: { operations: [
      { type: "insert", value: -2 },
      { type: "insert", value: -2 },
      { type: "insert", value: 4 },
      { type: "remove" },
      { type: "remove" }
    ] },
    parse: ({ program }) => ({ operations: parseHeapProgram(program) }),
    serialize: ({ operations }) => ({ program: formatHeapProgram(operations) })
  },
  solve: ({ operations }) => runHeapOperations(operations),
  buildTrace: ({ operations }) => buildHeapOperationsTrace(operations),
  code: {
    title: "Restore order along one tree path",
    filename: "heap-operations.mjs",
    sourcePath: "heaps-and-priority-queues/heap-operations.mjs",
    lines: [
      { number: 121, text: "export function runHeapOperations(operations) {", steps: ["function"] },
      { number: 122, text: "  validateHeapOperations(operations);", steps: ["initialize"] },
      { number: 124, text: "  const heap = [];", steps: ["initialize"] },
      { number: 125, text: "  const removed = [];", steps: ["initialize"] },
      { number: 126, text: "  for (let operationIndex = 0; operationIndex < operations.length; operationIndex += 1) {", steps: ["read-operation"] },
      { number: 127, text: "    const operation = operations[operationIndex];", steps: ["read-operation"] },
      { number: 128, text: "    if (operation.type === \"insert\") {", steps: ["append-value"] },
      { number: 129, text: "      heap.push(operation.value);", steps: ["append-value"] },
      { number: 130, text: "      siftUpMinHeap(heap);", steps: ["compare-parent", "swap-up"] },
      { number: 134, text: "    const minimum = heap[0];", steps: ["read-minimum"] },
      { number: 135, text: "    const last = heap.pop();", steps: ["remove-last"] },
      { number: 137, text: "      heap[0] = last;", steps: ["replace-root"] },
      { number: 138, text: "      siftDownMinHeap(heap);", steps: ["choose-smaller-child", "swap-down"] },
      { number: 140, text: "    removed.push({ operationIndex, type: \"remove\", value: minimum });", steps: ["record-removal"] },
      { number: 143, text: "  return { removed, heap };", steps: ["return-result"] },
      { number: 144, text: "}", steps: ["function"] }
    ]
  },
  stats: [
    {
      label: "Operation",
      value: (step) => step.operation === null ? "-" : operationLabel(step.operation),
      detail: (step) => step.operationIndex === null ? "program boundary" : `instruction ${step.operationIndex}`
    },
    {
      label: "Heap size",
      value: (step) => String(step.heapSize),
      detail: (step) => step.heapOrdered ? "min-heap order holds" : "sift still restoring order"
    },
    {
      label: "Minimum",
      value: (step) => step.minimum === null ? "-" : formatNumber(step.minimum),
      detail: () => "array index 0"
    },
    {
      label: "Removed",
      accent: true,
      value: (step) => String(step.removedCount),
      detail: (step) => step.latestRemoval
        ? `latest ${formatNumber(step.latestRemoval.value)}`
        : "none yet"
    }
  ],
  complexity: {
    chip: "SIFT ONE PATH",
    time: "O(m log m)",
    space: "O(m)",
    explanation: "Each insert or remove follows at most the tree height, O(log n). Across m operations this is O(m log m); heap storage and observable removal records are O(m)."
  },
  guide: {
    heading: "Shape first, order second."
  },
  legend: [
    { kind: "minimum", label: "minimum at the root" },
    { kind: "inserted", label: "newly appended leaf" },
    { kind: "rising", label: "smaller value moving up" },
    { kind: "falling", label: "larger value moving down" },
    { kind: "replacement", label: "last value moved to root" }
  ],
  reflection: {
    eyebrow: "BEFORE YOU MOVE ON",
    title: "Why move the last value to the root?",
    body: "Try duplicate minima, negative values, and removing a singleton heap. Explain how using the last array cell preserves complete-tree shape and why only one downward path can violate heap order."
  }
};

function operationLabel(operation) {
  return operation.type === "insert"
    ? `insert ${formatNumber(operation.value)}`
    : "remove";
}
