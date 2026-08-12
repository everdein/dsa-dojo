// Runnable entry point for the shared Merge Intervals implementation.

const source = "1:3, 2:6, 8:10";

(async () => {
  const {
    mergeIntervals,
    parseIntervalList
  } = await import("./merge-intervals.mjs");
  console.log(mergeIntervals(parseIntervalList(source)));
})();

// Time complexity: O(n log n)
// Space complexity: O(n)
