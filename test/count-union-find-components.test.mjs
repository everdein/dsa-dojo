import test from "node:test";
import assert from "node:assert/strict";
import {
  countComponentsWithUnionFind,
  countUnionFindComponents
} from "../disjoint-sets/count-components.mjs";
import { connectedComponents } from "../graphs/connected-components.mjs";
import {
  assertLesson,
  assertTrace,
  buildValidatedTrace
} from "../studio/src/lesson-contract.mjs";
import { buildCountUnionFindComponentsTrace } from "../studio/src/count-union-find-components.mjs";
import { countUnionFindComponentsLesson } from "../studio/src/lessons/count-union-find-components.mjs";

test("count-components handles connected, disconnected, isolated, cyclic, and self-loop graphs", () => {
  assert.equal(countComponentsWithUnionFind(["A"], []), 1);
  assert.equal(countComponentsWithUnionFind(["A"], [{ from: "A", to: "A" }]), 1);
  assert.equal(countComponentsWithUnionFind(["A", "B", "C"], []), 3);
  assert.equal(countComponentsWithUnionFind(
    ["A", "B", "C", "D", "E"],
    [{ from: "A", to: "B" }, { from: "B", to: "C" }, { from: "D", to: "E" }]
  ), 2);
  assert.equal(countComponentsWithUnionFind(
    ["A", "B", "C"],
    [{ from: "A", to: "B" }, { from: "B", to: "C" }, { from: "C", to: "A" }]
  ), 1);
  assert.equal(countUnionFindComponents(["A", "B"], [{ from: "A", to: "B" }]), 1);
});

test("count-components delegates graph validation and preserves input", () => {
  const nodes = ["A", "B", "C"];
  const edges = [{ from: "A", to: "B" }];
  const before = structuredClone({ nodes, edges });
  assert.equal(countComponentsWithUnionFind(nodes, edges), 2);
  assert.deepEqual({ nodes, edges }, before);

  assert.throws(() => countComponentsWithUnionFind([], []));
  assert.throws(() => countComponentsWithUnionFind(["A", "a"], []));
  assert.throws(() => countComponentsWithUnionFind(["A"], [{ from: "A", to: "B" }]));
  assert.throws(() => countComponentsWithUnionFind(["A", "B"], [
    { from: "A", to: "B" },
    { from: "B", to: "A" }
  ]));
});

test("Union-Find component count agrees with the independent BFS lesson", () => {
  const cases = [
    { nodes: ["A"], edges: [] },
    { nodes: ["A", "B", "C"], edges: [{ from: "A", to: "B" }] },
    { nodes: ["A", "B", "C"], edges: [{ from: "A", to: "B" }, { from: "B", to: "C" }] },
    { nodes: ["A", "B", "C", "D"], edges: [{ from: "A", to: "B" }, { from: "C", to: "D" }] },
    { nodes: ["A", "B", "C"], edges: [{ from: "A", to: "A" }, { from: "A", to: "B" }] }
  ];
  for (const { nodes, edges } of cases) {
    assert.equal(countComponentsWithUnionFind(nodes, edges), connectedComponents(nodes, edges).length);
  }
});

test("count-components trace separates successful and redundant unions", () => {
  const trace = buildCountUnionFindComponentsTrace({
    nodes: ["A", "B", "C", "D"],
    edges: [
      { from: "A", to: "B" },
      { from: "B", to: "C" },
      { from: "A", to: "C" }
    ]
  });
  const successes = trace.filter(({ phase }) => phase === "union-success");
  const redundant = trace.filter(({ phase }) => phase === "redundant-edge");
  assert.equal(successes.length, 2);
  assert.equal(redundant.length, 1);
  assert.deepEqual(successes.map(({ countBefore, countAfter }) => [countBefore, countAfter]), [[4, 3], [3, 2]]);
  assert.equal(redundant[0].countBefore, redundant[0].countAfter);
  assert.equal(trace.at(-1).result, 2);
});

test("count-components trace preserves the edge stream and synchronized parent forest", () => {
  const trace = buildCountUnionFindComponentsTrace({
    nodes: ["A", "B", "C"],
    edges: [{ from: "A", to: "B" }, { from: "B", to: "C" }]
  });
  const firstUnion = trace.find(({ phase, edgeIndex }) => phase === "union-success" && edgeIndex === 0);
  assert.equal(firstUnion.views["edge-stream"].directed, false);
  assert.equal(firstUnion.views["edge-stream"].activeEdgeIds.length, 1);
  assert.equal(firstUnion.views.forest.directed, true);
  assert.equal(firstUnion.views.forest.edges[0].fromId, "node-b");
  assert.equal(firstUnion.views.forest.edges[0].toId, "node-a");
  assert.equal(firstUnion.views.parents.entries.find(({ key }) => key === "B").value, "A");
});

test("count-components trace handles no edges and self-loop redundancy", () => {
  const isolated = buildCountUnionFindComponentsTrace({ nodes: ["A", "B"], edges: [] });
  assert.deepEqual(isolated.map(({ phase }) => phase), ["initialize", "complete"]);
  assert.equal(isolated.at(-1).result, 2);

  const selfLoop = buildCountUnionFindComponentsTrace({
    nodes: ["A"],
    edges: [{ from: "A", to: "A" }]
  });
  assert.equal(selfLoop.filter(({ phase }) => phase === "redundant-edge").length, 1);
  assert.equal(selfLoop.at(-1).result, 1);
});

test("count-components lesson uses exact L39 metadata and shared graph parsing", () => {
  assert.equal(assertLesson(countUnionFindComponentsLesson), countUnionFindComponentsLesson);
  assert.equal(countUnionFindComponentsLesson.id, "disjoint-sets/count-components");
  assert.equal(countUnionFindComponentsLesson.order, 39);
  assert.deepEqual(countUnionFindComponentsLesson.prerequisites, [
    "graphs/connected-components",
    "disjoint-sets/connectivity-queries"
  ]);
  assert.deepEqual(countUnionFindComponentsLesson.patterns, [
    "union-find",
    "connected-components",
    "edge-stream"
  ]);
  const parsed = countUnionFindComponentsLesson.input.parse({
    nodes: "A, B, C",
    edges: "A:B, B:C"
  });
  assert.deepEqual(
    countUnionFindComponentsLesson.input.parse(countUnionFindComponentsLesson.input.serialize(parsed)),
    parsed
  );
});

test("count-components lesson satisfies deterministic composite ownership", () => {
  const input = structuredClone(countUnionFindComponentsLesson.input.defaultValue);
  const trace = buildValidatedTrace(countUnionFindComponentsLesson, input);
  assert.equal(assertTrace(trace, countUnionFindComponentsLesson), trace);
  assert.deepEqual(input, countUnionFindComponentsLesson.input.defaultValue);
  assert.equal(trace.at(-1).result, 2);

  for (const panel of ["edge-stream", "forest", "parents"]) {
    assert.equal(new Set(trace.map((step) => step.views[panel])).size, trace.length, panel);
  }
  for (const panel of ["edge-stream", "forest"]) {
    for (const property of ["nodes", "edges", "activeNodeIds", "activeEdgeIds", "changedNodeIds", "states", "annotations"]) {
      assert.equal(new Set(trace.map((step) => step.views[panel][property])).size, trace.length, `${panel}.${property}`);
    }
  }
  for (const property of ["entries", "activeKeys", "annotations", "resultKeys"]) {
    assert.equal(new Set(trace.map((step) => step.views.parents[property])).size, trace.length, property);
  }
});

test("count-components trace rejects shared mutable snapshots", () => {
  const trace = buildCountUnionFindComponentsTrace({
    nodes: ["A", "B"],
    edges: [{ from: "A", to: "B" }]
  });
  trace[1].views.forest.edges = trace[0].views.forest.edges;
  assert.throws(() => assertTrace(trace, countUnionFindComponentsLesson), /edges snapshot/);
});
