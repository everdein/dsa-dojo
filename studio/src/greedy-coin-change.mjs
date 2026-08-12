import {
  compareGreedyCoinChange,
  validateGreedyCoinInput
} from "../../greedy/coin-change.mjs";

export { compareGreedyCoinChange };

export function buildGreedyCoinChangeTrace({ coins, amount }) {
  validateGreedyCoinInput(coins, amount);
  const trace = [];
  const ordered = [...coins].sort((left, right) => right - left);
  const greedyCoins = [];
  const counts = Array(amount + 1).fill(Infinity);
  const chosenCoins = Array(amount + 1).fill(null);
  const predecessors = Array(amount + 1).fill(null);
  counts[0] = 0;
  let remaining = amount;
  let greedySteps = 0;
  let dpUpdates = 0;

  const addStep = ({ phase, codeSteps, activeCoin = null, activeAmount = null, changedAmounts = [], narration, prompt, result }) => {
    const entries = counts
      .map((count, subtotal) => ({ count, subtotal }))
      .filter(({ count }) => Number.isFinite(count))
      .map(({ count, subtotal }) => ({
        key: String(subtotal),
        value: subtotal === 0
          ? "0 coins"
          : `${count} coins via ${chosenCoins[subtotal]} from ${predecessors[subtotal]}`,
        state: subtotal === amount ? "target" : "known"
      }));
    const step = {
      step: trace.length,
      phase,
      codeSteps,
      amount,
      remaining,
      greedySteps,
      dpUpdates,
      greedyCoins: [...greedyCoins],
      optimalCoins: reconstructCoins(amount, counts, chosenCoins, predecessors),
      views: {
        greedy: {
          values: [...ordered],
          activeIndices: activeCoin === null ? [] : [ordered.indexOf(activeCoin)],
          ranges: [],
          markers: activeCoin === null ? [] : [{ index: ordered.indexOf(activeCoin), kind: "current", label: "local choice" }],
          annotations: ordered.map((coin, index) => ({ index, label: `${greedyCoins.filter((chosen) => chosen === coin).length} chosen` })),
          changedIndices: activeCoin === null ? [] : [ordered.indexOf(activeCoin)]
        },
        optimal: {
          entries,
          activeKeys: activeAmount === null || !Number.isFinite(counts[activeAmount]) ? [] : [String(activeAmount)],
          annotations: activeAmount === null || !Number.isFinite(counts[activeAmount]) ? [] : [{ key: String(activeAmount), label: `best for ${activeAmount}` }],
          resultKeys: Number.isFinite(counts[amount]) ? [String(amount)] : []
        }
      },
      narration,
      prompt
    };
    if (result !== undefined) step.result = result;
    trace.push(step);
  };

  addStep({
    phase: "initialize",
    codeSteps: ["sort-coins", "initialize"],
    activeAmount: 0,
    narration: `Sort denominations descending for the greedy run and seed the optimal table with amount 0.`,
    prompt: "Which largest denomination fits first?"
  });

  for (const coin of ordered) {
    while (coin <= remaining) {
      greedyCoins.push(coin);
      remaining -= coin;
      greedySteps += 1;
      addStep({
        phase: "greedy-take",
        codeSteps: ["greedy-loop", "take-largest"],
        activeCoin: coin,
        narration: `Take ${coin}, the largest coin that fits. The remaining amount is ${remaining}.`,
        prompt: "Can this locally largest choice block a better combination later?"
      });
    }
    addStep({
      phase: "greedy-skip",
      codeSteps: ["greedy-loop"],
      activeCoin: coin,
      narration: `${coin} no longer fits the remaining amount ${remaining}, so continue to a smaller coin.`,
      prompt: "What does greedy know—and not know—about future combinations?"
    });
  }

  for (let subtotal = 1; subtotal <= amount; subtotal += 1) {
    for (const coin of coins) {
      if (coin > subtotal || !Number.isFinite(counts[subtotal - coin])) continue;
      const candidateCount = counts[subtotal - coin] + 1;
      if (candidateCount >= counts[subtotal]) continue;
      counts[subtotal] = candidateCount;
      chosenCoins[subtotal] = coin;
      predecessors[subtotal] = subtotal - coin;
      dpUpdates += 1;
      addStep({
        phase: "optimal-update",
        codeSteps: ["optimal-loop", "extend-best"],
        activeCoin: coin,
        activeAmount: subtotal,
        changedAmounts: [subtotal],
        narration: `Best known way to make ${subtotal} is now ${candidateCount} coins: take ${coin} after subtotal ${subtotal - coin}.`,
        prompt: "Could another denomination produce fewer coins for this subtotal?"
      });
    }
  }

  const result = compareGreedyCoinChange(coins, amount);
  addStep({
    phase: "complete",
    codeSteps: ["compare-results"],
    activeAmount: Number.isFinite(counts[amount]) ? amount : null,
    narration: describeOutcome(result, amount),
    prompt: "What proof would be needed before trusting the greedy rule for every input?",
    result
  });
  return trace;
}

function reconstructCoins(amount, counts, chosenCoins, predecessors) {
  if (!Number.isFinite(counts[amount])) return [];
  const selected = [];
  for (let subtotal = amount; subtotal > 0; subtotal = predecessors[subtotal]) {
    selected.push(chosenCoins[subtotal]);
  }
  return selected;
}

function describeOutcome(result, amount) {
  if (result.outcome === "unreachable") {
    return `No combination of these denominations can make ${amount}. This unreachable input cannot establish greedy optimality.`;
  }
  if (result.outcome === "greedy-stuck") {
    return `Counterexample found: greedy gets stuck with ${result.greedy.remaining} remaining, while the optimal method reaches the target with ${result.optimal.coins.length} coins.`;
  }
  if (result.outcome === "optimal") {
    return `Greedy matches the optimum for this input with ${result.greedy.coins.length} coins.`;
  }
  return `Counterexample found: greedy uses ${result.greedy.coins.length} coins while the optimum uses ${result.optimal.coins.length}.`;
}
