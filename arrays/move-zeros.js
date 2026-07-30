// Exercise: Move all zeros to the end.
// Goal: Preserve non-zero order while zeros collect at the end.

async function main() {
  const { moveZeros } = await import("./move-zeros.mjs");
  const values = [0, 1, 0, 3, 12];

  console.log(moveZeros(values));
}

main();

// Time complexity: O(n)
// Space complexity: O(n) output space; O(1) auxiliary space beyond the returned copy.
