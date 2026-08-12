// Runnable entry point for the reusable Union-Find implementation.

const nodeSource = "A, B, C";
const program = "union A B, find B, union B C";

(async () => {
  const {
    parseUnionFindNodes,
    parseUnionFindProgram,
    runUnionFindProgram
  } = await import("./union-find.mjs");
  const nodes = parseUnionFindNodes(nodeSource);
  console.log(runUnionFindProgram(nodes, parseUnionFindProgram(program, nodes)));
})();

// Amortized time per operation: O(alpha(n))
// Space complexity: O(n)
