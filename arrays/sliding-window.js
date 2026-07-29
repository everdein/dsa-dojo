// Runnable entry point for the shared fixed-size Sliding Window implementation.

const numbers = [2, 1, 5, 1, 3, 2];
const windowSize = 3;

(async () => {
  const { maxWindowSum } = await import("./sliding-window.mjs");
  console.log(maxWindowSum(numbers, windowSize));
})();

// Time complexity: O(n)
// Space complexity: O(1)
