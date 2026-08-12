// Runnable entry point for the shared Binary Search implementation.

const values = [-4, 1, 3, 7, 9, 12];
const target = 7;

(async () => {
  const { binarySearch } = await import("./binary-search.mjs");
  console.log(binarySearch(values, target));
})();

// Time complexity: O(log n)
// Space complexity: O(1)
