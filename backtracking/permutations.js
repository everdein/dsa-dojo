// Runnable entry point for the shared Generate Permutations implementation.

const values = [1, 2, 3];

(async () => {
  const { generatePermutations } = await import("./permutations.mjs");
  console.log(generatePermutations(values));
})();

// Time complexity: O(n * n!)
// Space complexity: O(n * n!) including the returned permutations.
