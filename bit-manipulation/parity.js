const value = 13;

(async () => {
  const { bitwiseParity } = await import("./parity.mjs");
  console.log(value, bitwiseParity(value));
})();
