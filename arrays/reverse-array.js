// Exercise: Reverse an array.
// Goal: Swap mirrored values while moving two pointers inward.

async function main() {
  const { reverseArray } = await import("./reverse-array.mjs");
  const values = [2, 1, 4, 3, 5];

  console.log(reverseArray(values));
}

main();

// Time complexity: O(n)
// Space complexity: O(n) output space; O(1) auxiliary space beyond the returned copy.
