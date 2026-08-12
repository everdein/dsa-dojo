import {
  formatLevelOrderTree,
  maximumBinaryTreeNodes,
  parseLevelOrderTree
} from "../../../trees/model.mjs";
import { isValidBinarySearchTree } from "../../../trees/validate-bst.mjs";
import { buildValidateBstTrace } from "../validate-bst.mjs";
import { formatNumber } from "../input.mjs";

export const validateBstLesson = {
  id: "trees/validate-bst",
  order: 27,
  topic: "Trees",
  prerequisites: ["trees/inorder-traversal"],
  patterns: ["depth-first-search", "bounds", "binary-search-tree"],
  catalogLabel: "Validate a BST",
  catalogDescription: "Carry ancestor-wide exclusive bounds to every node.",
  title: "Validate a binary search tree with bounds",
  summary: "Depth-first search carries an exclusive lower and upper bound into every subtree, catching global ordering mistakes that parent-only checks miss.",
  renderer: "branching",
  input: {
    heading: "Your binary tree",
    fields: [{
      id: "tree",
      label: `Enter 1-${maximumBinaryTreeNodes} level-order numbers or null slots`,
      type: "text",
      inputMode: "text",
      placeholder: "10, 5, 15, null, null, 12, 20"
    }],
    help: "Use comma-separated level-order slots. Use null for a missing child; duplicate values make this strict BST invalid.",
    defaultValue: { slots: [8, 3, 10, 1, 6, null, 14] },
    sampleValue: { slots: [10, 5, 15, null, null, 6, 20] },
    parse: ({ tree }) => ({ slots: parseLevelOrderTree(tree) }),
    serialize: ({ slots }) => ({ tree: formatLevelOrderTree(slots) })
  },
  solve: ({ slots }) => isValidBinarySearchTree(slots),
  buildTrace: ({ slots }) => buildValidateBstTrace(slots),
  code: {
    title: "Carry exclusive ancestor bounds",
    filename: "validate-bst.mjs",
    sourcePath: "trees/validate-bst.mjs",
    lines: [
      { number: 10, text: "export function isValidBinarySearchTree(slots) {", steps: ["function"] },
      { number: 11, text: "  validateLevelOrderTree(slots);", steps: ["initialize"] },
      { number: 12, text: "  const root = buildBinaryTree(slots);", steps: ["initialize"] },
      { number: 13, text: "  if (root === null) return true;", steps: ["return-true"] },
      { number: 15, text: "  const pending = [{ node: root, lowerBound: null, upperBound: null }];", steps: ["initialize"] },
      { number: 16, text: "  while (pending.length > 0) {", steps: ["pop-node"] },
      { number: 17, text: "    const { node, lowerBound, upperBound } = pending.pop();", steps: ["pop-node"] },
      { number: 18, text: "    if (", steps: ["check-bounds"] },
      { number: 19, text: "      lowerBound !== null && node.value <= lowerBound", steps: ["check-bounds"] },
      { number: 20, text: "      || upperBound !== null && node.value >= upperBound", steps: ["check-bounds"] },
      { number: 22, text: "      return false;", steps: ["return-false"] },
      { number: 25, text: "    if (node.right !== null) {", steps: ["mark-valid", "push-children"] },
      { number: 26, text: "      pending.push({", steps: ["push-children"] },
      { number: 28, text: "        lowerBound: node.value,", steps: ["push-children"] },
      { number: 32, text: "    if (node.left !== null) {", steps: ["push-children"] },
      { number: 33, text: "      pending.push({", steps: ["push-children"] },
      { number: 36, text: "        upperBound: node.value", steps: ["push-children"] },
      { number: 40, text: "  return true;", steps: ["return-true"] },
      { number: 41, text: "}", steps: ["function"] }
    ]
  },
  stats: [
    {
      label: "Current value",
      value: (step) => step.currentValue === null ? "-" : formatNumber(step.currentValue),
      detail: (step) => step.currentNodeId ?? "no active node"
    },
    {
      label: "Exclusive bounds",
      value: (step) => step.currentNodeId === null ? "-" : step.boundsLabel,
      detail: () => "from all ancestors"
    },
    {
      label: "Nodes checked",
      value: (step) => String(step.checkedCount),
      detail: (step) => `${step.pendingCount} pending`
    },
    {
      label: "Valid so far?",
      accent: true,
      value: (step) => step.validSoFar ? "yes" : "no",
      detail: (step) => step.phase === "complete" ? "final result" : "strict ordering"
    }
  ],
  complexity: {
    chip: "ANCESTOR BOUNDS",
    time: "O(n)",
    space: "O(n)",
    explanation: "Each node is checked once. The explicit depth-first stack stores at most one pending entry per node in the worst case."
  },
  guide: {
    heading: "A node must satisfy every ancestor, not only its parent."
  },
  legend: [
    { kind: "current", label: "current node" },
    { kind: "checking", label: "checking bounds" },
    { kind: "valid", label: "bounds satisfied" },
    { kind: "invalid", label: "bounds violated" }
  ],
  reflection: {
    eyebrow: "BEFORE YOU MOVE ON",
    title: "Why are parent-child comparisons insufficient?",
    body: "In 10, 5, 15, null, null, 6, 20, the value 6 is less than its parent 15 but still belongs in the wrong side of 10. Identify the inherited lower bound that exposes it."
  }
};
