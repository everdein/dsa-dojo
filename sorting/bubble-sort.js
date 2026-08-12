// Runnable entry point for the shared Bubble Sort implementation.

const values = [5, 1, 4, 2, 8];

(async () => {
  const { bubbleSort } = await import("./bubble-sort.mjs");
  console.log(bubbleSort(values));
})();

// Time complexity: O(n^2) worst case, O(n) best case
// Space complexity: O(n) for the immutable returned copy
