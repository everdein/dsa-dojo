// Runnable entry point for the shared Pair Sum implementation.

const values = [2, 7, 11, 15];
const target = 9;

(async () => {
  const { findPairSum } = await import("./pair-sum.mjs");
  console.log(findPairSum(values, target));
})();

// Time complexity: O(n) average
// Space complexity: O(n)
