import {
  buildBinaryTree,
  validateLevelOrderTree
} from "./model.mjs";

/**
 * Visits a binary tree breadth first and groups its finite numeric values by
 * depth. A moving head keeps every queue operation O(1).
 */
export function levelOrderTraversal(slots) {
  validateLevelOrderTree(slots);
  const root = buildBinaryTree(slots);
  if (root === null) return [];

  const queue = [root];
  const levels = [];
  let head = 0;

  while (head < queue.length) {
    const levelSize = queue.length - head;
    const level = [];

    for (let offset = 0; offset < levelSize; offset += 1) {
      const node = queue[head];
      head += 1;
      level.push(node.value);
      if (node.left !== null) queue.push(node.left);
      if (node.right !== null) queue.push(node.right);
    }

    levels.push(level);
  }

  return levels;
}
