// Runnable entry point for the shared Frequency Count implementation.

const values = [1, 2, 2, 3, 1, 1];

(async () => {
  const { countFrequencies } = await import("./frequency-count.mjs");
  console.log(countFrequencies(values));
})();

// Time complexity: O(n)
// Space complexity: O(k)
