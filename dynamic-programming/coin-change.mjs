export const maximumMinimumCoinTypes = 8;
export const maximumMinimumCoinTarget = 30;

export function validateMinimumCoinsInput(coins, target) {
  if (!Array.isArray(coins) || coins.length === 0 || coins.length > maximumMinimumCoinTypes) {
    throw new Error(`Minimum Coins requires 1-${maximumMinimumCoinTypes} denominations.`);
  }

  const seen = new Set();
  for (let index = 0; index < coins.length; index += 1) {
    const coin = coins[index];
    if (
      !Object.hasOwn(coins, index)
      || !Number.isSafeInteger(coin)
      || coin <= 0
      || seen.has(coin)
    ) {
      throw new Error("Minimum Coins denominations must be unique positive safe integers.");
    }
    seen.add(coin);
  }

  if (!Number.isSafeInteger(target) || target < 0 || target > maximumMinimumCoinTarget) {
    throw new Error(`Minimum Coins target must be a whole number from 0 to ${maximumMinimumCoinTarget}.`);
  }
  return { coins, target };
}

/**
 * Finds an optimal unbounded-coin selection without mutating the denominations.
 * Equal-length candidates keep the first choice encountered in input order, so
 * reconstruction is deterministic even when several optimal selections exist.
 */
export function minimumCoins(coins, target) {
  validateMinimumCoinsInput(coins, target);
  const counts = Array(target + 1).fill(null);
  const chosenCoins = Array(target + 1).fill(null);
  const predecessors = Array(target + 1).fill(null);
  counts[0] = 0;

  for (let amount = 1; amount <= target; amount += 1) {
    for (const coin of coins) {
      if (coin > amount || counts[amount - coin] === null) continue;
      const candidateCount = counts[amount - coin] + 1;
      if (counts[amount] !== null && candidateCount >= counts[amount]) continue;
      counts[amount] = candidateCount;
      chosenCoins[amount] = coin;
      predecessors[amount] = amount - coin;
    }
  }

  if (counts[target] === null) {
    return { reachable: false, minimum: null, selected: [] };
  }

  const selected = [];
  for (let amount = target; amount > 0; amount = predecessors[amount]) {
    selected.push(chosenCoins[amount]);
  }
  return { reachable: true, minimum: counts[target], selected };
}
