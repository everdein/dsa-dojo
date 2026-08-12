// Runnable entry point for the shared Insertion Sort implementation.

const values = [5, 2, 4, 6, 1, 3];

(async () => {
  const { insertionSort } = await import("./insertion-sort.mjs");
  console.log(insertionSort(values));
})();

// Time complexity: O(n^2) worst case, O(n) best case
// Space complexity: O(n) for the immutable returned copy
