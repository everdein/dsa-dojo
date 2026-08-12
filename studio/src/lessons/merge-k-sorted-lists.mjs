import {
  formatKSortedLists,
  maximumKSortedListNodes,
  maximumKSortedLists,
  mergeKSortedLists,
  parseKSortedLists
} from "../../../heaps-and-priority-queues/merge-k-sorted-lists.mjs";
import { formatNumber } from "../input.mjs";
import { buildMergeKSortedListsTrace } from "../merge-k-sorted-lists.mjs";

export const mergeKSortedListsLesson = {
  id: "heaps-and-priority-queues/merge-k-sorted-lists",
  order: 33,
  topic: "Heaps and Priority Queues",
  prerequisites: [
    "linked-lists/reverse-linked-list",
    "heaps-and-priority-queues/heap-operations"
  ],
  patterns: ["heap", "k-way-merge", "frontier"],
  catalogLabel: "Merge K Sorted Lists",
  catalogDescription: "Keep one eligible linked-list node per source in a min-heap frontier.",
  title: "Merge k sorted linked lists",
  summary: "Extract the smallest source head, append it, and advance only that source list so the heap stores exactly the eligible frontier.",
  views: [
    { id: "frontier", renderer: "branching", heading: "Min-heap frontier" },
    { id: "output", renderer: "array", heading: "Merged output" }
  ],
  input: {
    heading: "Your sorted lists",
    fields: [{
      id: "lists",
      label: `Enter 1-${maximumKSortedLists} semicolon-separated sorted lists`,
      type: "text",
      inputMode: "text",
      placeholder: "1, 4, 5; 1, 3, 4; 2, 6"
    }],
    help: `Use commas inside each non-empty sorted list and semicolons between lists. Keep all lists to ${maximumKSortedListNodes} finite nodes total.`,
    defaultValue: { lists: [[1, 4, 5], [1, 3, 4], [2, 6]] },
    sampleValue: { lists: [[-3, 0, 4], [-3, 2], [-2, 2]] },
    parse: ({ lists }) => ({ lists: parseKSortedLists(lists) }),
    serialize: ({ lists }) => ({ lists: formatKSortedLists(lists) })
  },
  solve: ({ lists }) => mergeKSortedLists(lists),
  buildTrace: ({ lists }) => buildMergeKSortedListsTrace(lists),
  code: {
    title: "Advance only the extracted source",
    filename: "merge-k-sorted-lists.mjs",
    sourcePath: "heaps-and-priority-queues/merge-k-sorted-lists.mjs",
    lines: [
      { number: 78, text: "export function mergeKSortedLists(lists) {", steps: ["function"] },
      { number: 79, text: "  validateKSortedLists(lists);", steps: ["initialize-frontier"] },
      { number: 80, text: "  const heads = lists.map((values) => createLinkedList(values));", steps: ["initialize-frontier"] },
      { number: 81, text: "  const frontier = [];", steps: ["initialize-frontier"] },
      { number: 82, text: "  for (let listIndex = 0; listIndex < heads.length; listIndex += 1) {", steps: ["initialize-frontier"] },
      { number: 83, text: "    pushFrontier(frontier, createFrontierEntry(heads[listIndex], listIndex, 0));", steps: ["initialize-frontier"] },
      { number: 86, text: "  const merged = [];", steps: ["initialize-frontier"] },
      { number: 87, text: "  while (frontier.length > 0) {", steps: ["extract-min"] },
      { number: 88, text: "    const entry = popFrontier(frontier);", steps: ["extract-min"] },
      { number: 89, text: "    merged.push(entry.value);", steps: ["append-output"] },
      { number: 90, text: "    if (entry.node.next !== null) {", steps: ["advance-list", "skip-exhausted"] },
      { number: 91, text: "      pushFrontier(frontier, createFrontierEntry(", steps: ["push-successor"] },
      { number: 92, text: "        entry.node.next,", steps: ["push-successor"] },
      { number: 93, text: "        entry.listIndex,", steps: ["push-successor"] },
      { number: 94, text: "        entry.elementIndex + 1", steps: ["push-successor"] },
      { number: 98, text: "  return merged;", steps: ["return-output"] },
      { number: 99, text: "}", steps: ["function"] }
    ]
  },
  stats: [
    {
      label: "Frontier size",
      value: (step) => String(step.frontierSize),
      detail: (step) => `at most ${step.listCount} sources`
    },
    {
      label: "Extracted",
      value: (step) => step.extractedValue === null ? "-" : formatNumber(step.extractedValue),
      detail: (step) => step.extractedListIndex === null ? "none yet" : `list ${step.extractedListIndex + 1}`
    },
    {
      label: "Output size",
      value: (step) => String(step.outputCount),
      detail: (step) => `${step.remainingCount} nodes remaining`
    },
    {
      label: "Progress",
      accent: true,
      value: (step) => `${step.outputCount}/${step.totalNodes}`,
      detail: (step) => step.phase === "complete" ? "merge complete" : "globally sorted prefix"
    }
  ],
  complexity: {
    chip: "K-WAY FRONTIER",
    time: "O(n log k)",
    space: "O(n + k)",
    spaceLabel: "total space",
    explanation: "Each of n nodes enters and leaves a heap containing at most k source heads. The frontier uses O(k) auxiliary space, while the immutable numeric result stores n values."
  },
  guide: {
    heading: "Only the extracted list advances."
  },
  legend: [
    { kind: "frontier", label: "eligible source head" },
    { kind: "current", label: "current minimum" },
    { kind: "output", label: "just appended" },
    { kind: "result", label: "merged result" }
  ],
  reflection: {
    eyebrow: "BEFORE YOU MOVE ON",
    title: "Why is one node per list enough?",
    body: "A later node in a sorted source cannot beat that source's current head. Explain why advancing only the extracted source preserves every candidate for the next global minimum."
  }
};
