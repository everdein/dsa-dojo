import {
  minimumCoins,
  validateMinimumCoinsInput
} from "../../dynamic-programming/coin-change.mjs";

export { minimumCoins };

export function buildMinimumCoinsTrace({ coins, target }) {
  validateMinimumCoinsInput(coins, target);

  const trace = [];
  const counts = Array(target + 1).fill(-1);
  const chosenCoins = Array(target + 1).fill(null);
  const predecessors = Array(target + 1).fill(null);
  const selected = [];
  const reconstructionAmounts = new Set();
  counts[0] = 0;
  let builtThrough = 0;
  let candidatesChecked = 0;
  let updates = 0;

  const addStep = ({
    phase,
    codeSteps,
    currentAmount,
    currentCoin = null,
    predecessorAmount = null,
    candidateCount = null,
    decision = null,
    changedAmounts = [],
    annotation = null,
    narration,
    prompt,
    result
  }) => {
    const currentBest = currentAmount === null || counts[currentAmount] < 0
      ? null
      : counts[currentAmount];
    const activeAmounts = [...new Set([
      ...(currentAmount === null ? [] : [currentAmount]),
      ...(predecessorAmount === null ? [] : [predecessorAmount])
    ])];
    const step = {
      step: trace.length,
      phase,
      codeSteps: [...codeSteps],
      target,
      currentAmount,
      currentCoin,
      predecessorAmount,
      candidateCount,
      currentBest,
      decision,
      builtThrough,
      settledStates: builtThrough + 1,
      reachableStates: counts.slice(0, builtThrough + 1).filter((count) => count >= 0).length,
      candidatesChecked,
      updates,
      counts: [...counts],
      chosenCoins: [...chosenCoins],
      predecessors: [...predecessors],
      selected: [...selected],
      reconstructionAmounts: [...reconstructionAmounts],
      views: {
        table: buildTableView({
          counts,
          builtThrough,
          currentAmount,
          currentCoin,
          predecessorAmount,
          changedAmounts
        }),
        choices: buildChoiceView({
          counts,
          chosenCoins,
          predecessors,
          builtThrough,
          currentAmount,
          predecessorAmount,
          reconstructionAmounts,
          annotation
        })
      },
      narration,
      prompt
    };
    if (result !== undefined) {
      step.result = {
        ...result,
        selected: [...result.selected]
      };
    }
    trace.push(step);
  };

  addStep({
    phase: "initialize",
    codeSteps: ["initialize", "base-zero"],
    currentAmount: 0,
    decision: "base",
    changedAmounts: [0],
    annotation: "zero coins reach amount 0",
    narration: "Seed dp(0) = 0. Taking no coins is the reachable base state from which every later candidate extends.",
    prompt: target === 0
      ? "Is the target already solved by the empty selection?"
      : "Which earlier amount must a coin extend to reach amount 1?"
  });

  for (let amount = 1; amount <= target; amount += 1) {
    addStep({
      phase: "start-amount",
      codeSteps: ["amount-loop"],
      currentAmount: amount,
      decision: "evaluating",
      annotation: `find the minimum for ${amount}`,
      narration: `Evaluate amount ${amount}. It remains unreachable until a denomination extends an already reachable predecessor.`,
      prompt: "Which denominations have a reachable amount immediately before this state?"
    });

    for (const coin of coins) {
      candidatesChecked += 1;
      if (coin > amount) {
        addStep({
          phase: "skip-too-large",
          codeSteps: ["coin-loop", "skip-invalid"],
          currentAmount: amount,
          currentCoin: coin,
          decision: "too-large",
          annotation: `coin ${coin} exceeds ${amount}`,
          narration: `Coin ${coin} is larger than amount ${amount}, so it has no nonnegative predecessor state.`,
          prompt: "Can this denomination become useful for a later amount?"
        });
        continue;
      }

      const predecessorAmount = amount - coin;
      if (counts[predecessorAmount] < 0) {
        addStep({
          phase: "skip-unreachable",
          codeSteps: ["coin-loop", "skip-invalid"],
          currentAmount: amount,
          currentCoin: coin,
          predecessorAmount,
          decision: "unreachable-predecessor",
          annotation: `dp(${predecessorAmount}) is unreachable`,
          narration: `Coin ${coin} would extend amount ${predecessorAmount}, but that predecessor is unreachable. It cannot form amount ${amount}.`,
          prompt: "Why must every valid transition begin at a reachable state?"
        });
        continue;
      }

      const candidateCount = counts[predecessorAmount] + 1;
      const improves = counts[amount] < 0 || candidateCount < counts[amount];
      addStep({
        phase: "consider-coin",
        codeSteps: ["coin-loop", "build-candidate", "compare-best"],
        currentAmount: amount,
        currentCoin: coin,
        predecessorAmount,
        candidateCount,
        decision: improves ? "improves" : "not-better",
        annotation: `${candidateCount} via coin ${coin}`,
        narration: `Extend dp(${predecessorAmount}) = ${counts[predecessorAmount]} with coin ${coin}. The candidate for amount ${amount} uses ${candidateCount} ${candidateCount === 1 ? "coin" : "coins"}.`,
        prompt: improves
          ? "Which predecessor and coin should this state remember?"
          : "Why does an equal or larger candidate leave the earlier choice unchanged?"
      });

      if (!improves) {
        addStep({
          phase: "keep-best",
          codeSteps: ["keep-best"],
          currentAmount: amount,
          currentCoin: coin,
          predecessorAmount,
          candidateCount,
          decision: "not-better",
          annotation: `keep ${counts[amount]} via coin ${chosenCoins[amount]}`,
          narration: `Keep the existing ${counts[amount]}-coin solution. Ties preserve the first optimal denomination encountered in the learner's input order.`,
          prompt: "Does retaining this tie change the minimum count?"
        });
        continue;
      }

      counts[amount] = candidateCount;
      chosenCoins[amount] = coin;
      predecessors[amount] = predecessorAmount;
      updates += 1;
      addStep({
        phase: "update-best",
        codeSteps: ["store-best", "store-predecessor"],
        currentAmount: amount,
        currentCoin: coin,
        predecessorAmount,
        candidateCount,
        decision: "updated",
        changedAmounts: [amount],
        annotation: `choose coin ${coin}, then follow ${predecessorAmount}`,
        narration: `Store dp(${amount}) = ${candidateCount}, chosen coin ${coin}, and predecessor ${predecessorAmount}. These links will reconstruct an optimal selection.`,
        prompt: "Could a later denomination still lower this state's count?"
      });
    }

    builtThrough = amount;
    const reachable = counts[amount] >= 0;
    addStep({
      phase: reachable ? "settle-reachable" : "settle-unreachable",
      codeSteps: ["settle-state"],
      currentAmount: amount,
      currentCoin: reachable ? chosenCoins[amount] : null,
      predecessorAmount: reachable ? predecessors[amount] : null,
      decision: reachable ? "reachable" : "unreachable",
      annotation: reachable
        ? `minimum ${counts[amount]} ${counts[amount] === 1 ? "coin" : "coins"}`
        : "no denomination reaches this amount",
      narration: reachable
        ? `Amount ${amount} is settled with a minimum of ${counts[amount]} ${counts[amount] === 1 ? "coin" : "coins"}.`
        : `Amount ${amount} is settled as unreachable because no denomination extended a reachable predecessor.`,
      prompt: amount === target
        ? "Can the target's predecessor links now be reconstructed?"
        : "How can this settled state support later amounts?"
    });
  }

  const result = minimumCoins(coins, target);
  if (result.reachable) {
    let amount = target;
    reconstructionAmounts.add(amount);
    while (amount > 0) {
      const coin = chosenCoins[amount];
      const predecessorAmount = predecessors[amount];
      selected.push(coin);
      reconstructionAmounts.add(predecessorAmount);
      addStep({
        phase: "reconstruct",
        codeSteps: ["reconstruct-loop", "follow-predecessor"],
        currentAmount: amount,
        currentCoin: coin,
        predecessorAmount,
        candidateCount: counts[amount],
        decision: "selected",
        annotation: `take coin ${coin}; continue at ${predecessorAmount}`,
        narration: `At amount ${amount}, take remembered coin ${coin} and follow its predecessor to ${predecessorAmount}.`,
        prompt: predecessorAmount === 0
          ? "Does the reconstructed selection contain exactly the stored minimum number of coins?"
          : "Which coin does the next predecessor state remember?"
      });
      amount = predecessorAmount;
    }
  }

  addStep({
    phase: "complete",
    codeSteps: result.reachable ? ["return-result"] : ["return-unreachable"],
    currentAmount: target,
    currentCoin: result.reachable && target > 0 ? chosenCoins[target] : null,
    predecessorAmount: result.reachable && target > 0 ? predecessors[target] : null,
    candidateCount: result.minimum,
    decision: result.reachable ? "reachable" : "unreachable",
    annotation: result.reachable
      ? `${result.minimum} ${result.minimum === 1 ? "coin" : "coins"}: ${result.selected.join(" + ") || "empty selection"}`
      : "target is unreachable",
    narration: result.reachable
      ? `Target ${target} is reachable with a minimum of ${result.minimum} ${result.minimum === 1 ? "coin" : "coins"}${result.selected.length ? `: ${result.selected.join(" + ")}` : " via the empty selection"}.`
      : `Target ${target} is unreachable with denominations ${coins.join(", ")}. No predecessor chain exists.`,
    prompt: result.reachable
      ? "Why does following stored predecessors recover a globally optimal selection?"
      : "Which missing reachable predecessor prevents the target from being formed?",
    result
  });

  return trace;
}

export function minimumCoinsAmountKey(amount) {
  if (!Number.isInteger(amount) || amount < 0) {
    throw new Error("Minimum Coins amount keys require a nonnegative integer.");
  }
  return String(amount);
}

function buildTableView({
  counts,
  builtThrough,
  currentAmount,
  currentCoin,
  predecessorAmount,
  changedAmounts
}) {
  const markers = new Map();
  if (predecessorAmount !== null) {
    markers.set(predecessorAmount, {
      index: predecessorAmount,
      kind: "predecessor",
      label: "reachable predecessor"
    });
  }
  if (currentAmount !== null) {
    markers.set(currentAmount, {
      index: currentAmount,
      kind: currentCoin === null ? "current" : "choice",
      label: currentCoin === null ? "current amount" : `try coin ${currentCoin}`
    });
  }

  return {
    values: [...counts],
    activeIndices: [...new Set([
      ...(currentAmount === null ? [] : [currentAmount]),
      ...(predecessorAmount === null ? [] : [predecessorAmount])
    ])],
    ranges: [{
      start: 0,
      end: builtThrough,
      kind: "settled",
      label: "settled DP states"
    }],
    markers: [...markers.values()],
    annotations: counts.map((count, amount) => ({
      index: amount,
      label: count >= 0
        ? `dp(${amount}) = ${count}`
        : amount <= builtThrough
          ? `dp(${amount}) = unreachable`
          : `dp(${amount}) = pending`
    })),
    changedIndices: [...changedAmounts]
  };
}

function buildChoiceView({
  counts,
  chosenCoins,
  predecessors,
  builtThrough,
  currentAmount,
  predecessorAmount,
  reconstructionAmounts,
  annotation
}) {
  const entries = counts.map((count, amount) => {
    const selected = reconstructionAmounts.has(amount);
    const state = selected
      ? "selected-path"
      : amount === 0
        ? "base"
        : amount > builtThrough && amount !== currentAmount
          ? "pending"
          : count < 0
            ? amount <= builtThrough
              ? "unreachable"
              : "evaluating"
            : amount <= builtThrough
              ? "reachable"
              : "candidate";
    let value = "pending";
    if (amount === 0) value = "0 coins; base";
    else if (count >= 0) value = `${count} ${count === 1 ? "coin" : "coins"}; +${chosenCoins[amount]} from ${predecessors[amount]}`;
    else if (amount <= builtThrough) value = "unreachable";
    return { key: minimumCoinsAmountKey(amount), value, state };
  });
  const activeKeys = [...new Set([
    ...(currentAmount === null ? [] : [minimumCoinsAmountKey(currentAmount)]),
    ...(predecessorAmount === null ? [] : [minimumCoinsAmountKey(predecessorAmount)])
  ])];
  return {
    entries,
    activeKeys,
    annotations: annotation === null || currentAmount === null
      ? []
      : [{ key: minimumCoinsAmountKey(currentAmount), label: annotation }],
    resultKeys: [...reconstructionAmounts].map(minimumCoinsAmountKey)
  };
}
