import test from "node:test";
import assert from "node:assert/strict";
import {
  buildBinaryTree,
  formatLevelOrderTree,
  listBinaryTreeNodes,
  parseLevelOrderTree
} from "../trees/model.mjs";
import { levelOrderTraversal } from "../trees/level-order-traversal.mjs";
import { buildLevelOrderTraversalTrace } from "../studio/src/level-order-traversal.mjs";
import { levelOrderTraversalLesson } from "../studio/src/lessons/level-order-traversal.mjs";
import {
  assertLesson,
  buildValidatedTrace
} from "../studio/src/lesson-contract.mjs";

test("level-order traversal groups balanced, skewed, singleton, and empty trees", () => {
  const cases = [
    [[8, 3, 10, 1, 6, null, 14], [[8], [3, 10], [1, 6, 14]]],
    [[4, 3, null, 2, null, null, null, 1], [[4], [3], [2], [1]]],
    [[4, null, 5, null, null, null, 6], [[4], [5], [6]]],
    [[7], [[7]]],
    [[null], []]
  ];

  for (const [slots, expected] of cases) {
    const original = [...slots];
    assert.deepEqual(levelOrderTraversal(slots), expected);
    assert.deepEqual(slots, original);
  }
});

test("level-order traversal reuses canonical model parsing and stable slot ids", () => {
  const slots = parseLevelOrderTree("8, 3, 10, 1, 6, null, 14, null, null");
  assert.deepEqual(slots, [8, 3, 10, 1, 6, null, 14]);
  assert.equal(formatLevelOrderTree(slots), "8, 3, 10, 1, 6, null, 14");
  assert.deepEqual(
    listBinaryTreeNodes(buildBinaryTree(slots)).map(({ id, slot, value }) => ({ id, slot, value })),
    [
      { id: "node-0", slot: 0, value: 8 },
      { id: "node-1", slot: 1, value: 3 },
      { id: "node-2", slot: 2, value: 10 },
      { id: "node-3", slot: 3, value: 1 },
      { id: "node-4", slot: 4, value: 6 },
      { id: "node-6", slot: 6, value: 14 }
    ]
  );
  assert.deepEqual(levelOrderTraversal(slots), [[8], [3, 10], [1, 6, 14]]);
  assert.deepEqual(parseLevelOrderTree("null"), [null]);
  assert.deepEqual(parseLevelOrderTree("-0"), [-0]);
});

test("level-order traversal rejects malformed trees through the shared model", () => {
  const sparse = Array(2);
  sparse[0] = 1;
  for (const slots of [
    undefined,
    null,
    [],
    sparse,
    [1, Number.NaN],
    [1, Infinity],
    [null, 2],
    [1, null, null, 4],
    Array(16).fill(1)
  ]) {
    assert.throws(() => levelOrderTraversal(slots));
  }
});

test("level-order lesson declares composite panels, curriculum metadata, and shared parser", () => {
  assert.equal(assertLesson(levelOrderTraversalLesson), levelOrderTraversalLesson);
  assert.equal(levelOrderTraversalLesson.id, "trees/level-order-traversal");
  assert.equal(levelOrderTraversalLesson.order, 26);
  assert.deepEqual(levelOrderTraversalLesson.prerequisites, [
    "queues/queue-operations",
    "trees/inorder-traversal"
  ]);
  assert.deepEqual(levelOrderTraversalLesson.patterns, ["breadth-first-search", "tree", "queue"]);
  assert.equal(Object.hasOwn(levelOrderTraversalLesson, "renderer"), false);
  assert.deepEqual(levelOrderTraversalLesson.views, [
    { id: "tree", renderer: "branching", heading: "Binary tree" },
    { id: "queue", renderer: "queue", heading: "Breadth-first queue" }
  ]);
  assert.deepEqual(levelOrderTraversalLesson.input.parse({ slots: "2, 1, 3, null, null" }), {
    slots: [2, 1, 3]
  });
  assert.deepEqual(levelOrderTraversalLesson.input.serialize({ slots: [-0, null, 2] }), {
    slots: "-0, null, 2"
  });
});

test("level-order trace enqueues the root, preserves FIFO order, and captures level boundaries", () => {
  const input = { slots: [8, 3, 10, 1, 6, null, 14] };
  const trace = buildValidatedTrace(levelOrderTraversalLesson, input);
  const visits = trace.filter(({ phase }) => phase === "visit");
  const levelStarts = trace.filter(({ phase }) => phase === "start-level");
  const levelFinishes = trace.filter(({ phase }) => phase === "finish-level");

  assert.equal(trace[0].phase, "initialize");
  assert.equal(trace[1].phase, "enqueue-root");
  assert.equal(trace.at(-1).phase, "complete");
  assert.deepEqual(visits.map(({ currentNodeValue }) => currentNodeValue), [8, 3, 10, 1, 6, 14]);
  assert.deepEqual(levelStarts.map(({ nodesRemainingInLevel }) => nodesRemainingInLevel), [1, 2, 3]);
  assert.deepEqual(levelFinishes.map(({ currentLevelValues }) => currentLevelValues), [
    [8],
    [3, 10],
    [1, 6, 14]
  ]);
  assert.equal(trace.filter(({ phase }) => phase === "enqueue-child").length, 5);
  assert.deepEqual(trace[1].views.queue.items, [
    { id: "node-0", value: 8, state: "current-level" }
  ]);

  const firstChildEnqueue = trace.find((step) => (
    step.phase === "enqueue-child" && step.views.queue.items.some(({ id }) => id === "node-1")
  ));
  assert.deepEqual(firstChildEnqueue.views.queue.items, [
    { id: "node-1", value: 3, state: "next-level" }
  ]);
  const secondLevel = levelStarts[1];
  assert.deepEqual(secondLevel.views.queue.items.map(({ id, state }) => ({ id, state })), [
    { id: "node-1", state: "current-level" },
    { id: "node-2", state: "current-level" }
  ]);
  assert.deepEqual(trace.at(-1).result, [[8], [3, 10], [1, 6, 14]]);
});

test("level-order empty and singleton traces remain valid", () => {
  const empty = buildValidatedTrace(levelOrderTraversalLesson, { slots: [null] });
  assert.deepEqual(empty.map(({ phase }) => phase), ["initialize", "complete"]);
  assert.deepEqual(empty.at(-1).result, []);
  assert.deepEqual(empty[0].views.tree.nodes, []);
  assert.deepEqual(empty[0].views.queue.items, []);

  const singleton = buildValidatedTrace(levelOrderTraversalLesson, { slots: [5] });
  assert.equal(singleton.filter(({ phase }) => phase === "visit").length, 1);
  assert.equal(singleton.filter(({ phase }) => phase === "enqueue-child").length, 0);
  assert.deepEqual(singleton.at(-1).result, [[5]]);
});

test("level-order traces are deterministic, immutable, and deeply own every panel snapshot", () => {
  const input = { slots: [5, 3, 9, null, 4, 7, 12] };
  const original = structuredClone(input);
  const first = buildLevelOrderTraversalTrace(input);
  const second = buildLevelOrderTraversalTrace(structuredClone(input));

  assert.deepEqual(first, second);
  assert.deepEqual(input, original);
  assert.deepEqual(first.at(-1).result, levelOrderTraversal(input.slots));
  first.forEach((step, index) => {
    assert.equal(step.step, index);
    assert.ok(step.codeSteps.length > 0);
    assert.equal(typeof step.narration, "string");
    assert.equal(typeof step.prompt, "string");
  });

  for (const [panelId, properties, objectProperties] of [
    ["tree", ["nodes", "edges", "rootIds", "activeNodeIds", "changedNodeIds", "states", "annotations", "pointers"], ["nodes", "edges", "states", "annotations", "pointers"]],
    ["queue", ["items", "activeItemIds", "changedItemIds", "annotations"], ["items", "annotations"]]
  ]) {
    assert.equal(new Set(first.map((step) => step.views[panelId])).size, first.length, panelId);
    for (const property of properties) {
      assert.equal(
        new Set(first.map((step) => step.views[panelId][property])).size,
        first.length,
        `${panelId}.${property}`
      );
    }
    for (const property of objectProperties) {
      const objects = first.flatMap((step) => step.views[panelId][property]);
      assert.equal(new Set(objects).size, objects.length, `${panelId}.${property} objects`);
    }
  }
  assert.equal(new Set(first.map((step) => step.completedLevels)).size, first.length);
  assert.equal(new Set(first.map((step) => step.currentLevelValues)).size, first.length);
  const nestedLevels = first.flatMap((step) => step.completedLevels);
  assert.equal(new Set(nestedLevels).size, nestedLevels.length);
});
