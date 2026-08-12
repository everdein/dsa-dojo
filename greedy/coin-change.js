const coins = [1, 3, 4];
const amount = 6;

(async () => {
  const { compareGreedyCoinChange } = await import("./coin-change.mjs");
  console.log(compareGreedyCoinChange(coins, amount));
})();
