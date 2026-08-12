// Run with: node sorting/quick-sort.js
// The reusable, tested implementation lives in the neighboring ES module.

async function main() {
  const { quickSort } = await import("./quick-sort.mjs");
  const values = [8, 3, 1, 7, 0, 10, 2];

  console.log(quickSort(values));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
