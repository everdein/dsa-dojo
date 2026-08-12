import test from "node:test";
import assert from "node:assert/strict";
import {
  formatUnionFindNodes,
  formatUnionFindProgram,
  maximumUnionFindOperations,
  parseUnionFindNodes,
  parseUnionFindProgram,
  runUnionFindProgram,
  UnionFind,
  validateUnionFindInput
} from "../disjoint-sets/union-find.mjs";
import {
  assertLesson,
  assertTrace,
  buildValidatedTrace
} from "../studio/src/lesson-contract.mjs";
import { buildUnionFindFundamentalsTrace } from "../studio/src/union-find-fundamentals.mjs";
import { unionFindFundamentalsLesson } from "../studio/src/lessons/union-find-fundamentals.mjs";

test("union-find parser accepts and formats its deterministic operation language", () => {
  const nodes = parseUnionFindNodes(" A, B, C ");
  const operations = parseUnionFindProgram("union A B, find B, UNION B C", nodes);
  assert.deepEqual(nodes, ["A", "B", "C"]);
  assert.deepEqual(operations, [
    { type: "union", left: "A", right: "B" },
    { type: "find", node: "B" },
    { type: "union", left: "B", right: "C" }
  ]);
  assert.equal(formatUnionFindNodes(nodes), "A, B, C");
  assert.equal(formatUnionFindProgram(operations, nodes), "union A B, find B, union B C");
});

test("union-find validation rejects unsafe nodes, malformed operations, missing labels, and bounds", () => {
  const nodes = ["A", "B"];
  const sparse = [{ type: "find", node: "A" }, { type: "find", node: "B" }];
  delete sparse[0];
  for (const [candidateNodes, operations] of [
    [[], [{ type: "find", node: "A" }]],
    [["bad label"], [{ type: "find", node: "bad label" }]],
    [["A", "a"], [{ type: "find", node: "A" }]],
    [nodes, []],
    [nodes, sparse],
    [nodes, [{ type: "find", node: "C" }]],
    [nodes, [{ type: "union", left: "A", right: "C" }]],
    [nodes, [{ type: "noop", node: "A" }]],
    [nodes, Array.from({ length: maximumUnionFindOperations + 1 }, () => ({ type: "find", node: "A" }))]
  ]) {
    assert.throws(() => validateUnionFindInput(candidateNodes, operations));
  }
  for (const source of ["", " ", "find", "find A B", "union A", "union A B C", "noop A", "find C", "union A C", "find A,"]) {
    assert.throws(() => parseUnionFindProgram(source, nodes));
  }
});

test("UnionFind resolves equal-size ties in favor of the first root", () => {
  const unionFind = new UnionFind(["A", "B", "C"]);
  assert.equal(unionFind.union("A", "B"), true);
  assert.equal(unionFind.parentOf("B"), "A");
  assert.equal(unionFind.sizeOfRoot("A"), 2);
  assert.equal(unionFind.components, 2);
  assert.equal(unionFind.union("B", "A"), false);
  assert.equal(unionFind.components, 2);
});

test("UnionFind attaches the smaller component even when it is the first operand", () => {
  const unionFind = new UnionFind(["A", "B", "C", "D", "E"]);
  unionFind.union("A", "B");
  unionFind.union("C", "D");
  unionFind.union("C", "E");
  const details = unionFind.unionWithDetails("A", "C");
  assert.equal(details.root, "C");
  assert.equal(details.attachedRoot, "A");
  assert.equal(details.size, 5);
  assert.equal(unionFind.parentOf("A"), "C");
});

test("UnionFind compresses every non-direct node on a find path", () => {
  const unionFind = new UnionFind(["A", "B", "C", "D"]);
  unionFind.union("A", "B");
  unionFind.union("C", "D");
  unionFind.union("A", "C");
  assert.deepEqual(unionFind.inspectFind("D"), {
    node: "D",
    root: "A",
    path: ["D", "C", "A"],
    compressed: ["D"]
  });
  assert.equal(unionFind.find("D"), "A");
  assert.equal(unionFind.parentOf("D"), "A");
  assert.deepEqual(unionFind.inspectFind("D").path, ["D", "A"]);
});

test("runUnionFindProgram returns explicit observations and deterministic final state", () => {
  const nodes = ["A", "B", "C"];
  const operations = [
    { type: "union", left: "A", right: "B" },
    { type: "find", node: "B" },
    { type: "union", left: "B", right: "C" },
    { type: "union", left: "A", right: "C" }
  ];
  const before = structuredClone(operations);
  const result = runUnionFindProgram(nodes, operations);
  assert.deepEqual(operations, before);
  assert.deepEqual(result.final, {
    parent: { A: "A", B: "A", C: "A" },
    size: { A: 3, B: 1, C: 1 },
    components: 1
  });
  assert.deepEqual(result.observations.map(({ type }) => type), ["union", "find", "union", "union"]);
  assert.deepEqual(result.observations[1], {
    operationIndex: 1,
    type: "find",
    node: "B",
    root: "A",
    path: ["B", "A"],
    compressed: []
  });
  assert.equal(result.observations.at(-1).merged, false);
});

test("union-find trace shows find paths, compression, weighted attachment, and completion", () => {
  const input = unionFindFundamentalsLesson.input.defaultValue;
  const trace = buildUnionFindFundamentalsTrace(input);
  for (const phase of ["initialize", "find-path", "compress-path", "union-roots", "already-connected", "complete"]) {
    assert.ok(trace.some((step) => step.phase === phase), phase);
  }
  const compression = trace.find(({ phase }) => phase === "compress-path");
  assert.deepEqual(compression.compressedNodes, ["D"]);
  assert.equal(compression.views.parents.entries.find(({ key }) => key === "D").value, "A");
  const dEdge = compression.views.forest.edges.find(({ fromId }) => fromId === "node-d");
  assert.equal(dEdge.toId, "node-a");
  assert.equal(compression.views.forest.directed, true);
  assert.deepEqual(trace.at(-1).result, runUnionFindProgram(input.nodes, input.operations));
});

test("already-connected unions preserve size and component count in the trace", () => {
  const trace = buildUnionFindFundamentalsTrace({
    nodes: ["A", "B"],
    operations: [
      { type: "union", left: "A", right: "B" },
      { type: "union", left: "B", right: "A" }
    ]
  });
  const unchanged = trace.find(({ phase }) => phase === "already-connected");
  assert.equal(unchanged.components, 1);
  assert.deepEqual(unchanged.size, { A: 2, B: 1 });
});

test("union-find lesson parses fields and satisfies the full deterministic contract", () => {
  assert.equal(assertLesson(unionFindFundamentalsLesson), unionFindFundamentalsLesson);
  const parsed = unionFindFundamentalsLesson.input.parse({
    nodes: "A, B, C",
    operations: "union A B, find B, union B C"
  });
  assert.deepEqual(
    unionFindFundamentalsLesson.input.parse(unionFindFundamentalsLesson.input.serialize(parsed)),
    parsed
  );

  const input = structuredClone(unionFindFundamentalsLesson.input.defaultValue);
  const trace = buildValidatedTrace(unionFindFundamentalsLesson, input);
  assert.equal(assertTrace(trace, unionFindFundamentalsLesson), trace);
  assert.deepEqual(input, unionFindFundamentalsLesson.input.defaultValue);
  assert.equal(unionFindFundamentalsLesson.order, 37);
  assert.deepEqual(unionFindFundamentalsLesson.prerequisites, ["graphs/connected-components"]);
  assert.deepEqual(unionFindFundamentalsLesson.patterns, ["union-find", "path-compression", "union-by-size"]);

  for (const panel of ["forest", "parents"]) {
    assert.equal(new Set(trace.map((step) => step.views[panel])).size, trace.length, panel);
  }
  for (const property of ["nodes", "edges", "activeNodeIds", "activeEdgeIds", "changedNodeIds", "states", "annotations"]) {
    assert.equal(new Set(trace.map((step) => step.views.forest[property])).size, trace.length, property);
  }
  for (const property of ["entries", "activeKeys", "annotations", "resultKeys"]) {
    assert.equal(new Set(trace.map((step) => step.views.parents[property])).size, trace.length, property);
  }
});

test("union-find trace rejects shared mutable forest and lookup snapshots", () => {
  const trace = buildUnionFindFundamentalsTrace({
    nodes: ["A", "B"],
    operations: [{ type: "union", left: "A", right: "B" }]
  });
  trace[1].views.parents.entries = trace[0].views.parents.entries;
  assert.throws(() => assertTrace(trace, unionFindFundamentalsLesson), /entries snapshot/);
});
