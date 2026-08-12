export const maximumGreedyCoinTypes = 8;
export const maximumGreedyCoinAmount = 100;

export function validateGreedyCoinInput(coins, amount) {
  if (!Array.isArray(coins) || coins.length === 0 || coins.length > maximumGreedyCoinTypes) {
    throw new Error(`Greedy coin change requires 1-${maximumGreedyCoinTypes} denominations.`);
  }
  const seen = new Set();
  for (let index = 0; index < coins.length; index += 1) {
    const coin = coins[index];
    if (!Object.hasOwn(coins, index) || !Number.isSafeInteger(coin) || coin <= 0 || seen.has(coin)) {
      throw new Error("Coin denominations must be unique positive safe integers.");
    }
    seen.add(coin);
  }
  if (!Number.isSafeInteger(amount) || amount < 1 || amount > maximumGreedyCoinAmount) {
    throw new Error(`Coin amount must be a whole number from 1 to ${maximumGreedyCoinAmount}.`);
  }
  return { coins, amount };
}

export function greedyCoinChange(coins, amount) {
  validateGreedyCoinInput(coins, amount);
  const ordered = [...coins].sort((left, right) => right - left);
  const selected = [];
  let remaining = amount;
  for (const coin of ordered) {
    while (coin <= remaining) {
      selected.push(coin);
      remaining -= coin;
    }
  }
  return { possible: remaining === 0, coins: selected, remaining };
}

export function optimalCoinChange(coins, amount) {
  validateGreedyCoinInput(coins, amount);
  const counts = Array(amount + 1).fill(Infinity);
  const chosenCoins = Array(amount + 1).fill(null);
  const predecessors = Array(amount + 1).fill(null);
  counts[0] = 0;
  for (let subtotal = 1; subtotal <= amount; subtotal += 1) {
    for (const coin of coins) {
      if (coin > subtotal || !Number.isFinite(counts[subtotal - coin])) continue;
      const candidateCount = counts[subtotal - coin] + 1;
      if (candidateCount >= counts[subtotal]) continue;
      counts[subtotal] = candidateCount;
      chosenCoins[subtotal] = coin;
      predecessors[subtotal] = subtotal - coin;
    }
  }

  if (!Number.isFinite(counts[amount])) {
    return { possible: false, coins: [], remaining: amount };
  }

  const selected = [];
  for (let subtotal = amount; subtotal > 0; subtotal = predecessors[subtotal]) {
    selected.push(chosenCoins[subtotal]);
  }
  return { possible: true, coins: selected, remaining: 0 };
}

export function compareGreedyCoinChange(coins, amount) {
  const greedy = greedyCoinChange(coins, amount);
  const optimal = optimalCoinChange(coins, amount);
  const outcome = !optimal.possible
    ? "unreachable"
    : !greedy.possible
      ? "greedy-stuck"
      : greedy.coins.length === optimal.coins.length
        ? "optimal"
        : "suboptimal";

  return {
    greedy,
    optimal,
    outcome,
    greedyIsOptimal: outcome === "unreachable" ? null : outcome === "optimal"
  };
}
