import test from "node:test";
import assert from "node:assert/strict";
import {
  maximumMinimumCoinTarget,
  maximumMinimumCoinTypes,
  minimumCoins,
  validateMinimumCoinsInput
} from "../dynamic-programming/coin-change.mjs";
import {
  assertLesson,
  assertTrace,
  buildValidatedTrace
} from "../studio/src/lesson-contract.mjs";
import { minimumCoinsLesson } from "../studio/src/lessons/minimum-coins.mjs";
import {
  buildMinimumCoinsTrace,
  minimumCoinsAmountKey
} from "../studio/src/minimum-coins.mjs";

test("minimumCoins returns explicit optimal, unreachable, and zero-target results without mutation", () => {
  const coins = [1, 3, 4];
  const before = [...coins];
  assert.deepEqual(minimumCoins(coins, 6), {
    reachable: true,
    minimum: 2,
    selected: [3, 3]
  });
  assert.deepEqual(coins, before);
  assert.deepEqual(minimumCoins([2, 5], 10), {
    reachable: true,
    minimum: 2,
    selected: [5, 5]
  });
  assert.deepEqual(minimumCoins([4, 6], 5), {
    reachable: false,
    minimum: null,
    selected: []
  });
  assert.deepEqual(minimumCoins([7], 0), {
    reachable: true,
    minimum: 0,
    selected: []
  });
});

test("equal-count solutions retain the first denomination in input order deterministically", () => {
  assert.deepEqual(minimumCoins([2, 3, 4], 6), {
    reachable: true,
    minimum: 2,
    selected: [2, 4]
  });
  assert.deepEqual(minimumCoins([4, 3, 2], 6), {
    reachable: true,
    minimum: 2,
    selected: [4, 2]
  });
  assert.deepEqual(minimumCoins([2, 3, 4], 6), minimumCoins([2, 3, 4], 6));
});

test("minimumCoins agrees with an independent count oracle across bounded coin sets", () => {
  const candidateSets = [
    [1],
    [2],
    [1, 2],
    [2, 3],
    [2, 5],
    [3, 4, 6],
    [1, 3, 4],
    [2, 3, 5, 7]
  ];
  for (const coins of candidateSets) {
    for (let target = 0; target <= 18; target += 1) {
      const result = minimumCoins(coins, target);
      const expectedMinimum = minimumCountOracle(coins, target);
      assert.equal(result.reachable, expectedMinimum !== null, `${coins}:${target}`);
      assert.equal(result.minimum, expectedMinimum, `${coins}:${target}`);
      assert.equal(result.selected.length, expectedMinimum ?? 0, `${coins}:${target}`);
      assert.equal(result.selected.reduce((sum, coin) => sum + coin, 0), result.reachable ? target : 0);
      assert.ok(result.selected.every((coin) => coins.includes(coin)));
    }
  }
});

test("Minimum Coins validation rejects malformed denominations and target bounds", () => {
  const sparse = Array(2);
  sparse[0] = 1;
  for (const [coins, target] of [
    [undefined, 1],
    [[], 1],
    [[1, 1], 2],
    [[0, 1], 2],
    [[-1, 2], 2],
    [[1.5, 2], 2],
    [[Number.MAX_SAFE_INTEGER + 1], 2],
    [sparse, 2],
    [Array.from({ length: maximumMinimumCoinTypes + 1 }, (_, index) => index + 1), 4],
    [[1], -1],
    [[1], 1.5],
    [[1], Number.NaN],
    [[1], Infinity],
    [[1], "5"],
    [[1], maximumMinimumCoinTarget + 1]
  ]) {
    assert.throws(() => validateMinimumCoinsInput(coins, target), /Minimum Coins/);
    assert.throws(() => minimumCoins(coins, target), /Minimum Coins/);
  }
});

test("Minimum Coins lesson declares exact roadmap metadata and bounded parsing", () => {
  assert.equal(assertLesson(minimumCoinsLesson), minimumCoinsLesson);
  assert.equal(minimumCoinsLesson.id, "dynamic-programming/minimum-coins");
  assert.equal(minimumCoinsLesson.order, 52);
  assert.equal(minimumCoinsLesson.topic, "Dynamic Programming");
  assert.deepEqual(minimumCoinsLesson.prerequisites, ["dynamic-programming/climbing-stairs"]);
  assert.deepEqual(minimumCoinsLesson.patterns, ["dynamic-programming", "optimization", "coin-change"]);
  assert.deepEqual(minimumCoinsLesson.views, [
    { id: "table", renderer: "array", heading: "Minimum-count table" },
    { id: "choices", renderer: "lookup", heading: "Predecessor choices" }
  ]);
  assert.deepEqual(minimumCoinsLesson.input.parse({ coins: " 1, 3, 4 ", target: " 6 " }), {
    coins: [1, 3, 4],
    target: 6
  });
  assert.deepEqual(minimumCoinsLesson.input.parse({ coins: "7", target: "0" }), {
    coins: [7],
    target: 0
  });
  assert.deepEqual(minimumCoinsLesson.input.serialize({ coins: [1, 3, 4], target: 6 }), {
    coins: "1, 3, 4",
    target: "6"
  });
  for (const input of [
    { coins: "", target: "1" },
    { coins: "1, 1", target: "2" },
    { coins: "1.5, 2", target: "2" },
    { coins: "1, 2", target: "" },
    { coins: "1, 2", target: "-1" },
    { coins: "1, 2", target: "31" }
  ]) {
    assert.throws(() => minimumCoinsLesson.input.parse(input));
  }
});

test("reachable trace evaluates candidates, stores predecessors, settles, and reconstructs", () => {
  const trace = buildMinimumCoinsTrace({ coins: [1, 3, 4], target: 6 });
  for (const phase of [
    "initialize",
    "start-amount",
    "skip-too-large",
    "consider-coin",
    "keep-best",
    "update-best",
    "settle-reachable",
    "reconstruct",
    "complete"
  ]) {
    assert.ok(trace.some((step) => step.phase === phase), phase);
  }

  const reconstruction = trace.filter(({ phase }) => phase === "reconstruct");
  assert.deepEqual(reconstruction.map(({ currentAmount }) => currentAmount), [6, 3]);
  assert.deepEqual(reconstruction.map(({ currentCoin }) => currentCoin), [3, 3]);
  assert.deepEqual(reconstruction.map(({ predecessorAmount }) => predecessorAmount), [3, 0]);
  assert.deepEqual(trace.at(-1).reconstructionAmounts, [6, 3, 0]);
  assert.deepEqual(trace.at(-1).selected, [3, 3]);
  assert.deepEqual(trace.at(-1).result, {
    reachable: true,
    minimum: 2,
    selected: [3, 3]
  });
});

test("every best update and settled state follows a reachable predecessor", () => {
  const coins = [2, 3, 5];
  const trace = buildMinimumCoinsTrace({ coins, target: 12 });
  for (const step of trace) {
    if (step.phase === "update-best") {
      assert.equal(step.predecessorAmount, step.currentAmount - step.currentCoin);
      assert.ok(step.predecessorAmount < step.currentAmount);
      assert.equal(step.counts[step.predecessorAmount] + 1, step.candidateCount);
      assert.equal(step.counts[step.currentAmount], step.candidateCount);
      assert.equal(step.chosenCoins[step.currentAmount], step.currentCoin);
      assert.equal(step.predecessors[step.currentAmount], step.predecessorAmount);
    }
    if (step.phase === "settle-reachable" || step.phase === "settle-unreachable") {
      const amount = step.currentAmount;
      const candidates = coins
        .filter((coin) => coin <= amount && step.counts[amount - coin] >= 0)
        .map((coin) => step.counts[amount - coin] + 1);
      const expected = candidates.length === 0 ? -1 : Math.min(...candidates);
      assert.equal(step.counts[amount], expected);
      assert.equal(step.phase, expected < 0 ? "settle-unreachable" : "settle-reachable");
    }
  }
});

test("unreachable traces remain explicit and never invent a predecessor chain", () => {
  const trace = buildMinimumCoinsTrace({ coins: [4, 6], target: 5 });
  assert.ok(trace.some(({ phase }) => phase === "skip-unreachable"));
  assert.ok(trace.some(({ phase }) => phase === "settle-unreachable"));
  assert.equal(trace.some(({ phase }) => phase === "reconstruct"), false);
  assert.deepEqual(trace.at(-1).result, {
    reachable: false,
    minimum: null,
    selected: []
  });
  assert.equal(trace.at(-1).counts[5], -1);
  assert.equal(trace.at(-1).chosenCoins[5], null);
  assert.equal(trace.at(-1).predecessors[5], null);
  assert.deepEqual(trace.at(-1).views.choices.resultKeys, []);
  assert.equal(trace.at(-1).views.choices.entries[5].state, "unreachable");
});

test("zero target consists only of the base state and a complete empty reconstruction", () => {
  const trace = buildMinimumCoinsTrace({ coins: [2, 5], target: 0 });
  assert.deepEqual(trace.map(({ phase }) => phase), ["initialize", "complete"]);
  assert.deepEqual(trace.at(-1).result, {
    reachable: true,
    minimum: 0,
    selected: []
  });
  assert.deepEqual(trace.at(-1).views.choices.resultKeys, ["0"]);
  assert.equal(trace.at(-1).counts[0], 0);
});

test("amount keys are stable and reject values outside their integer domain", () => {
  assert.equal(minimumCoinsAmountKey(0), "0");
  assert.equal(minimumCoinsAmountKey(30), "30");
  for (const amount of [-1, 1.5, Number.NaN, Infinity, "1"]) {
    assert.throws(() => minimumCoinsAmountKey(amount), /amount keys/);
  }
});

test("Minimum Coins trace is deterministic, immutable, and solver-aligned", () => {
  for (const input of [
    minimumCoinsLesson.input.defaultValue,
    minimumCoinsLesson.input.sampleValue,
    { coins: [2, 5], target: 0 },
    { coins: [7, 11], target: maximumMinimumCoinTarget }
  ]) {
    const before = structuredClone(input);
    const trace = buildValidatedTrace(minimumCoinsLesson, input);
    assert.equal(assertTrace(trace, minimumCoinsLesson), trace);
    assert.deepEqual(trace.at(-1).result, minimumCoins(input.coins, input.target));
    assert.deepEqual(input, before);
    assert.deepEqual(buildMinimumCoinsTrace(input), buildMinimumCoinsTrace(input));
  }
});

test("Minimum Coins trace deeply owns table, choice, and derived history snapshots", () => {
  const trace = buildMinimumCoinsTrace({ coins: [1, 3, 4], target: 6 });
  for (const property of [
    "counts",
    "chosenCoins",
    "predecessors",
    "selected",
    "reconstructionAmounts"
  ]) {
    assert.equal(new Set(trace.map((step) => step[property])).size, trace.length, property);
  }
  for (const [panel, properties] of [
    ["table", ["values", "activeIndices", "ranges", "markers", "annotations", "changedIndices"]],
    ["choices", ["entries", "activeKeys", "annotations", "resultKeys"]]
  ]) {
    assert.equal(new Set(trace.map((step) => step.views[panel])).size, trace.length, panel);
    for (const property of properties) {
      assert.equal(
        new Set(trace.map((step) => step.views[panel][property])).size,
        trace.length,
        `${panel}.${property}`
      );
    }
  }
  for (const [panel, properties] of [
    ["table", ["ranges", "markers", "annotations"]],
    ["choices", ["entries", "annotations"]]
  ]) {
    for (const property of properties) {
      const objects = trace.flatMap((step) => step.views[panel][property]);
      assert.equal(new Set(objects).size, objects.length, `${panel}.${property} objects`);
    }
  }

  trace[2].views.table.values = trace[1].views.table.values;
  assert.throws(() => assertTrace(trace, minimumCoinsLesson), /table.*values snapshot/);

  const nestedTrace = buildMinimumCoinsTrace({ coins: [1, 3, 4], target: 6 });
  nestedTrace[2].views.choices.entries[0] = nestedTrace[1].views.choices.entries[0];
  assert.throws(() => assertTrace(nestedTrace, minimumCoinsLesson), /choices.*entries objects/);
});

function minimumCountOracle(coins, target) {
  const distance = Array(target + 1).fill(null);
  const queue = [0];
  distance[0] = 0;
  for (let front = 0; front < queue.length; front += 1) {
    const amount = queue[front];
    for (const coin of coins) {
      const next = amount + coin;
      if (next > target || distance[next] !== null) continue;
      distance[next] = distance[amount] + 1;
      queue.push(next);
    }
  }
  return distance[target];
}
