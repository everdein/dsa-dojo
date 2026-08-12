// Run with: node queues/sliding-window-maximum.js
// The reusable, tested implementation lives in the neighboring ES module.

async function main() {
  const { slidingWindowMaximum } = await import("./sliding-window-maximum.mjs");
  const values = [1, 3, -1, -3, 5, 3, 6, 7];

  console.log(slidingWindowMaximum(values, 3));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
