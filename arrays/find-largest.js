// Runnable entry point for the shared Find Largest implementation.

const numbers = [1, 2, 3, 4, 5];

(async () => {
  const { findLargest } = await import("./find-largest.mjs");
  console.log(findLargest(numbers));
})();

// Time complexity: O(n)
// Space complexity: O(1)
