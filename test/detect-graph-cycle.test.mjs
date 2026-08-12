import test from "node:test";
import assert from "node:assert/strict";
import {
  detectGraphCycle,
  hasUndirectedCycle
} from "../graphs/detect-cycle.mjs";
import {
  parseGraphText,
  validateGraphInput
} from "../graphs/model.mjs";
import { buildDetectGraphCycleTrace } from "../studio/src/detect-graph-cycle.mjs";
import { detectGraphCycleLesson } from "../studio/src/lessons/detect-graph-cycle.mjs";
import {
  assertLesson,
  buildValidatedTrace
} from "../studio/src/lesson-contract.mjs";

test("detectGraphCycle distinguishes trees, triangles, disconnected cycles, and isolated nodes", () => {
  assert.equal(detectGraphCycle(
    ["A", "B", "C", "D"],
    [
      { from: "A", to: "B" },
      { from: "B", to: "C" },
      { from: "B", to: "D" }
    ]
  ), false);
  assert.equal(detectGraphCycle(
    ["A", "B", "C"],
    [
      { from: "A", to: "B" },
      { from: "B", to: "C" },
      { from: "C", to: "A" }
    ]
  ), true);
  assert.equal(detectGraphCycle(
    ["A", "B", "C", "D", "E"],
    [
      { from: "A", to: "B" },
      { from: "C", to: "D" },
      { from: "D", to: "E" },
      { from: "E", to: "C" }
    ]
  ), true);
  assert.equal(detectGraphCycle(["A", "B", "C"], []), false);
  assert.equal(hasUndirectedCycle(["Only"], []), false);
});

test("a self-loop is an immediate undirected cycle", () => {
  assert.equal(detectGraphCycle(["A"], [{ from: "A", to: "A" }]), true);
  assert.equal(hasUndirectedCycle(["A"], [{ from: "A", to: "A" }]), true);
});

test("cycle detection delegates malformed and duplicate-edge rejection to the graph model", () => {
  const duplicateReverseEdges = [
    { from: "A", to: "B" },
    { from: "B", to: "A" }
  ];
  assert.throws(() => validateGraphInput(["A", "B"], duplicateReverseEdges), /unique/);
  assert.throws(() => detectGraphCycle(["A", "B"], duplicateReverseEdges), /unique/);
  assert.throws(() => parseGraphText("A, B", "A:B, B:A"), /unique/);

  for (const [nodes, edges] of [
    [[], []],
    [["A", "a"], []],
    [["bad label"], []],
    [["A"], [{ from: "A", to: "B" }]],
    [undefined, []],
    [["A"], undefined]
  ]) {
    assert.throws(() => detectGraphCycle(nodes, edges));
  }
});

test("cycle solver does not mutate graph input", () => {
  const nodes = ["A", "B", "C", "D"];
  const edges = [
    { from: "A", to: "B" },
    { from: "B", to: "C" },
    { from: "C", to: "A" }
  ];
  const originalNodes = [...nodes];
  const originalEdges = edges.map((edge) => ({ ...edge }));
  assert.equal(detectGraphCycle(nodes, edges), true);
  assert.deepEqual(nodes, originalNodes);
  assert.deepEqual(edges, originalEdges);
});

test("Detect Graph Cycle lesson declares composite views, metadata, and shared parsing", () => {
  assert.equal(assertLesson(detectGraphCycleLesson), detectGraphCycleLesson);
  assert.equal(detectGraphCycleLesson.id, "graphs/detect-cycle");
  assert.equal(detectGraphCycleLesson.order, 36);
  assert.deepEqual(detectGraphCycleLesson.prerequisites, [
    "trees/inorder-traversal",
    "graphs/connected-components"
  ]);
  assert.deepEqual(detectGraphCycleLesson.patterns, [
    "depth-first-search",
    "cycle-detection",
    "parent-tracking"
  ]);
  assert.equal(Object.hasOwn(detectGraphCycleLesson, "renderer"), false);
  assert.deepEqual(detectGraphCycleLesson.views, [
    { id: "graph", renderer: "graph", heading: "Undirected graph" },
    { id: "stack", renderer: "stack", heading: "DFS frames" }
  ]);

  const parsed = detectGraphCycleLesson.input.parse({
    nodes: "A, B, C",
    edges: "A:B, B:C"
  });
  assert.deepEqual(parsed, {
    nodes: ["A", "B", "C"],
    edges: [{ from: "A", to: "B" }, { from: "B", to: "C" }]
  });
  assert.deepEqual(detectGraphCycleLesson.input.serialize(parsed), {
    nodes: "A, B, C",
    edges: "A:B, B:C"
  });
});

test("acyclic trace skips only parent edges, pops frames, and scans every component", () => {
  const input = {
    nodes: ["A", "B", "C", "D"],
    edges: [{ from: "A", to: "B" }, { from: "B", to: "C" }]
  };
  const trace = buildValidatedTrace(detectGraphCycleLesson, input);
  assert.equal(trace.at(-1).result, false);
  assert.equal(trace.filter(({ phase }) => phase === "start-component").length, 2);
  assert.equal(trace.filter(({ phase }) => phase === "skip-parent-edge").length, 2);
  assert.equal(trace.filter(({ phase }) => phase === "pop").length, 4);
  assert.equal(trace.some(({ phase }) => phase === "detect-cycle"), false);
  assert.equal(trace.at(-1).visitedCount, 4);
  assert.equal(trace.at(-1).finishedCount, 4);
  assert.equal(trace.at(-1).stackDepth, 0);
  assert.deepEqual(
    trace.at(-1).views.graph.states.map(({ nodeId, kind }) => ({ nodeId, kind })),
    [
      { nodeId: "node-a", kind: "finished" },
      { nodeId: "node-b", kind: "finished" },
      { nodeId: "node-c", kind: "finished" },
      { nodeId: "node-d", kind: "finished" }
    ]
  );
});

test("triangle trace preserves frame parents and marks the non-parent witness edge", () => {
  const input = {
    nodes: ["A", "B", "C"],
    edges: [
      { from: "A", to: "B" },
      { from: "B", to: "C" },
      { from: "C", to: "A" }
    ]
  };
  const trace = buildValidatedTrace(detectGraphCycleLesson, input);
  const detected = trace.find(({ phase }) => phase === "detect-cycle");

  assert.equal(trace.at(-1).result, true);
  assert.ok(trace.some(({ phase }) => phase === "skip-parent-edge"));
  assert.deepEqual(detected.cycleNodeLabels, ["C", "A"]);
  assert.equal(detected.cycleEdgeIndex, 2);
  assert.deepEqual(detected.views.graph.activeEdgeIds, ["edge-2"]);
  assert.deepEqual(detected.views.stack.items.map(({ id }) => id), [
    "node-a",
    "node-b",
    "node-c"
  ]);
  assert.deepEqual(detected.stackFrames.map(({ node, parent }) => ({ node, parent })), [
    { node: "A", parent: null },
    { node: "B", parent: "A" },
    { node: "C", parent: "B" }
  ]);
  assert.deepEqual(
    trace.at(-1).views.graph.states.filter(({ kind }) => kind === "cycle").map(({ nodeId }) => nodeId),
    ["node-a", "node-c"]
  );
  assert.deepEqual(trace.at(-1).views.graph.activeEdgeIds, ["edge-2"]);
});

test("disconnected and self-loop traces expose their exact cycle witness", () => {
  const disconnected = buildDetectGraphCycleTrace({
    nodes: ["A", "B", "C", "D", "E"],
    edges: [
      { from: "A", to: "B" },
      { from: "C", to: "D" },
      { from: "D", to: "E" },
      { from: "E", to: "C" }
    ]
  });
  assert.equal(disconnected.at(-1).result, true);
  assert.equal(disconnected.at(-1).componentCount, 2);
  assert.equal(disconnected.find(({ phase }) => phase === "detect-cycle").cycleEdgeIndex, 3);

  const selfLoop = buildValidatedTrace(detectGraphCycleLesson, {
    nodes: ["A"],
    edges: [{ from: "A", to: "A" }]
  });
  const detected = selfLoop.find(({ phase }) => phase === "detect-cycle");
  assert.deepEqual(detected.cycleNodeLabels, ["A"]);
  assert.equal(detected.cycleEdgeIndex, 0);
  assert.deepEqual(detected.views.graph.activeNodeIds, ["node-a"]);
  assert.deepEqual(detected.views.graph.activeEdgeIds, ["edge-0"]);
  assert.match(detected.narration, /self-loop/);
  assert.equal(selfLoop.at(-1).result, true);
});

test("Detect Graph Cycle trace is deterministic, immutable, and deeply owns all snapshots", () => {
  const input = {
    nodes: ["A", "B", "C", "D", "E"],
    edges: [
      { from: "A", to: "B" },
      { from: "B", to: "C" },
      { from: "C", to: "A" },
      { from: "D", to: "E" }
    ]
  };
  const original = structuredClone(input);
  const first = buildDetectGraphCycleTrace(input);
  const second = buildDetectGraphCycleTrace(structuredClone(input));

  assert.deepEqual(first, second);
  assert.deepEqual(input, original);
  assert.equal(first.at(-1).result, detectGraphCycle(input.nodes, input.edges));
  first.forEach((step, index) => {
    assert.equal(step.step, index);
    assert.ok(step.codeSteps.length > 0);
    assert.equal(typeof step.narration, "string");
    assert.equal(typeof step.prompt, "string");
  });

  for (const [panelId, properties, objectProperties] of [
    ["graph", ["nodes", "edges", "activeNodeIds", "activeEdgeIds", "changedNodeIds", "states", "annotations"], ["nodes", "edges", "states", "annotations"]],
    ["stack", ["items", "activeItemIds", "changedItemIds", "annotations"], ["items", "annotations"]]
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
  for (const property of ["stackFrames", "cycleNodeLabels"]) {
    assert.equal(new Set(first.map((step) => step[property])).size, first.length, property);
  }
  const frameObjects = first.flatMap((step) => step.stackFrames);
  assert.equal(new Set(frameObjects).size, frameObjects.length, "stack frame objects");
});
