import test from "node:test";
import assert from "node:assert/strict";
import {
  compareGreedyCoinChange,
  greedyCoinChange,
  maximumGreedyCoinAmount,
  maximumGreedyCoinTypes,
  optimalCoinChange,
  validateGreedyCoinInput
} from "../greedy/coin-change.mjs";
import { buildGreedyCoinChangeTrace } from "../studio/src/greedy-coin-change.mjs";
import { buildValidatedTrace } from "../studio/src/lesson-contract.mjs";
import { greedyCoinChangeLesson } from "../studio/src/lessons/greedy-coin-change.mjs";

test("coin-change comparison exposes a counterexample and a greedy-safe example", () => {
  assert.deepEqual(greedyCoinChange([1, 3, 4], 6), { possible: true, coins: [4, 1, 1], remaining: 0 });
  assert.deepEqual(optimalCoinChange([1, 3, 4], 6), { possible: true, coins: [3, 3], remaining: 0 });
  assert.deepEqual(
    { outcome: compareGreedyCoinChange([1, 3, 4], 6).outcome, greedyIsOptimal: compareGreedyCoinChange([1, 3, 4], 6).greedyIsOptimal },
    { outcome: "suboptimal", greedyIsOptimal: false }
  );
  assert.deepEqual(
    { outcome: compareGreedyCoinChange([1, 5, 10, 25], 37).outcome, greedyIsOptimal: compareGreedyCoinChange([1, 5, 10, 25], 37).greedyIsOptimal },
    { outcome: "optimal", greedyIsOptimal: true }
  );
  assert.deepEqual(compareGreedyCoinChange([4, 6], 5), {
    greedy: { possible: false, coins: [4], remaining: 1 },
    optimal: { possible: false, coins: [], remaining: 5 },
    outcome: "unreachable",
    greedyIsOptimal: null
  });
  assert.deepEqual(compareGreedyCoinChange([3, 4], 6), {
    greedy: { possible: false, coins: [4], remaining: 2 },
    optimal: { possible: true, coins: [3, 3], remaining: 0 },
    outcome: "greedy-stuck",
    greedyIsOptimal: false
  });
});

test("coin-change validates bounded unique positive integer denominations", () => {
  const sparse = Array(2); sparse[0] = 1;
  for (const [coins, amount] of [
    [[], 1], [[1, 1], 2], [[0, 1], 2], [[1.5], 2], [sparse, 2],
    [Array(maximumGreedyCoinTypes + 1).fill(0).map((_, index) => index + 1), 4],
    [[1], 0], [[1], maximumGreedyCoinAmount + 1], [[1], 1.5]
  ]) assert.throws(() => validateGreedyCoinInput(coins, amount));
});

test("greedy coin trace shows local takes and optimal table updates", () => {
  const trace = buildGreedyCoinChangeTrace({ coins: [1, 3, 4], amount: 6 });
  assert.ok(trace.some(({ phase }) => phase === "greedy-take"));
  assert.ok(trace.some(({ phase }) => phase === "optimal-update"));
  assert.equal(trace.at(-1).result.greedyIsOptimal, false);
  assert.deepEqual(trace.at(-1).result.optimal.coins, [3, 3]);

  const unreachable = buildGreedyCoinChangeTrace({ coins: [4, 6], amount: 5 }).at(-1);
  assert.equal(unreachable.result.outcome, "unreachable");
  assert.equal(unreachable.result.greedyIsOptimal, null);
  assert.match(unreachable.narration, /unreachable/i);
  assert.doesNotMatch(unreachable.narration, /matches the optimum/i);

  const stuck = buildGreedyCoinChangeTrace({ coins: [3, 4], amount: 6 }).at(-1);
  assert.equal(stuck.result.outcome, "greedy-stuck");
  assert.match(stuck.narration, /gets stuck/i);
});

test("greedy coin lesson is deterministic with fresh composite snapshots", () => {
  for (const input of [greedyCoinChangeLesson.input.defaultValue, greedyCoinChangeLesson.input.sampleValue]) {
    const trace = buildValidatedTrace(greedyCoinChangeLesson, input);
    for (const panel of ["greedy", "optimal"]) {
      assert.equal(new Set(trace.map((step) => step.views[panel])).size, trace.length, panel);
    }
  }
});
