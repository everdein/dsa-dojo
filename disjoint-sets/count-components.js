// Runnable entry point for counting graph components with Union-Find.

const nodes = ["A", "B", "C", "D", "E"];
const edges = [
  { from: "A", to: "B" },
  { from: "B", to: "C" },
  { from: "D", to: "E" }
];

(async () => {
  const { countComponentsWithUnionFind } = await import("./count-components.mjs");
  console.log(countComponentsWithUnionFind(nodes, edges));
})();

// Time complexity: O((V + E) alpha(V))
// Space complexity: O(V)
