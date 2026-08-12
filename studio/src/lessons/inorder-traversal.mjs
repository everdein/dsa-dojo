import { inorderTraversal } from "../../../trees/inorder-traversal.mjs";
import {
  formatLevelOrderTree,
  maximumBinaryTreeNodes,
  parseLevelOrderTree
} from "../../../trees/model.mjs";
import { formatNumber } from "../input.mjs";
import { buildInorderTraversalTrace } from "../inorder-traversal.mjs";

export const inorderTraversalLesson = {
  id: "trees/inorder-traversal",
  order: 25,
  topic: "Trees",
  prerequisites: ["stacks/valid-parentheses"],
  patterns: ["depth-first-search", "tree", "inorder"],
  catalogLabel: "Inorder Tree Traversal",
  catalogDescription: "Use an explicit stack to visit left subtree, node, then right subtree.",
  title: "Traverse a binary tree inorder",
  summary: "Push the current left path. When no left child remains, pop and visit the nearest pending node, then repeat from its right child.",
  views: [
    { id: "tree", renderer: "branching", heading: "Binary tree" },
    { id: "stack", renderer: "stack", heading: "Pending path" }
  ],
  input: {
    fields: [{
      id: "tree",
      label: `Enter up to ${maximumBinaryTreeNodes} level-order values`,
      type: "text",
      inputMode: "decimal",
      placeholder: "8, 3, 10, 1, 6, null, 14"
    }],
    help: "Use finite numbers and null placeholders in level order. A non-null child cannot appear beneath a null parent. Enter null for an empty tree.",
    defaultValue: { slots: [8, 3, 10, 1, 6, null, 14] },
    sampleValue: { slots: [4, 2, 6, 1, 3, 5, 7] },
    parse: (fields) => ({ slots: parseLevelOrderTree(fields.tree) }),
    serialize: ({ slots }) => ({ tree: formatLevelOrderTree(slots) })
  },
  solve: ({ slots }) => inorderTraversal(slots),
  buildTrace: ({ slots }) => buildInorderTraversalTrace(slots),
  code: {
    title: "Replace recursive returns with an explicit stack",
    filename: "inorder-traversal.mjs",
    sourcePath: "trees/inorder-traversal.mjs",
    lines: [
      { number: 15, text: "export function inorderTraversal(slots) {", steps: ["function"] },
      { number: 16, text: "  validateInorderTraversalInput(slots);", steps: ["initialize"] },
      { number: 18, text: "  const result = [];", steps: ["initialize"] },
      { number: 19, text: "  const stack = [];", steps: ["initialize"] },
      { number: 20, text: "  let current = buildBinaryTree(slots);", steps: ["initialize"] },
      { number: 22, text: "  while (current !== null || stack.length > 0) {", steps: ["push-node", "pop-node"] },
      { number: 23, text: "    while (current !== null) {", steps: ["push-node"] },
      { number: 24, text: "      stack.push(current);", steps: ["push-node"] },
      { number: 25, text: "      current = current.left;", steps: ["move-left"] },
      { number: 28, text: "    current = stack.pop();", steps: ["pop-node"] },
      { number: 29, text: "    result.push(current.value);", steps: ["visit-node"] },
      { number: 30, text: "    current = current.right;", steps: ["move-right"] },
      { number: 33, text: "  return result;", steps: ["return"] },
      { number: 34, text: "}", steps: ["function"] }
    ]
  },
  stats: [
    {
      label: "Current node",
      value: (step) => step.currentValue === null ? "null" : formatNumber(step.currentValue)
    },
    {
      label: "Stack depth",
      value: (step) => String(step.stackDepth),
      detail: () => "pending return path"
    },
    {
      label: "Visited",
      value: (step) => String(step.visitedCount)
    },
    {
      label: "Output",
      accent: true,
      value: (step) => `[${step.outputValues.map(formatNumber).join(", ")}]`,
      detail: () => "left, node, right"
    }
  ],
  complexity: {
    chip: "LEFT · NODE · RIGHT",
    time: "O(n)",
    space: "O(h)",
    spaceLabel: "auxiliary space",
    explanation: "Each of n nodes is pushed, popped, and visited once. The stack holds at most one root-to-leaf path, so auxiliary space is O(h), where h is the tree height; the returned traversal is output space."
  },
  guide: {
    heading: "The stack remembers every node that must wait."
  },
  legend: [
    { kind: "current", label: "current pointer" },
    { kind: "pending", label: "waiting on stack" },
    { kind: "visited", label: "added to output" }
  ],
  reflection: {
    eyebrow: "BEFORE YOU MOVE ON",
    title: "What recursive state does the stack preserve?",
    body: "Try balanced, left-skewed, right-skewed, duplicate-valued, and empty trees. Explain why a pushed node must wait until its entire left subtree is finished."
  }
};
