import test from "node:test";
import assert from "node:assert/strict";
import {
  assertGraphSnapshotOwnership,
  assertGraphView,
  graphRendererAdapter,
  maximumGraphEdges,
  maximumGraphNodes,
  projectGraphView
} from "../studio/src/graph-renderer.mjs";

test("graph renderer validates and projects positioned accessible models", () => {
  const view = createView();
  assert.equal(assertGraphView(view, 0), view);
  const model = projectGraphView(view);
  assert.equal(model.nodes.length, 3);
  assert.equal(model.edges[0].from.value, "A");
  assert.equal(model.edges[0].active, true);
  assert.ok(model.nodes.every(({ x, y }) => Number.isFinite(x) && Number.isFinite(y)));
  assert.match(model.ariaLabel, /3 nodes and 2 edges, undirected/);
  assert.equal(graphRendererAdapter.projectView, projectGraphView);
});

test("graph renderer rejects invalid nodes, edges, references, metadata, and bounds", () => {
  const tooManyNodes = Array.from({ length: maximumGraphNodes + 1 }, (_, index) => ({ id: `node-${index}`, value: index }));
  const tooManyEdges = Array.from({ length: maximumGraphEdges + 1 }, (_, index) => ({ id: `edge-${index}`, fromId: "node-a", toId: "node-b" }));
  for (const view of [
    { ...createView(), structure: "tree" },
    { ...createView(), nodes: [{ id: "bad id", value: 1 }], edges: [], activeNodeIds: [], activeEdgeIds: [], changedNodeIds: [], states: [], annotations: [] },
    { ...createView(), edges: [{ id: "edge-0", fromId: "node-a", toId: "missing" }] },
    { ...createView(), activeNodeIds: ["missing"] },
    { ...createView(), activeEdgeIds: ["missing"] },
    { ...createView(), states: [{ nodeId: "node-a", kind: "bad kind", label: "bad" }] },
    { ...createView(), annotations: [{ nodeId: "node-a", label: "" }] },
    { ...createView(), nodes: tooManyNodes, edges: [], activeNodeIds: [], activeEdgeIds: [], changedNodeIds: [], states: [], annotations: [] },
    { ...createView(), edges: tooManyEdges, activeEdgeIds: [] }
  ]) {
    assert.throws(() => assertGraphView(view, 1));
  }
});

test("graph renderer permits directed and self edges", () => {
  const view = {
    structure: "graph",
    directed: true,
    nodes: [{ id: "node-a", value: 1 }],
    edges: [{ id: "edge-loop", fromId: "node-a", toId: "node-a", label: "loop" }],
    activeNodeIds: [],
    activeEdgeIds: ["edge-loop"],
    changedNodeIds: [],
    states: [],
    annotations: []
  };
  assert.equal(assertGraphView(view, 2), view);
  assert.match(projectGraphView(view).edges[0].description, /Directed edge/);
});

test("graph renderer enforces fresh rewind snapshots", () => {
  const trace = [{ view: createView() }, { view: createView() }];
  assert.equal(assertGraphSnapshotOwnership(trace), trace);
  for (const property of ["nodes", "edges", "activeNodeIds", "activeEdgeIds", "changedNodeIds", "states", "annotations"]) {
    const shared = structuredClone(trace);
    shared[1].view[property] = shared[0].view[property];
    assert.throws(() => assertGraphSnapshotOwnership(shared), new RegExp(`${property} snapshot`));
  }
  const sharedEdge = structuredClone(trace);
  sharedEdge[1].view.edges[0] = sharedEdge[0].view.edges[0];
  assert.throws(() => assertGraphSnapshotOwnership(sharedEdge), /edges objects/);
});

function createView() {
  return {
    structure: "graph",
    directed: false,
    nodes: [
      { id: "node-a", value: "A" },
      { id: "node-b", value: "B" },
      { id: "node-c", value: "C" }
    ],
    edges: [
      { id: "edge-ab", fromId: "node-a", toId: "node-b" },
      { id: "edge-bc", fromId: "node-b", toId: "node-c" }
    ],
    activeNodeIds: ["node-b"],
    activeEdgeIds: ["edge-ab"],
    changedNodeIds: [],
    states: [{ nodeId: "node-a", kind: "visited", label: "visited" }],
    annotations: [{ nodeId: "node-b", label: "frontier" }]
  };
}
