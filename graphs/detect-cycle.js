// Runnable entry point for the shared undirected Graph Cycle implementation.

const nodes = ["A", "B", "C", "D"];
const edges = [
  { from: "A", to: "B" },
  { from: "B", to: "C" },
  { from: "C", to: "A" }
];

(async () => {
  const { detectGraphCycle } = await import("./detect-cycle.mjs");
  console.log(detectGraphCycle(nodes, edges));
})();

// Time complexity: O(V + E)
// Space complexity: O(V)
