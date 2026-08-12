import {
  formatLevelOrderTree,
  parseLevelOrderTree
} from "../../../trees/model.mjs";
import { levelOrderTraversal } from "../../../trees/level-order-traversal.mjs";
import { formatNumber } from "../input.mjs";
import { buildLevelOrderTraversalTrace } from "../level-order-traversal.mjs";

export const levelOrderTraversalLesson = {
  id: "trees/level-order-traversal",
  order: 26,
  topic: "Trees",
  prerequisites: ["queues/queue-operations", "trees/inorder-traversal"],
  patterns: ["breadth-first-search", "tree", "queue"],
  catalogLabel: "Level-Order Tree Traversal",
  catalogDescription: "Use a FIFO queue and a captured boundary to visit a binary tree one level at a time.",
  title: "Traverse a tree breadth first",
  summary: "Enqueue the root, visit nodes from the front, and enqueue each node's children at the back for the next level.",
  views: [
    { id: "tree", renderer: "branching", heading: "Binary tree" },
    { id: "queue", renderer: "queue", heading: "Breadth-first queue" }
  ],
  input: {
    fields: [{
      id: "slots",
      label: "Enter up to 15 level-order slots",
      type: "text",
      inputMode: "text",
      placeholder: "8, 3, 10, 1, 6, null, 14"
    }],
    help: "Use finite numbers for nodes and null for missing positions. A non-null child must have a parent; use null alone for an empty tree.",
    defaultValue: { slots: [8, 3, 10, 1, 6, null, 14] },
    sampleValue: { slots: [5, 3, 9, null, 4, 7, 12] },
    parse: ({ slots }) => ({ slots: parseLevelOrderTree(slots) }),
    serialize: ({ slots }) => ({ slots: formatLevelOrderTree(slots) })
  },
  solve: ({ slots }) => levelOrderTraversal(slots),
  buildTrace: buildLevelOrderTraversalTrace,
  code: {
    title: "Capture each breadth-first boundary",
    filename: "level-order-traversal.mjs",
    sourcePath: "trees/level-order-traversal.mjs",
    lines: [
      { number: 10, text: "export function levelOrderTraversal(slots) {", steps: ["function"] },
      { number: 11, text: "  validateLevelOrderTree(slots);", steps: ["initialize"] },
      { number: 12, text: "  const root = buildBinaryTree(slots);", steps: ["initialize"] },
      { number: 13, text: "  if (root === null) return [];", steps: ["return-levels"] },
      { number: 15, text: "  const queue = [root];", steps: ["enqueue-root"] },
      { number: 16, text: "  const levels = [];", steps: ["initialize"] },
      { number: 17, text: "  let head = 0;", steps: ["initialize"] },
      { number: 19, text: "  while (head < queue.length) {", steps: ["measure-level"] },
      { number: 20, text: "    const levelSize = queue.length - head;", steps: ["measure-level"] },
      { number: 21, text: "    const level = [];", steps: ["measure-level"] },
      { number: 23, text: "    for (let offset = 0; offset < levelSize; offset += 1) {", steps: ["dequeue-node"] },
      { number: 24, text: "      const node = queue[head];", steps: ["dequeue-node"] },
      { number: 25, text: "      head += 1;", steps: ["dequeue-node"] },
      { number: 26, text: "      level.push(node.value);", steps: ["visit-node"] },
      { number: 27, text: "      if (node.left !== null) queue.push(node.left);", steps: ["enqueue-left"] },
      { number: 28, text: "      if (node.right !== null) queue.push(node.right);", steps: ["enqueue-right"] },
      { number: 29, text: "    }", steps: ["dequeue-node"] },
      { number: 31, text: "    levels.push(level);", steps: ["finish-level"] },
      { number: 32, text: "  }", steps: ["measure-level"] },
      { number: 34, text: "  return levels;", steps: ["return-levels"] },
      { number: 35, text: "}", steps: ["function"] }
    ]
  },
  stats: [
    {
      label: "Current level",
      value: (step) => step.currentLevel === null ? "-" : String(step.currentLevel),
      detail: (step) => `${step.nodesRemainingInLevel} waiting from captured boundary`
    },
    {
      label: "Queue size",
      value: (step) => String(step.queueSize),
      detail: () => "front through back"
    },
    {
      label: "Current node",
      value: (step) => step.currentNodeValue === null ? "-" : formatNumber(step.currentNodeValue),
      detail: (step) => step.currentNodeId ?? "no active node"
    },
    {
      label: "Visited",
      accent: true,
      value: (step) => String(step.visitedCount),
      detail: (step) => `${step.completedLevels.length} complete ${step.completedLevels.length === 1 ? "level" : "levels"}`
    }
  ],
  complexity: {
    chip: "BREADTH FIRST",
    time: "O(n)",
    space: "O(n)",
    explanation: "Each node enters and leaves the FIFO queue once. The queue can hold an entire tree level, and the grouped output stores all n values."
  },
  guide: {
    heading: "Freeze the level size before adding children."
  },
  legend: [
    { kind: "queued", label: "waiting in the queue" },
    { kind: "visited", label: "already visited" },
    { kind: "current-level", label: "belongs to the active level" },
    { kind: "next-level", label: "belongs to the next level" }
  ],
  reflection: {
    eyebrow: "BEFORE YOU MOVE ON",
    title: "What separates one level from the next?",
    body: "Try an empty tree, a single node, and a tree skewed to one side. Explain why capturing the queue size before visiting a level prevents newly enqueued children from joining their parents' group."
  }
};
