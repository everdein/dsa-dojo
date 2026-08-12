import {
  buildBinaryTree,
  validateLevelOrderTree
} from "./model.mjs";

/**
 * Validate a strict binary search tree. Every node inherits exclusive bounds
 * from all ancestors, so a descendant cannot hide on the wrong side of a root.
 */
export function isValidBinarySearchTree(slots) {
  validateLevelOrderTree(slots);
  const root = buildBinaryTree(slots);
  if (root === null) return true;

  const pending = [{ node: root, lowerBound: null, upperBound: null }];
  while (pending.length > 0) {
    const { node, lowerBound, upperBound } = pending.pop();
    if (
      lowerBound !== null && node.value <= lowerBound
      || upperBound !== null && node.value >= upperBound
    ) {
      return false;
    }

    if (node.right !== null) {
      pending.push({
        node: node.right,
        lowerBound: node.value,
        upperBound
      });
    }
    if (node.left !== null) {
      pending.push({
        node: node.left,
        lowerBound,
        upperBound: node.value
      });
    }
  }
  return true;
}

export const validateBinarySearchTree = isValidBinarySearchTree;
export const isValidBst = isValidBinarySearchTree;
export const validateBst = isValidBinarySearchTree;
