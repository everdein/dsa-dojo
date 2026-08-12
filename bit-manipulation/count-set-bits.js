const value = 180;

(async () => {
  const { countSetBits } = await import("./count-set-bits.mjs");
  console.log(value, countSetBits(value));
})();
