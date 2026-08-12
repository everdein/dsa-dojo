// Run with: node arrays/longest-consecutive.js
// The reusable, tested implementation lives in the neighboring ES module.

async function main() {
  const { longestConsecutive } = await import("./longest-consecutive.mjs");
  const values = [100, 4, 200, 1, 3, 2];

  console.log(longestConsecutive(values));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
