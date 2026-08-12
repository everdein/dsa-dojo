// Runnable entry point for the shared Level-Order Tree Traversal implementation.

const slots = [8, 3, 10, 1, 6, null, 14];

(async () => {
  const { levelOrderTraversal } = await import("./level-order-traversal.mjs");
  console.log(levelOrderTraversal(slots));
})();

// Time complexity: O(n)
// Space complexity: O(n), including the grouped result and BFS queue.
