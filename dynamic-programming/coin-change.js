// Run with: node dynamic-programming/coin-change.js
// The reusable, tested implementation lives in the neighboring ES module.

async function main() {
  const { minimumCoins } = await import("./coin-change.mjs");

  console.log(minimumCoins([1, 3, 4], 6));
  console.log(minimumCoins([4, 6], 5));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
