// Runnable entry point for the shared strict BST validator.

const source = "10, 5, 15, null, null, 6, 20";

(async () => {
  const { parseLevelOrderTree } = await import("./model.mjs");
  const { isValidBinarySearchTree } = await import("./validate-bst.mjs");
  console.log(isValidBinarySearchTree(parseLevelOrderTree(source)));
})();

// Time complexity: O(n)
// Space complexity: O(n)
