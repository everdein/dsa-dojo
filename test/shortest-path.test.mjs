import test from "node:test";
import assert from "node:assert/strict";
import {
  resultFromParents,
  unweightedShortestPath,
  validateShortestPathInput
} from "../graphs/shortest-path.mjs";
import { buildAdjacency, graphEdgeId, graphNodeId } from "../graphs/model.mjs";
import { buildShortestPathTrace } from "../studio/src/shortest-path.mjs";
import {
  assertLesson,
  assertTrace,
  buildValidatedTrace
} from "../studio/src/lesson-contract.mjs";
import { shortestPathLesson } from "../studio/src/lessons/shortest-path.mjs";

const defaultGraph = {
  nodes: ["A", "B", "C", "D", "E"],
  edges: [
    { from: "A", to: "B" },
    { from: "A", to: "C" },
    { from: "B", to: "D" },
    { from: "C", to: "E" },
    { from: "E", to: "D" }
  ]
};

test("unweightedShortestPath finds a shortest route without mutating graph input", () => {
  const input = { ...defaultGraph, start: "A", target: "D" };
  const before = structuredClone(input);
  assert.deepEqual(
    unweightedShortestPath(input.nodes, input.edges, input.start, input.target),
    { distance: 2, path: ["A", "B", "D"] }
  );
  assert.deepEqual(input, before);
});

test("multiple shortest routes resolve by declared adjacency edge order", () => {
  const nodes = ["A", "B", "C", "D"];
  const firstEdges = [
    { from: "A", to: "C" },
    { from: "A", to: "B" },
    { from: "B", to: "D" },
    { from: "C", to: "D" }
  ];
  const secondEdges = [
    { from: "A", to: "B" },
    { from: "A", to: "C" },
    { from: "B", to: "D" },
    { from: "C", to: "D" }
  ];
  assert.deepEqual(unweightedShortestPath(nodes, firstEdges, "A", "D"), {
    distance: 2,
    path: ["A", "C", "D"]
  });
  assert.deepEqual(unweightedShortestPath(nodes, secondEdges, "A", "D"), {
    distance: 2,
    path: ["A", "B", "D"]
  });
});

test("shortest path handles disconnected, self, cycles, and self-loop graphs", () => {
  assert.equal(
    unweightedShortestPath(["A", "B", "C"], [{ from: "A", to: "B" }], "A", "C"),
    null
  );
  assert.deepEqual(unweightedShortestPath(["A"], [], "A", "A"), {
    distance: 0,
    path: ["A"]
  });
  assert.deepEqual(unweightedShortestPath(
    ["A", "B", "C", "D"],
    [
      { from: "A", to: "B" },
      { from: "B", to: "C" },
      { from: "C", to: "A" },
      { from: "C", to: "D" }
    ],
    "A",
    "D"
  ), { distance: 2, path: ["A", "C", "D"] });
  assert.deepEqual(
    unweightedShortestPath(["A", "B"], [{ from: "A", to: "A" }, { from: "A", to: "B" }], "A", "B"),
    { distance: 1, path: ["A", "B"] }
  );
});

test("shortest path rejects malformed graphs and undeclared endpoints", () => {
  assert.throws(() => validateShortestPathInput([], [], "A", "B"), /Graph input/);
  assert.throws(
    () => validateShortestPathInput(["A"], [{ from: "A", to: "B" }], "A", "A"),
    /declared nodes/
  );
  for (const [start, target, pattern] of [
    ["missing", "A", /start/],
    ["A", "missing", /target/],
    [null, "A", /start/],
    ["A", null, /target/]
  ]) {
    assert.throws(() => validateShortestPathInput(["A"], [], start, target), pattern);
    assert.throws(() => unweightedShortestPath(["A"], [], start, target), pattern);
  }
  assert.throws(() => resultFromParents(new Map(), "A"), /parent entry/);
});

test("solver agrees with an independent BFS distance oracle on exhaustive small graphs", () => {
  const nodes = ["A", "B", "C", "D"];
  const possibleEdges = [];
  for (let left = 0; left < nodes.length; left += 1) {
    for (let right = left + 1; right < nodes.length; right += 1) {
      possibleEdges.push({ from: nodes[left], to: nodes[right] });
    }
  }

  for (let mask = 0; mask < 2 ** possibleEdges.length; mask += 1) {
    const edges = possibleEdges.filter((_, index) => (mask & (1 << index)) !== 0);
    for (const start of nodes) {
      for (const target of nodes) {
        const result = unweightedShortestPath(nodes, edges, start, target);
        const distance = oracleDistance(nodes, edges, start, target);
        assert.equal(result?.distance ?? null, distance, JSON.stringify({ edges, start, target }));
        if (result !== null) {
          assert.equal(result.path[0], start);
          assert.equal(result.path.at(-1), target);
          assert.equal(result.path.length - 1, distance);
          for (let index = 1; index < result.path.length; index += 1) {
            assert.equal(hasUndirectedEdge(edges, result.path[index - 1], result.path[index]), true);
          }
        }
      }
    }
  }
});

test("Shortest Path lesson declares graph and queue panels with exact metadata", () => {
  assert.equal(assertLesson(shortestPathLesson), shortestPathLesson);
  assert.equal(shortestPathLesson.id, "graphs/unweighted-shortest-path");
  assert.equal(shortestPathLesson.order, 35);
  assert.deepEqual(shortestPathLesson.prerequisites, ["graphs/connected-components"]);
  assert.deepEqual(shortestPathLesson.patterns, [
    "breadth-first-search",
    "shortest-path",
    "parent-map"
  ]);
  assert.deepEqual(shortestPathLesson.views, [
    { id: "graph", renderer: "graph", heading: "Undirected graph" },
    { id: "queue", renderer: "queue", heading: "BFS frontier" }
  ]);
  assert.deepEqual(shortestPathLesson.input.parse({
    nodes: "A, B, C",
    edges: "A:B, B:C",
    start: " A ",
    target: " C "
  }), {
    nodes: ["A", "B", "C"],
    edges: [{ from: "A", to: "B" }, { from: "B", to: "C" }],
    start: "A",
    target: "C"
  });
  assert.deepEqual(shortestPathLesson.input.serialize({
    nodes: ["A", "B"],
    edges: [{ from: "A", to: "B" }],
    start: "A",
    target: "B"
  }), { nodes: "A, B", edges: "A:B", start: "A", target: "B" });
  assert.throws(() => shortestPathLesson.input.parse({
    nodes: "A, B",
    edges: "A:B",
    start: "A",
    target: "C"
  }), /target/);
});

test("trace records first parents, stops on target discovery, and reconstructs the result", () => {
  const input = { ...defaultGraph, start: "A", target: "D" };
  const trace = buildShortestPathTrace(input);
  const targetStep = trace.find(({ phase }) => phase === "discover-target");
  assert.ok(targetStep);
  assert.equal(targetStep.currentNode, "D");
  assert.deepEqual(targetStep.parents, [
    { node: "A", parent: null },
    { node: "B", parent: "A" },
    { node: "C", parent: "A" },
    { node: "D", parent: "B" }
  ]);
  assert.equal(trace.some(({ phase, currentNode }) => phase === "dequeue" && currentNode === "D"), false);

  const reconstruction = trace.filter(({ phase }) => phase === "reconstruct");
  assert.deepEqual(reconstruction.map(({ reconstructionNode }) => reconstructionNode), ["D", "B", "A"]);
  assert.deepEqual(reconstruction.at(-1).resultPath, ["A", "B", "D"]);
  assert.deepEqual(trace.at(-1).result, { distance: 2, path: ["A", "B", "D"] });
  assert.deepEqual(
    new Set(trace.at(-1).views.graph.activeEdgeIds),
    new Set([graphEdgeId("A", "B", 0), graphEdgeId("B", "D", 2)])
  );
  assert.ok(["A", "B", "D"].every((node) => trace.at(-1).views.graph.states.some((state) => (
    state.nodeId === graphNodeId(node) && state.kind === "shortest-path"
  ))));
});

test("unreachable and self traces terminate with coherent results", () => {
  const unreachable = buildValidatedTrace(shortestPathLesson, {
    nodes: ["A", "B", "C"],
    edges: [{ from: "A", to: "B" }],
    start: "A",
    target: "C"
  });
  assert.equal(unreachable.at(-1).result, null);
  assert.equal(unreachable.some(({ phase }) => phase === "discover-target"), false);
  assert.equal(unreachable.some(({ phase }) => phase === "reconstruct"), false);
  assert.deepEqual(unreachable.at(-1).queueNodes, []);

  const self = buildValidatedTrace(shortestPathLesson, {
    nodes: ["A"],
    edges: [],
    start: "A",
    target: "A"
  });
  assert.deepEqual(self.map(({ phase }) => phase), ["initialize", "complete"]);
  assert.deepEqual(self.at(-1).result, { distance: 0, path: ["A"] });
  assert.deepEqual(self.at(-1).resultPath, ["A"]);
});

test("Shortest Path trace is deterministic, solver-aligned, and input-immutable", () => {
  const input = { ...defaultGraph, start: "A", target: "D" };
  const before = structuredClone(input);
  const trace = buildValidatedTrace(shortestPathLesson, input);
  assert.equal(assertTrace(trace, shortestPathLesson), trace);
  assert.deepEqual(
    trace.at(-1).result,
    unweightedShortestPath(input.nodes, input.edges, input.start, input.target)
  );
  assert.deepEqual(input, before);
  assert.deepEqual(buildShortestPathTrace(input), buildShortestPathTrace(structuredClone(input)));
});

test("Shortest Path trace deeply owns both renderer panels and parent/path history", () => {
  const input = { ...defaultGraph, start: "A", target: "D" };
  const trace = buildShortestPathTrace(input);
  for (const panelId of ["graph", "queue"]) {
    assert.equal(new Set(trace.map((step) => step.views[panelId])).size, trace.length);
  }
  for (const property of [
    "nodes",
    "edges",
    "activeNodeIds",
    "activeEdgeIds",
    "changedNodeIds",
    "states",
    "annotations"
  ]) {
    assert.equal(new Set(trace.map((step) => step.views.graph[property])).size, trace.length);
  }
  for (const property of ["items", "activeItemIds", "changedItemIds", "annotations"]) {
    assert.equal(new Set(trace.map((step) => step.views.queue[property])).size, trace.length);
  }
  for (const property of ["queueNodes", "parents", "resultPath", "resultEdgeIndices"]) {
    assert.equal(new Set(trace.map((step) => step[property])).size, trace.length);
  }
  for (const [panelId, properties] of [
    ["graph", ["nodes", "edges", "states", "annotations"]],
    ["queue", ["items", "annotations"]]
  ]) {
    for (const property of properties) {
      const objects = trace.flatMap((step) => step.views[panelId][property]);
      assert.equal(new Set(objects).size, objects.length, `${panelId}.${property}`);
    }
  }
  const parents = trace.flatMap((step) => step.parents);
  assert.equal(new Set(parents).size, parents.length);

  trace[1].views.graph.nodes = trace[0].views.graph.nodes;
  assert.throws(
    () => assertTrace(trace, shortestPathLesson),
    /View panel graph:.*nodes snapshot/i
  );

  const nestedTrace = buildShortestPathTrace(input);
  const repeatedFront = nestedTrace.find((step, index) => (
    index > 0
    && step.views.queue.items.length > 0
    && step.views.queue.items[0].id === nestedTrace[index - 1].views.queue.items[0]?.id
  ));
  const repeatedIndex = nestedTrace.indexOf(repeatedFront);
  repeatedFront.views.queue.items[0] = nestedTrace[repeatedIndex - 1].views.queue.items[0];
  assert.throws(
    () => assertTrace(nestedTrace, shortestPathLesson),
    /View panel queue:.*items objects/i
  );
});

function oracleDistance(nodes, edges, start, target) {
  if (start === target) return 0;
  const adjacency = buildAdjacency(nodes, edges);
  const queue = [{ node: start, distance: 0 }];
  const visited = new Set([start]);
  for (let head = 0; head < queue.length; head += 1) {
    const current = queue[head];
    for (const neighbor of adjacency.get(current.node)) {
      if (visited.has(neighbor.node)) continue;
      if (neighbor.node === target) return current.distance + 1;
      visited.add(neighbor.node);
      queue.push({ node: neighbor.node, distance: current.distance + 1 });
    }
  }
  return null;
}

function hasUndirectedEdge(edges, left, right) {
  return edges.some((edge) => (
    edge.from === left && edge.to === right
    || edge.from === right && edge.to === left
  ));
}
