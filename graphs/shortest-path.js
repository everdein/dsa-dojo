// Run with: node graphs/shortest-path.js
// The reusable, tested implementation lives in the neighboring ES module.

async function main() {
  const { unweightedShortestPath } = await import("./shortest-path.mjs");
  const nodes = ["A", "B", "C", "D", "E"];
  const edges = [
    { from: "A", to: "B" },
    { from: "A", to: "C" },
    { from: "B", to: "D" },
    { from: "C", to: "E" },
    { from: "E", to: "D" }
  ];

  console.log(unweightedShortestPath(nodes, edges, "A", "D"));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
