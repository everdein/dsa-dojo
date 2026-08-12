const values = [4, 1, 2, 1, 2];

(async () => {
  const { singleNumber } = await import("./single-number.mjs");
  console.log(values, singleNumber(values));
})();
