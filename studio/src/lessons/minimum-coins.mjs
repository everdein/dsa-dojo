import {
  maximumMinimumCoinTarget,
  maximumMinimumCoinTypes,
  minimumCoins,
  validateMinimumCoinsInput
} from "../../../dynamic-programming/coin-change.mjs";
import { parseNumberList } from "../input.mjs";
import { buildMinimumCoinsTrace } from "../minimum-coins.mjs";

export const minimumCoinsLesson = {
  id: "dynamic-programming/minimum-coins",
  order: 52,
  topic: "Dynamic Programming",
  prerequisites: ["dynamic-programming/climbing-stairs"],
  patterns: ["dynamic-programming", "optimization", "coin-change"],
  catalogLabel: "Minimum Coins",
  catalogDescription: "Build optimal values from smaller amounts and identify unreachable states.",
  title: "Minimize coins with predecessor states",
  summary: "For each amount, extend every reachable predecessor by one coin and keep the smallest count. Remember the winning transition so an optimal selection can be reconstructed from the target back to zero.",
  views: [
    { id: "table", renderer: "array", heading: "Minimum-count table" },
    { id: "choices", renderer: "lookup", heading: "Predecessor choices" }
  ],
  input: {
    fields: [
      {
        id: "coins",
        label: `Enter 1-${maximumMinimumCoinTypes} unique positive denominations`,
        type: "text",
        inputMode: "numeric",
        placeholder: "1, 3, 4"
      },
      {
        id: "target",
        label: `Target amount (0-${maximumMinimumCoinTarget})`,
        type: "number",
        inputMode: "numeric",
        min: "0",
        max: String(maximumMinimumCoinTarget),
        step: "1"
      }
    ],
    help: "A -1 table cell means no combination reaches that amount yet. Equal-count choices keep the first denomination in input order, making reconstruction deterministic.",
    defaultValue: { coins: [1, 3, 4], target: 6 },
    sampleValue: { coins: [4, 6], target: 5 },
    parse: ({ coins, target }) => {
      const parsedCoins = parseNumberList(coins, { maximumLength: maximumMinimumCoinTypes });
      const targetText = target === undefined || target === null ? "" : String(target).trim();
      if (targetText === "") {
        throw new Error(`Target must be a whole number from 0 to ${maximumMinimumCoinTarget}.`);
      }
      const parsedTarget = Number(targetText);
      validateMinimumCoinsInput(parsedCoins, parsedTarget);
      return { coins: parsedCoins, target: parsedTarget };
    },
    serialize: ({ coins, target }) => ({
      coins: coins.join(", "),
      target: String(target)
    })
  },
  solve: ({ coins, target }) => minimumCoins(coins, target),
  buildTrace: buildMinimumCoinsTrace,
  code: {
    title: "Store the best transition into every reachable amount",
    filename: "coin-change.mjs",
    sourcePath: "dynamic-programming/coin-change.mjs",
    lines: [
      { number: 36, text: "  const counts = Array(target + 1).fill(null);", steps: ["initialize"] },
      { number: 39, text: "  counts[0] = 0;", steps: ["base-zero"] },
      { number: 41, text: "  for (let amount = 1; amount <= target; amount += 1) {", steps: ["amount-loop"] },
      { number: 42, text: "    for (const coin of coins) {", steps: ["coin-loop"] },
      { number: 43, text: "      if (coin > amount || counts[amount - coin] === null) continue;", steps: ["skip-invalid"] },
      { number: 44, text: "      const candidateCount = counts[amount - coin] + 1;", steps: ["build-candidate"] },
      { number: 45, text: "      if (counts[amount] !== null && candidateCount >= counts[amount]) continue;", steps: ["compare-best", "keep-best"] },
      { number: 46, text: "      counts[amount] = candidateCount;", steps: ["store-best"] },
      { number: 47, text: "      chosenCoins[amount] = coin;", steps: ["store-predecessor"] },
      { number: 48, text: "      predecessors[amount] = amount - coin;", steps: ["store-predecessor"] },
      { number: 50, text: "  }", steps: ["settle-state"] },
      { number: 52, text: "  if (counts[target] === null) {", steps: ["return-unreachable"] },
      { number: 53, text: "    return { reachable: false, minimum: null, selected: [] };", steps: ["return-unreachable"] },
      { number: 57, text: "  for (let amount = target; amount > 0; amount = predecessors[amount]) {", steps: ["reconstruct-loop"] },
      { number: 58, text: "    selected.push(chosenCoins[amount]);", steps: ["follow-predecessor"] },
      { number: 60, text: "  return { reachable: true, minimum: counts[target], selected };", steps: ["return-result"] }
    ]
  },
  stats: [
    {
      label: "Current amount",
      value: (step) => step.currentAmount === null ? "-" : String(step.currentAmount),
      detail: (step) => `target ${step.target}`
    },
    {
      label: "Current coin",
      value: (step) => step.currentCoin === null ? "-" : String(step.currentCoin),
      detail: (step) => step.predecessorAmount === null ? "no predecessor" : `from ${step.predecessorAmount}`
    },
    {
      label: "Reachable states",
      value: (step) => String(step.reachableStates),
      detail: (step) => `${step.settledStates} settled`
    },
    {
      label: "Best updates",
      accent: true,
      value: (step) => String(step.updates),
      detail: (step) => `${step.candidatesChecked} coin checks`
    }
  ],
  complexity: {
    chip: "OPTIMAL SUBSTRUCTURE",
    time: "O(target * c)",
    space: "O(target)",
    spaceLabel: "table and predecessors",
    explanation: "For every amount, test each of c denominations once. Minimum counts, chosen coins, and predecessor amounts each occupy one entry per target state; reconstruction then follows at most the minimum number of selected coins."
  },
  guide: {
    heading: "A state is reachable only when some coin extends a reachable predecessor."
  },
  legend: [
    { kind: "settled", label: "computed amount" },
    { kind: "predecessor", label: "dependency state" },
    { kind: "choice", label: "candidate coin" },
    { kind: "unreachable", label: "no valid transition" },
    { kind: "selected-path", label: "reconstructed optimum" }
  ],
  reflection: {
    eyebrow: "BEFORE YOU MOVE ON",
    title: "Why can an amount stay unreachable?",
    body: "Choose one unreachable target and inspect every denomination. Explain why each transition either has a negative predecessor or starts from another unreachable amount, and why that prevents any reconstruction chain to zero."
  }
};
