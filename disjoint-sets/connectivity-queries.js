// Runnable entry point for the shared Connectivity Queries implementation.

const nodes = ["A", "B", "C", "D", "E"];
const program = "union A B, union C D, connected B D, union A C, union E A, connected D E";

(async () => {
  const {
    parseConnectivityProgram,
    runConnectivityQueries
  } = await import("./connectivity-queries.mjs");
  console.log(runConnectivityQueries(nodes, parseConnectivityProgram(program, nodes)));
})();

// Amortized time per operation: O(alpha(n))
// Space complexity: O(n + q), including parent state and query answers.
