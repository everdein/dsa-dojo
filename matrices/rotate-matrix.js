// Runnable entry point for the shared Rotate Matrix implementation.

const matrix = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9]
];

(async () => {
  const { rotateMatrix } = await import("./rotate-matrix.mjs");
  console.log(rotateMatrix(matrix));
})();

// Time complexity: O(n^2)
// Space complexity: O(n^2) for the immutable returned copy.
