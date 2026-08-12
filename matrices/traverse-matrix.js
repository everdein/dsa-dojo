// Runnable entry point for the shared Matrix Traversal implementation.

async function main() {
  const { traverseMatrix } = await import("./traverse-matrix.mjs");
  const matrix = [
    [1, 2, 3],
    [4, 5, 6]
  ];

  console.log(traverseMatrix(matrix));
}

main();

// Time complexity: O(rows * columns)
// Space complexity: O(rows * columns) output; O(1) auxiliary space.
