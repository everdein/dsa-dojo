import test from "node:test";
import assert from "node:assert/strict";
import {
  assertBranchingSnapshotOwnership,
  assertBranchingView,
  branchingRendererAdapter,
  maximumBranchingNodes,
  projectBranchingView
} from "../studio/src/branching-renderer.mjs";

test("branching renderer validates and projects ordered levels and edges", () => {
  const view = createView();
  assert.equal(assertBranchingView(view, 0), view);
  const model = projectBranchingView(view);
  assert.deepEqual(model.levels.map((level) => level.map(({ value }) => value)), [[8], [3, 10]]);
  assert.equal(model.nodes.find(({ id }) => id === "node-1").active, true);
  assert.equal(model.edges[0].from.value, 8);
  assert.match(model.ariaLabel, /3 nodes across 2 levels/);
  assert.equal(branchingRendererAdapter.projectView, projectBranchingView);
});

test("branching renderer rejects invalid topology, references, metadata, and bounds", () => {
  const tooManyNodes = Array.from({ length: maximumBranchingNodes + 1 }, (_, index) => ({ id: `node-${index}`, value: index }));
  for (const view of [
    { ...createView(), nodes: [{ id: "bad id", value: 1 }], edges: [], rootIds: ["bad id"], activeNodeIds: [], changedNodeIds: [], states: [], annotations: [], pointers: [] },
    { ...createView(), edges: [...createView().edges, { id: "edge-2", fromId: "node-2", toId: "node-1" }] },
    { ...createView(), edges: [{ id: "edge-0", fromId: "node-0", toId: "missing" }] },
    { ...createView(), rootIds: ["node-1"] },
    { ...createView(), activeNodeIds: ["missing"] },
    { ...createView(), states: [{ nodeId: "node-0", kind: "bad kind", label: "bad" }] },
    { ...createView(), annotations: [{ nodeId: "node-0", label: "" }] },
    { ...createView(), pointers: [{ nodeId: "missing", kind: "current", label: "current" }] },
    { nodes: tooManyNodes, edges: [], rootIds: tooManyNodes.map(({ id }) => id), activeNodeIds: [], changedNodeIds: [], states: [], annotations: [], pointers: [] }
  ]) {
    assert.throws(() => assertBranchingView(view, 1));
  }
});

test("branching renderer enforces fresh rewind snapshots", () => {
  const trace = [{ view: createView() }, { view: createView() }];
  assert.equal(assertBranchingSnapshotOwnership(trace), trace);
  for (const property of ["nodes", "edges", "rootIds", "activeNodeIds", "changedNodeIds", "states", "annotations", "pointers"]) {
    const shared = structuredClone(trace);
    shared[1].view[property] = shared[0].view[property];
    assert.throws(() => assertBranchingSnapshotOwnership(shared), new RegExp(`${property} snapshot`));
  }
  const sharedNode = structuredClone(trace);
  sharedNode[1].view.nodes[0] = sharedNode[0].view.nodes[0];
  assert.throws(() => assertBranchingSnapshotOwnership(sharedNode), /nodes objects/);
});

function createView() {
  return {
    nodes: [
      { id: "node-0", value: 8 },
      { id: "node-1", value: 3 },
      { id: "node-2", value: 10 }
    ],
    edges: [
      { id: "edge-0", fromId: "node-0", toId: "node-1", label: "left" },
      { id: "edge-1", fromId: "node-0", toId: "node-2", label: "right" }
    ],
    rootIds: ["node-0"],
    activeNodeIds: ["node-1"],
    changedNodeIds: [],
    states: [{ nodeId: "node-0", kind: "visited", label: "visited" }],
    annotations: [{ nodeId: "node-1", label: "next" }],
    pointers: [{ nodeId: "node-1", kind: "current", label: "current" }]
  };
}
