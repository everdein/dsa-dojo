// Runnable entry point for the shared Merge K Sorted Lists implementation.

const source = "1, 4, 5; 1, 3, 4; 2, 6";

(async () => {
  const {
    mergeKSortedLists,
    parseKSortedLists
  } = await import("./merge-k-sorted-lists.mjs");
  console.log(mergeKSortedLists(parseKSortedLists(source)));
})();

// Time complexity: O(n log k)
// Space complexity: O(n + k), including the returned output.
