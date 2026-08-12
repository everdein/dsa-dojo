// Runnable entry point for the shared Find Duplicates implementation.

const values = [4, 2, 7, 2, 4, 4, 9];

(async () => {
  const { findDuplicates } = await import("./find-duplicates.mjs");
  console.log(findDuplicates(values));
})();

// Time complexity: O(n) average
// Space complexity: O(n)
