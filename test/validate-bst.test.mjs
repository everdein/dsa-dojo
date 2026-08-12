import test from "node:test";
import assert from "node:assert/strict";
import {
  formatLevelOrderTree,
  maximumBinaryTreeNodes,
  parseLevelOrderTree
} from "../trees/model.mjs";
import {
  isValidBinarySearchTree,
  isValidBst,
  validateBinarySearchTree,
  validateBst
} from "../trees/validate-bst.mjs";
import {
  assertLesson,
  assertTrace,
  buildValidatedTrace
} from "../studio/src/lesson-contract.mjs";
import { buildValidateBstTrace } from "../studio/src/validate-bst.mjs";
import { validateBstLesson } from "../studio/src/lessons/validate-bst.mjs";

test("validate-bst accepts empty, singleton, balanced, and finite-boundary trees", () => {
  for (const slots of [
    [null],
    [4],
    [8, 3, 10, 1, 6, null, 14],
    [0, -Number.MAX_VALUE, Number.MAX_VALUE]
  ]) {
    assert.equal(isValidBinarySearchTree(slots), true, formatLevelOrderTree(slots));
  }
});

test("validate-bst carries ancestor-wide bounds through both subtrees", () => {
  assert.equal(isValidBinarySearchTree([10, 5, 15, null, null, 6, 20]), false);
  assert.equal(isValidBinarySearchTree([10, 5, 15, null, 12]), false);
  assert.equal(isValidBinarySearchTree([10, 5, 15, null, 9]), true);
});

test("validate-bst uses strict bounds, so direct and deep duplicates are invalid", () => {
  assert.equal(isValidBinarySearchTree([2, 1, 2]), false);
  assert.equal(isValidBinarySearchTree([5, 3, 7, null, 5]), false);
  assert.equal(isValidBinarySearchTree([0, -0]), false);
});

test("validate-bst aliases expose the same deterministic boolean solver", () => {
  const slots = [2, 1, 3];
  assert.equal(isValidBst(slots), true);
  assert.equal(validateBst(slots), true);
  assert.equal(validateBinarySearchTree(slots), true);
});

test("validate-bst delegates malformed tree rejection without mutating input", () => {
  const sparse = [2, 1, 3];
  delete sparse[1];
  for (const slots of [
    undefined,
    null,
    [],
    sparse,
    [2, Number.NaN],
    [2, Infinity],
    [2, null, 3, 1],
    Array.from({ length: maximumBinaryTreeNodes + 1 }, (_, value) => value)
  ]) {
    assert.throws(() => isValidBinarySearchTree(slots));
  }

  const input = [8, 3, 10, 1, 6, null, 14];
  const before = structuredClone(input);
  assert.equal(isValidBinarySearchTree(input), true);
  assert.deepEqual(input, before);
});

test("validate-bst lesson parses and serializes canonical level-order trees", () => {
  const fields = { tree: "10, 5, 15, null, null, 6, 20, null, null" };
  const parsed = validateBstLesson.input.parse(fields);
  assert.deepEqual(parsed, { slots: [10, 5, 15, null, null, 6, 20] });
  assert.deepEqual(
    validateBstLesson.input.parse(validateBstLesson.input.serialize(parsed)),
    parsed
  );
  assert.deepEqual(parseLevelOrderTree("null"), [null]);
});

test("validate-bst trace exposes exclusive bounds and stops at the first violation", () => {
  const trace = buildValidateBstTrace([10, 5, 15, null, null, 6, 20]);
  const invalid = trace.find(({ phase }) => phase === "invalid");
  assert.equal(invalid.currentNodeId, "node-5");
  assert.equal(invalid.currentValue, 6);
  assert.equal(invalid.lowerBound, 10);
  assert.equal(invalid.upperBound, 15);
  assert.equal(invalid.boundsLabel, "(10, 15)");
  assert.equal(trace.some(({ currentNodeId }) => currentNodeId === "node-6"), false);
  assert.equal(trace.at(-1).result, false);
});

test("validate-bst trace marks each valid visit and handles empty and singleton trees", () => {
  const valid = buildValidateBstTrace([2, 1, 3]);
  assert.equal(valid.filter(({ phase }) => phase === "valid").length, 3);
  assert.equal(valid.at(-1).checkedCount, 3);
  assert.equal(valid.at(-1).result, true);

  const empty = buildValidateBstTrace([null]);
  assert.deepEqual(empty.map(({ phase }) => phase), ["initialize", "complete"]);
  assert.deepEqual(empty.at(-1).view.nodes, []);
  assert.equal(empty.at(-1).result, true);

  const singleton = buildValidateBstTrace([Number.MAX_VALUE]);
  assert.equal(singleton.at(-1).result, true);
});

test("validate-bst lesson satisfies deterministic branching ownership and full contract", () => {
  assert.equal(assertLesson(validateBstLesson), validateBstLesson);
  const input = structuredClone(validateBstLesson.input.defaultValue);
  const trace = buildValidatedTrace(validateBstLesson, input);
  assert.equal(assertTrace(trace, validateBstLesson), trace);
  assert.deepEqual(input, validateBstLesson.input.defaultValue);
  assert.equal(trace.at(-1).result, true);
  assert.equal(validateBstLesson.order, 27);
  assert.deepEqual(validateBstLesson.prerequisites, ["trees/inorder-traversal"]);
  assert.deepEqual(validateBstLesson.patterns, ["depth-first-search", "bounds", "binary-search-tree"]);

  for (const property of ["nodes", "edges", "rootIds", "activeNodeIds", "changedNodeIds", "states", "annotations", "pointers"]) {
    assert.equal(new Set(trace.map((step) => step.view[property])).size, trace.length, property);
  }
});

test("validate-bst trace rejects shared nested branching snapshots", () => {
  const trace = buildValidateBstTrace([2, 1, 3]);
  trace[1].view.nodes[0] = trace[0].view.nodes[0];
  assert.throws(() => assertTrace(trace, validateBstLesson), /nodes objects/);
});
