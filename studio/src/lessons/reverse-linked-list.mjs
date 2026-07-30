import {
  createLinkedList,
  linkedListToValues
} from "../../../linked-lists/model.mjs";
import {
  reverseLinkedList
} from "../../../linked-lists/reverse-linked-list.mjs";
import { formatNumber, parseNumberList } from "../input.mjs";
import { buildReverseLinkedListTrace } from "../reverse-linked-list.mjs";

export const reverseLinkedListLesson = {
  id: "linked-lists/reverse-linked-list",
  order: 6,
  topic: "Linked Lists",
  catalogLabel: "Reverse List",
  catalogDescription: "Redirect each next link while protecting the unvisited suffix.",
  title: "Reverse a linked list",
  summary: "Save next before rewiring current. Then move previous and current forward until previous becomes the new head.",
  renderer: "linked-list",
  input: {
    fields: [{
      id: "values",
      label: "List values — up to 8 comma-separated numbers",
      type: "text",
      inputMode: "text",
      placeholder: "4, 7, 1, 9"
    }],
    help: "Leave the field blank for an empty list, or try a singleton, an even-length list, and duplicate values.",
    defaultValue: { values: [4, 7, 1, 9] },
    sampleValue: { values: [2, 2, -1] },
    parse: (fields) => ({ values: parseLinkedListValues(fields.values) }),
    serialize: ({ values }) => ({ values: values.join(", ") })
  },
  solve: ({ values }) => linkedListToValues(
    reverseLinkedList(createLinkedList(values))
  ),
  buildTrace: ({ values }) => buildReverseLinkedListTrace(values),
  code: {
    title: "Protect, redirect, advance",
    filename: "reverse-linked-list.mjs",
    lines: [
      { number: 1, text: "export function reverseLinkedList(head) {", steps: ["function"] },
      { number: 2, text: "  validateAcyclicLinkedList(head);", steps: ["initialize"] },
      { number: 3, text: "  let current = head;", steps: ["initialize"] },
      { number: 4, text: "  let previous = null;", steps: ["initialize"] },
      { number: 5, text: "", steps: ["initialize"] },
      { number: 6, text: "  while (current !== null) {", steps: ["check-current"] },
      { number: 7, text: "    const next = current.next;", steps: ["save-next"] },
      { number: 8, text: "    current.next = previous;", steps: ["reverse-link"] },
      { number: 9, text: "    previous = current;", steps: ["advance-pointers"] },
      { number: 10, text: "    current = next;", steps: ["advance-pointers"] },
      { number: 11, text: "  }", steps: ["check-current"] },
      { number: 12, text: "", steps: ["return"] },
      { number: 13, text: "  return previous;", steps: ["return"] },
      { number: 14, text: "}", steps: ["function"] }
    ]
  },
  stats: [
    {
      label: "Current node",
      value: (step) => step.currentIndex === null ? "null" : String(step.currentIndex),
      detail: (step) => pointerDetail(step.currentValue)
    },
    {
      label: "Previous node",
      value: (step) => step.previousIndex === null ? "null" : String(step.previousIndex),
      detail: (step) => pointerDetail(step.previousValue)
    },
    {
      label: "Links reversed",
      accent: true,
      value: (step) => `${step.linksReversed} / ${step.nodeCount}`,
      detail: () => "the reversed prefix stays reachable"
    }
  ],
  complexity: {
    chip: "THREE POINTERS",
    time: "O(n)",
    space: "O(1)",
    explanation: "A constant-space preflight confirms the list ends, then the algorithm reverses it in place with current, previous, and next. The studio supplies disposable nodes so the lesson can replay safely."
  },
  guide: {
    heading: "Protect the rest of the list."
  },
  legend: [
    { kind: "current", label: "current pointer" },
    { kind: "previous", label: "previous pointer" },
    { kind: "next", label: "saved next" },
    { kind: "reversed", label: "reversed node" },
    { kind: "changed", label: "link changed now" }
  ],
  reflection: {
    eyebrow: "BEFORE YOU MOVE ON",
    title: "Why must next be saved first?",
    body: "Try an empty list and a singleton. Explain which nodes would become unreachable if current.next changed before the original next reference was protected."
  }
};

function parseLinkedListValues(raw) {
  const text = String(raw).trim();
  return text === "" ? [] : parseNumberList(text, { maximumLength: 8 });
}

function pointerDetail(value) {
  return value === null ? "null terminates this chain" : `value ${formatNumber(value)}`;
}
