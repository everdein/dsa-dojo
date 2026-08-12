import test from "node:test";
import assert from "node:assert/strict";
import {
  inorderTraversal,
  validateInorderTraversalInput
} from "../trees/inorder-traversal.mjs";
import {
  binaryTreeNodeId,
  buildBinaryTree,
  formatLevelOrderTree,
  levelOrderSlots,
  listBinaryTreeNodes,
  maximumBinaryTreeNodes,
  parseLevelOrderTree,
  validateLevelOrderTree
} from "../trees/model.mjs";
import { buildInorderTraversalTrace } from "../studio/src/inorder-traversal.mjs";
import {
  assertLesson,
  assertTrace,
  buildValidatedTrace
} from "../studio/src/lesson-contract.mjs";
import { inorderTraversalLesson } from "../studio/src/lessons/inorder-traversal.mjs";

test("binary tree model parses, formats, and builds stable slot-derived nodes", () => {
  const slots = parseLevelOrderTree(" 8, 3, 10, 1, 6, null, 14, null, null ");
  assert.deepEqual(slots, [8, 3, 10, 1, 6, null, 14]);
  assert.equal(formatLevelOrderTree(slots), "8, 3, 10, 1, 6, null, 14");

  const root = buildBinaryTree(slots);
  assert.deepEqual(
    listBinaryTreeNodes(root).map(({ id, slot, value }) => ({ id, slot, value })),
    [
      { id: "node-0", slot: 0, value: 8 },
      { id: "node-1", slot: 1, value: 3 },
      { id: "node-2", slot: 2, value: 10 },
      { id: "node-3", slot: 3, value: 1 },
      { id: "node-4", slot: 4, value: 6 },
      { id: "node-6", slot: 6, value: 14 }
    ]
  );
  assert.equal(root.left.right.id, "node-4");
  assert.equal(root.right.right.id, "node-6");
  assert.equal(root.right.left, null);
  assert.deepEqual(levelOrderSlots(root), slots);
  assert.equal(binaryTreeNodeId(14), "node-14");
});

test("binary tree model represents an empty tree as one null root token", () => {
  assert.deepEqual(parseLevelOrderTree("NULL"), [null]);
  assert.equal(formatLevelOrderTree([null, null]), "null");
  assert.equal(buildBinaryTree([null]), null);
  assert.deepEqual(levelOrderSlots(null), [null]);
  assert.deepEqual(listBinaryTreeNodes(null), []);
});

test("binary tree model rejects malformed, oversized, sparse, and orphaned slots", () => {
  for (const raw of [
    undefined,
    null,
    "",
    "1,,2",
    "1, nope",
    "1, Infinity",
    Array.from({ length: maximumBinaryTreeNodes + 1 }, (_, index) => index).join(",")
  ]) {
    assert.throws(() => parseLevelOrderTree(raw), /tree|number|comma|level-order/i);
  }

  const sparse = Array(3);
  sparse[0] = 1;
  sparse[2] = 2;
  for (const slots of [
    [],
    sparse,
    [1, Number.NaN],
    [1, Infinity],
    [null, 1],
    [1, null, 2, 3],
    Array.from({ length: maximumBinaryTreeNodes + 1 }, (_, index) => index)
  ]) {
    assert.throws(() => validateLevelOrderTree(slots), /tree|slot|orphan/i);
    assert.throws(() => validateInorderTraversalInput(slots), /tree|slot|orphan/i);
    assert.throws(() => inorderTraversal(slots), /tree|slot|orphan/i);
  }

  assert.throws(() => binaryTreeNodeId(-1), /slots/);
  assert.throws(() => binaryTreeNodeId(maximumBinaryTreeNodes), /slots/);
});

test("inorderTraversal handles balanced, skewed, duplicate-valued, and empty trees", () => {
  const cases = [
    [[8, 3, 10, 1, 6, null, 14], [1, 3, 6, 8, 10, 14]],
    [[4, 3, null, 2, null, null, null, 1], [1, 2, 3, 4]],
    [[1, null, 2, null, null, null, 3], [1, 2, 3]],
    [[2, 2, 2], [2, 2, 2]],
    [[null], []]
  ];

  for (const [slots, expected] of cases) {
    const before = [...slots];
    assert.deepEqual(inorderTraversal(slots), expected);
    assert.deepEqual(slots, before);
  }
});

test("Inorder Traversal lesson declares the composite tree and stack contract", () => {
  assert.equal(assertLesson(inorderTraversalLesson), inorderTraversalLesson);
  assert.equal(inorderTraversalLesson.id, "trees/inorder-traversal");
  assert.equal(inorderTraversalLesson.order, 25);
  assert.deepEqual(inorderTraversalLesson.prerequisites, ["stacks/valid-parentheses"]);
  assert.deepEqual(inorderTraversalLesson.patterns, ["depth-first-search", "tree", "inorder"]);
  assert.deepEqual(inorderTraversalLesson.views, [
    { id: "tree", renderer: "branching", heading: "Binary tree" },
    { id: "stack", renderer: "stack", heading: "Pending path" }
  ]);
  assert.deepEqual(
    inorderTraversalLesson.input.parse({ tree: "2, 1, 3" }),
    { slots: [2, 1, 3] }
  );
  assert.deepEqual(
    inorderTraversalLesson.input.serialize({ slots: [-0, null, 2] }),
    { tree: "-0, null, 2" }
  );
  assert.deepEqual(
    inorderTraversalLesson.input.parse({ tree: "null" }),
    { slots: [null] }
  );
});

test("Inorder trace pushes each node, visits it once, then moves right", () => {
  const slots = [8, 3, 10, 1, 6, null, 14];
  const expected = inorderTraversal(slots);
  const trace = buildInorderTraversalTrace(slots);
  const pushes = trace.filter(({ phase }) => phase === "descend-left");
  const visits = trace.filter(({ phase }) => phase === "visit");
  const rightMoves = trace.filter(({ phase }) => phase === "move-right");

  assert.equal(pushes.length, expected.length);
  assert.equal(visits.length, expected.length);
  assert.equal(rightMoves.length, expected.length);
  assert.deepEqual(visits.map(({ currentValue }) => currentValue), expected);
  assert.deepEqual(trace.at(-1).result, expected);

  visits.forEach((step, index) => {
    assert.deepEqual(step.outputValues, expected.slice(0, index + 1));
    assert.equal(step.visitedCount, index + 1);
    assert.equal(step.views.tree.states.some((state) => (
      state.nodeId === step.currentNodeId && state.kind === "visited"
    )), true);
  });

  for (const step of trace) {
    assert.deepEqual(step.views.stack.items.map(({ id }) => id), step.stackNodeIds);
    assert.equal(step.views.stack.topItemId, step.stackNodeIds.at(-1) ?? null);
    assert.deepEqual(
      step.views.tree.nodes.map(({ id }) => id),
      ["node-0", "node-1", "node-2", "node-3", "node-4", "node-6"]
    );
  }
});

test("empty inorder trace keeps both renderers valid and returns no values", () => {
  const trace = buildValidatedTrace(inorderTraversalLesson, { slots: [null] });
  assert.deepEqual(trace.map(({ phase }) => phase), ["initialize", "complete"]);
  assert.deepEqual(trace.at(-1).result, []);
  for (const step of trace) {
    assert.deepEqual(step.views.tree.nodes, []);
    assert.deepEqual(step.views.tree.edges, []);
    assert.deepEqual(step.views.tree.rootIds, []);
    assert.equal(step.views.tree.pointers[0].nodeId, null);
    assert.deepEqual(step.views.stack.items, []);
    assert.equal(step.views.stack.topItemId, null);
  }
});

test("Inorder lesson trace is deterministic, solver-aligned, and input-immutable", () => {
  const input = { slots: [4, 2, 6, 1, 3, 5, 7] };
  const before = structuredClone(input);
  const trace = buildValidatedTrace(inorderTraversalLesson, input);
  assert.equal(assertTrace(trace, inorderTraversalLesson), trace);
  assert.deepEqual(trace.at(-1).result, inorderTraversal(input.slots));
  assert.deepEqual(input, before);
  assert.deepEqual(
    buildInorderTraversalTrace(input.slots),
    buildInorderTraversalTrace(structuredClone(input.slots))
  );
});

test("Inorder trace owns every renderer and derived snapshot deeply", () => {
  const trace = buildInorderTraversalTrace([2, 1, 3]);
  for (const panelId of ["tree", "stack"]) {
    assert.equal(new Set(trace.map((step) => step.views[panelId])).size, trace.length);
  }
  for (const property of [
    "nodes",
    "edges",
    "rootIds",
    "activeNodeIds",
    "changedNodeIds",
    "states",
    "annotations",
    "pointers"
  ]) {
    assert.equal(new Set(trace.map((step) => step.views.tree[property])).size, trace.length);
  }
  for (const property of ["items", "activeItemIds", "changedItemIds", "annotations"]) {
    assert.equal(new Set(trace.map((step) => step.views.stack[property])).size, trace.length);
  }
  for (const property of ["stackNodeIds", "visitedNodeIds", "outputValues"]) {
    assert.equal(new Set(trace.map((step) => step[property])).size, trace.length);
  }
  for (const [panelId, properties] of [
    ["tree", ["nodes", "edges", "states", "annotations", "pointers"]],
    ["stack", ["items", "annotations"]]
  ]) {
    for (const property of properties) {
      const objects = trace.flatMap((step) => step.views[panelId][property]);
      assert.equal(new Set(objects).size, objects.length, `${panelId}.${property}`);
    }
  }

  trace[1].views.tree.nodes = trace[0].views.tree.nodes;
  assert.throws(
    () => assertTrace(trace, inorderTraversalLesson),
    /View panel tree:.*nodes snapshot/i
  );

  const nestedTrace = buildInorderTraversalTrace([2, 1, 3]);
  nestedTrace[1].views.tree.nodes[0] = nestedTrace[0].views.tree.nodes[0];
  assert.throws(
    () => assertTrace(nestedTrace, inorderTraversalLesson),
    /View panel tree:.*nodes objects/i
  );
});
