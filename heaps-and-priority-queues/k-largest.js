// Run with: node heaps-and-priority-queues/k-largest.js
// The reusable, tested implementation lives in the neighboring ES module.

async function main() {
  const { kLargest } = await import("./k-largest.mjs");
  const values = [3, 2, 1, 5, 6, 4];

  console.log(kLargest(values, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
