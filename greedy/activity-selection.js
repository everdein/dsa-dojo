// Runnable entry point for the shared Activity Selection implementation.

const intervals = [
  { start: 5, end: 7 },
  { start: 1, end: 4 },
  { start: 3, end: 5 },
  { start: 8, end: 11 },
  { start: 6, end: 10 }
];

(async () => {
  const { selectActivities } = await import("./activity-selection.mjs");
  console.log(selectActivities(intervals));
})();

// Time complexity: O(n log n)
// Space complexity: O(n), including sorted identities and the immutable result.
