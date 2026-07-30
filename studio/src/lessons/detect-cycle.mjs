import { hasCycle } from "../../../linked-lists/detect-cycle.mjs";
import { createLinkedList } from "../../../linked-lists/model.mjs";
import { parseNumberList } from "../input.mjs";
import { buildDetectCycleTrace } from "../detect-cycle.mjs";

export const detectCycleLesson = {
  id: "linked-lists/detect-cycle",
  order: 7,
  topic: "Linked Lists",
  catalogLabel: "Detect a Cycle",
  catalogDescription: "Let two pointer speeds prove whether the chain loops.",
  title: "Detect a cycle with two speeds",
  summary: "Slow follows one link while fast follows two. A meeting after they move proves a cycle; reaching null proves the list ends.",
  renderer: "linked-list",
  input: {
    fields: [
      {
        id: "values",
        label: "List values — 1 to 8 comma-separated numbers",
        type: "text",
        inputMode: "text",
        placeholder: "3, 2, 0, -4"
      },
      {
        id: "cycleEntryIndex",
        label: "Cycle entry index (optional)",
        type: "number",
        inputMode: "numeric",
        placeholder: "1",
        min: 0
      }
    ],
    help: "Indices identify nodes. Leave cycle entry blank for a list ending at null. Duplicate values do not create a cycle.",
    defaultValue: {
      values: [3, 2, 0, -4],
      cycleEntryIndex: 1
    },
    sampleValue: {
      values: [1, 2, 3, 4, 5],
      cycleEntryIndex: null
    },
    parse: (fields) => {
      const values = parseNumberList(fields.values, { maximumLength: 8 });
      return {
        values,
        cycleEntryIndex: parseCycleEntryIndex(fields.cycleEntryIndex, values.length)
      };
    },
    serialize: ({ values, cycleEntryIndex }) => ({
      values: values.join(", "),
      cycleEntryIndex: cycleEntryIndex === null ? "" : String(cycleEntryIndex)
    })
  },
  solve: ({ values, cycleEntryIndex }) => {
    const head = createLinkedList(values, { cycleEntryIndex });
    return hasCycle(head);
  },
  buildTrace: ({ values, cycleEntryIndex }) => buildDetectCycleTrace(values, cycleEntryIndex),
  code: {
    title: "Let fast catch slow",
    filename: "detect-cycle.mjs",
    lines: [
      { number: 1, text: "export function hasCycle(head) {", steps: ["function"] },
      { number: 2, text: "  validateLinkedListNode(head);", steps: ["initialize-slow", "initialize-fast"] },
      { number: 3, text: "  let slow = head;", steps: ["initialize-slow"] },
      { number: 4, text: "  let fast = head;", steps: ["initialize-fast"] },
      { number: 5, text: "", steps: ["guard"] },
      { number: 6, text: "  while (fast !== null && fast.next !== null) {", steps: ["guard"] },
      { number: 7, text: "    validateLinkedListNode(fast.next);", steps: ["guard"] },
      { number: 8, text: "    slow = slow.next;", steps: ["advance-slow"] },
      { number: 9, text: "    fast = fast.next.next;", steps: ["advance-fast"] },
      { number: 10, text: "    validateLinkedListNode(slow);", steps: ["advance-slow"] },
      { number: 11, text: "    validateLinkedListNode(fast);", steps: ["advance-fast"] },
      { number: 12, text: "", steps: ["compare"] },
      { number: 13, text: "    if (slow === fast) {", steps: ["compare"] },
      { number: 14, text: "      return true;", steps: ["return-true"] },
      { number: 15, text: "    }", steps: ["compare"] },
      { number: 16, text: "  }", steps: ["guard"] },
      { number: 17, text: "", steps: ["return-false"] },
      { number: 18, text: "  return false;", steps: ["return-false"] },
      { number: 19, text: "}", steps: ["function"] }
    ]
  },
  stats: [
    {
      label: "Slow pointer",
      value: (step) => pointerStat(step.slowIndex),
      detail: () => "moves one link per round"
    },
    {
      label: "Fast pointer",
      value: (step) => pointerStat(step.fastIndex),
      detail: () => "moves two links per round"
    },
    {
      label: "Rounds",
      value: (step) => String(step.rounds),
      detail: () => "pointer advances completed"
    },
    {
      label: "Result",
      accent: true,
      value: (step) => resultStat(step.detected),
      detail: (step) => resultDetail(step)
    }
  ],
  complexity: {
    chip: "FAST / SLOW",
    time: "O(n)",
    space: "O(1)",
    explanation: "Fast either reaches null or meets slow after O(n) pointer advances. The detection algorithm stores only two node references and does not mutate the list."
  },
  guide: {
    heading: "Compare identity, not value."
  },
  legend: [
    { kind: "slow", label: "slow pointer" },
    { kind: "fast", label: "fast pointer" },
    { kind: "cycle-entry", label: "cycle entry" },
    { kind: "meeting", label: "meeting node" }
  ],
  reflection: {
    eyebrow: "BEFORE YOU MOVE ON",
    title: "Does the first meeting reveal the cycle entry?",
    body: "Not necessarily. The meeting proves a loop. To locate its entry, reset one pointer to the head, then move both one link at a time until they meet again."
  }
};

function parseCycleEntryIndex(raw, length) {
  const text = String(raw ?? "").trim();
  if (text === "") return null;

  const index = Number(text);
  if (!Number.isInteger(index) || index < 0 || index >= length) {
    throw new Error(`Cycle entry must be a whole-number index from 0 to ${length - 1}, or left blank.`);
  }
  return index;
}

function pointerStat(index) {
  return index === null ? "null" : `node ${index}`;
}

function resultStat(detected) {
  if (detected === true) return "cycle";
  if (detected === false) return "no cycle";
  return "checking";
}

function resultDetail(step) {
  if (step.detected === true) return `pointers met at node ${step.slowIndex}`;
  if (step.detected === false) return "fast reached the end";
  return "no conclusion yet";
}
