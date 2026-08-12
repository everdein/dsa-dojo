// Runnable entry point for the shared Prefix Sum Range Queries implementation.

const values = [3, -1, 4, 2, 5];
const queries = [[0, 2], [1, 4], [3, 3]];

(async () => {
  const { rangeSumQueries } = await import("./range-sum-queries.mjs");
  console.log(rangeSumQueries(values, queries));
})();

// Time complexity: O(n + q) total; O(1) per query after preprocessing.
// Space complexity: O(n + q), including the returned prefix and answers.
