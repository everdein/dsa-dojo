// Run with: node recursion/factorial.js
// The reusable, tested implementation lives in the neighboring ES module.

async function main() {
  const { factorial } = await import("./factorial.mjs");
  const value = 5;

  console.log(`${value}! = ${factorial(value)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
