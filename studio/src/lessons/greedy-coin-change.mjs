import {
  compareGreedyCoinChange,
  maximumGreedyCoinAmount,
  maximumGreedyCoinTypes
} from "../../../greedy/coin-change.mjs";
import { parseNumberList, parsePositiveInteger } from "../input.mjs";
import { buildGreedyCoinChangeTrace } from "../greedy-coin-change.mjs";

export const greedyCoinChangeLesson = {
  id: "greedy/coin-change-counterexample",
  order: 49,
  topic: "Greedy",
  prerequisites: ["greedy/activity-selection"],
  patterns: ["greedy", "counterexample", "dynamic-programming-bridge"],
  catalogLabel: "Greedy Coin Change",
  catalogDescription: "Compare largest-first choices with an optimal counterexample.",
  title: "Challenge greedy coin change",
  summary: "Take the largest coin that fits, then compute an optimal baseline. A single mismatch disproves the claim that the local rule always minimizes coin count.",
  views: [
    { id: "greedy", renderer: "array", heading: "Greedy denominations" },
    { id: "optimal", renderer: "lookup", heading: "Optimal subtotal table" }
  ],
  input: {
    fields: [
      { id: "coins", label: `Enter 1-${maximumGreedyCoinTypes} unique positive denominations`, type: "text", inputMode: "numeric", placeholder: "1, 3, 4" },
      { id: "amount", label: `Target amount (1-${maximumGreedyCoinAmount})`, type: "number", inputMode: "numeric", min: "1", max: String(maximumGreedyCoinAmount), step: "1" }
    ],
    help: "Try coins 1, 3, 4 with amount 6: largest-first chooses 4 + 1 + 1, while 3 + 3 is optimal.",
    defaultValue: { coins: [1, 3, 4], amount: 6 },
    sampleValue: { coins: [1, 5, 10, 25], amount: 37 },
    parse: ({ coins, amount }) => ({
      coins: parseNumberList(coins, { maximumLength: maximumGreedyCoinTypes }),
      amount: parsePositiveInteger(amount, "Target amount")
    }),
    serialize: ({ coins, amount }) => ({ coins: coins.join(", "), amount: String(amount) })
  },
  solve: ({ coins, amount }) => compareGreedyCoinChange(coins, amount),
  buildTrace: buildGreedyCoinChangeTrace,
  code: {
    title: "Test a local rule against an optimal baseline",
    filename: "coin-change.mjs",
    sourcePath: "greedy/coin-change.mjs",
    lines: [
      { number: 24, text: "  const ordered = [...coins].sort((left, right) => right - left);", steps: ["sort-coins", "initialize"] },
      { number: 27, text: "  for (const coin of ordered) {", steps: ["greedy-loop"] },
      { number: 28, text: "    while (coin <= remaining) {", steps: ["greedy-loop"] },
      { number: 29, text: "      selected.push(coin);", steps: ["take-largest"] },
      { number: 30, text: "      remaining -= coin;", steps: ["take-largest"] },
      { number: 42, text: "  for (let subtotal = 1; subtotal <= amount; subtotal += 1) {", steps: ["optimal-loop"] },
      { number: 45, text: "      const candidateCount = counts[subtotal - coin] + 1;", steps: ["extend-best"] },
      { number: 75, text: "  return {", steps: ["compare-results"] },
      { number: 78, text: "    outcome,", steps: ["compare-results"] },
      { number: 79, text: "    greedyIsOptimal: outcome === \"unreachable\" ? null : outcome === \"optimal\"", steps: ["compare-results"] },
      { number: 80, text: "  };", steps: ["compare-results"] }
    ]
  },
  stats: [
    { label: "Remaining", value: (step) => String(step.remaining), detail: () => "greedy run" },
    { label: "Greedy coins", value: (step) => String(step.greedyCoins.length) },
    { label: "Table updates", value: (step) => String(step.dpUpdates), detail: () => "optimal baseline" },
    { label: "Optimal coins", accent: true, value: (step) => step.optimalCoins.length ? String(step.optimalCoins.length) : "-" }
  ],
  complexity: {
    chip: "COUNTEREXAMPLE",
    time: "O(amount · c)",
    space: "O(amount)",
    spaceLabel: "comparison baseline",
    explanation: "The greedy run is short, but proving it wrong here uses a dynamic-programming baseline across every subtotal and denomination. One valid counterexample is enough to refute a universal greedy claim."
  },
  guide: { heading: "A plausible local choice still needs a global proof." },
  legend: [
    { kind: "current", label: "greedy denomination" },
    { kind: "known", label: "reachable subtotal" },
    { kind: "target", label: "optimal target" }
  ],
  reflection: {
    eyebrow: "BEFORE YOU MOVE ON",
    title: "What does a counterexample prove?",
    body: "Explain why coins 1, 3, 4 and amount 6 disprove largest-first optimality in general, while one successful currency system cannot prove the rule universally."
  }
};
