import {
  buildBinaryTree,
  validateLevelOrderTree
} from "./model.mjs";

export function validateInorderTraversalInput(slots) {
  return validateLevelOrderTree(slots);
}

/**
 * Iteratively visits left subtree, node, then right subtree. The explicit
 * stack stores the path whose left subtrees are complete but whose nodes have
 * not yet been visited.
 */
export function inorderTraversal(slots) {
  validateInorderTraversalInput(slots);

  const result = [];
  const stack = [];
  let current = buildBinaryTree(slots);

  while (current !== null || stack.length > 0) {
    while (current !== null) {
      stack.push(current);
      current = current.left;
    }

    current = stack.pop();
    result.push(current.value);
    current = current.right;
  }

  return result;
}
