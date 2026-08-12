// Runnable entry point for the shared Connected Components implementation.

const nodes = ["A", "B", "C", "D", "E"];
const edges = [{ from: "A", to: "B" }, { from: "C", to: "D" }];

(async () => {
  const { connectedComponents } = await import("./connected-components.mjs");
  console.log(connectedComponents(nodes, edges));
})();

// Time complexity: O(V + E)
// Space complexity: O(V)
