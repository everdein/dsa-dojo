import test from "node:test";
import assert from "node:assert/strict";
import {
  buildAdjacency,
  formatGraphInput,
  graphNodeId,
  graphRendererSnapshot,
  maximumGraphModelEdges,
  maximumGraphModelNodes,
  parseGraphText,
  validateGraphInput
} from "../graphs/model.mjs";

test("graph model parses, formats, and builds stable adjacency", () => {
  const input = parseGraphText("A, B, C", "A:B, B:C");
  assert.deepEqual(input, {
    nodes: ["A", "B", "C"],
    edges: [{ from: "A", to: "B" }, { from: "B", to: "C" }]
  });
  assert.deepEqual(formatGraphInput(input.nodes, input.edges), { nodes: "A, B, C", edges: "A:B, B:C" });
  const adjacency = buildAdjacency(input.nodes, input.edges);
  assert.deepEqual(adjacency.get("B"), [{ node: "A", edgeIndex: 0 }, { node: "C", edgeIndex: 1 }]);
  assert.equal(graphNodeId("A-1"), "node-a-1");
});

test("graph text uses an unambiguous colon separator and round-trips hyphenated labels", () => {
  const input = parseGraphText(
    "north-hub, east-2, south-hub",
    "north-hub:east-2, east-2:south-hub"
  );
  const formatted = formatGraphInput(input.nodes, input.edges);

  assert.deepEqual(formatted, {
    nodes: "north-hub, east-2, south-hub",
    edges: "north-hub:east-2, east-2:south-hub"
  });
  assert.deepEqual(parseGraphText(formatted.nodes, formatted.edges), input);

  for (const rawEdges of ["A-B", "A-B-C", "A::B", ":", "A:"]) {
    assert.throws(() => parseGraphText("A, B, A-B, C", rawEdges), /Use A:B/);
  }
});

test("graph model validates labels, endpoints, duplicates, and bounds", () => {
  for (const [nodes, edges] of [
    [undefined, []],
    [[], []],
    [["A", "A"], []],
    [["A", "a"], []],
    [["bad label"], []],
    [["A"], [{ from: "A", to: "B" }]],
    [["A", "B"], [{ from: "A", to: "B" }, { from: "B", to: "A" }]],
    [Array.from({ length: maximumGraphModelNodes + 1 }, (_, index) => `N${index}`), []],
    [["A"], Array.from({ length: maximumGraphModelEdges + 1 }, () => ({ from: "A", to: "A" }))]
  ]) {
    assert.throws(() => validateGraphInput(nodes, edges));
  }
});

test("graph model supports isolated nodes, self-loops, and directed reverse edges", () => {
  assert.doesNotThrow(() => validateGraphInput(["A"], []));
  assert.doesNotThrow(() => validateGraphInput(["A"], [{ from: "A", to: "A" }]));
  assert.doesNotThrow(() => validateGraphInput(
    ["A", "B"],
    [{ from: "A", to: "B" }, { from: "B", to: "A" }],
    { directed: true }
  ));

  const directed = parseGraphText("A, B", "A:B, B:A", { directed: true });
  const formatted = formatGraphInput(directed.nodes, directed.edges, { directed: true });
  assert.deepEqual(formatted, { nodes: "A, B", edges: "A:B, B:A" });
  assert.deepEqual(parseGraphText(formatted.nodes, formatted.edges, { directed: true }), directed);
});

test("graph edge identity keeps endpoint tuples distinct without weakening duplicate checks", () => {
  const collisionProneNodes = ["A", "B--C", "A--B", "C"];
  const distinctEdges = [
    { from: "A", to: "B--C" },
    { from: "A--B", to: "C" }
  ];

  assert.doesNotThrow(() => validateGraphInput(collisionProneNodes, distinctEdges));
  assert.deepEqual(
    parseGraphText("A, B--C, A--B, C", "A:B--C, A--B:C").edges,
    distinctEdges
  );
  assert.throws(() => validateGraphInput(
    ["A-B", "C-D"],
    [{ from: "A-B", to: "C-D" }, { from: "C-D", to: "A-B" }]
  ), /unique/);
});

test("graph renderer snapshot maps semantic labels into safe stable ids", () => {
  const view = graphRendererSnapshot(
    ["A", "B"],
    [{ from: "A", to: "B" }],
    {
      activeNodes: ["B"],
      activeEdges: [0],
      states: [{ node: "A", kind: "visited", label: "visited" }],
      annotations: [{ node: "B", label: "frontier" }]
    }
  );
  assert.deepEqual(view.activeNodeIds, ["node-b"]);
  assert.deepEqual(view.activeEdgeIds, ["edge-0"]);
  assert.deepEqual(view.states, [{ nodeId: "node-a", kind: "visited", label: "visited" }]);
});
