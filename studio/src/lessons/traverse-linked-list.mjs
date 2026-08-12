import {
  createLinkedList
} from "../../../linked-lists/model.mjs";
import {
  traverseLinkedList
} from "../../../linked-lists/traverse-linked-list.mjs";
import { formatNumber, parseNumberList } from "../input.mjs";
import { buildTraverseLinkedListTrace } from "../traverse-linked-list.mjs";

export const traverseLinkedListLesson = {
  id: "linked-lists/traverse-linked-list",
  order: 5,
  topic: "Linked Lists",
  prerequisites: ["arrays/find-largest"],
  patterns: ["traversal"],
  catalogLabel: "Traverse List",
  catalogDescription: "Follow next references and record each node exactly once.",
  title: "Traverse a linked list",
  summary: "There is no index to increment. Start at the head, visit the current node, and follow next until current is null.",
  renderer: "linked-list",
  input: {
    fields: [{
      id: "values",
      label: "List values — up to 8 comma-separated numbers",
      type: "text",
      inputMode: "text",
      placeholder: "6, 3, 8, 2"
    }],
    help: "Leave the field blank for an empty list, or try a singleton, negatives, and duplicate values.",
    defaultValue: { values: [6, 3, 8, 2] },
    sampleValue: { values: [5, -1, 5] },
    parse: (fields) => ({ values: parseLinkedListValues(fields.values) }),
    serialize: ({ values }) => ({ values: values.join(", ") })
  },
  solve: ({ values }) => traverseLinkedList(createLinkedList(values)),
  buildTrace: ({ values }) => buildTraverseLinkedListTrace(values),
  code: {
    title: "Follow one reference at a time",
    filename: "traverse-linked-list.mjs",
    sourcePath: "linked-lists/traverse-linked-list.mjs",
    lines: [
      { number: 3, text: "export function traverseLinkedList(head) {", steps: ["function"] },
      { number: 4, text: "  validateAcyclicLinkedList(head);", steps: ["initialize"] },
      { number: 5, text: "  const values = [];", steps: ["initialize"] },
      { number: 6, text: "  let current = head;", steps: ["initialize"] },
      { number: 8, text: "  while (current !== null) {", steps: ["check-current"] },
      { number: 9, text: "    values.push(current.value);", steps: ["record-value"] },
      { number: 10, text: "    current = current.next;", steps: ["advance-current"] },
      { number: 11, text: "  }", steps: ["check-current"] },
      { number: 13, text: "  return values;", steps: ["return"] },
      { number: 14, text: "}", steps: ["function"] }
    ]
  },
  stats: [
    {
      label: "Current node",
      value: (step) => step.currentIndex === null ? "null" : String(step.currentIndex),
      detail: (step) => step.currentValue === null
        ? "end of the chain"
        : `value ${formatNumber(step.currentValue)}`
    },
    {
      label: "Nodes visited",
      value: (step) => `${step.visitedCount} / ${step.nodeCount}`,
      detail: () => "each reachable node once"
    },
    {
      label: "Collected values",
      accent: true,
      value: (step) => formatValues(step.collectedValues),
      detail: (step) => `${step.collectedValues.length} ${step.collectedValues.length === 1 ? "value" : "values"} recorded`
    }
  ],
  complexity: {
    chip: "FOLLOW NEXT",
    time: "O(n)",
    space: "O(n)",
    spaceLabel: "total space",
    explanation: "Every reachable node is visited once. The returned values occupy O(n) space; beyond that output, traversal keeps only one current pointer."
  },
  guide: {
    heading: "Follow the reference."
  },
  legend: [
    { kind: "current", label: "current pointer" },
    { kind: "visited", label: "visited node" },
    { kind: "changed", label: "recorded now" }
  ],
  reflection: {
    eyebrow: "BEFORE YOU MOVE ON",
    title: "What ends a traversal when there is no length?",
    body: "Try an empty list, one node, and duplicate values. Explain why null is the stopping rule and why following next visits every reachable node once."
  }
};

function parseLinkedListValues(raw) {
  const text = String(raw).trim();
  return text === "" ? [] : parseNumberList(text, { maximumLength: 8 });
}

function formatValues(values) {
  if (values.length === 0) return "[]";
  return `[${values.map(formatNumber).join(", ")}]`;
}
