// Runnable entry point for the shared Top K Frequent implementation.

const values = [1, 1, 1, 2, 2, 3];
const k = 2;

(async () => {
  const { topKFrequent } = await import("./top-k-frequent.mjs");
  console.log(topKFrequent(values, k));
})();

// Time complexity: O(n + d log k)
// Space complexity: O(d + k)
