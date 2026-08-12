// Run with: node trees/inorder-traversal.js
// The reusable, tested implementation lives in the neighboring ES module.

async function main() {
  const { inorderTraversal } = await import("./inorder-traversal.mjs");
  const slots = [8, 3, 10, 1, 6, null, 14];

  console.log(inorderTraversal(slots));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
