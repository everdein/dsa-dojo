import { formatNumber } from "./input.mjs";
import {
  assertOwnedArrays,
  assertOwnedObjects,
  isSafeRendererToken
} from "./renderer-validation.mjs";

export const maximumGraphNodes = 16;
export const maximumGraphEdges = 32;

export const graphRendererAdapter = Object.freeze({
  id: "graph",
  matchesView: (view) => view?.structure === "graph" && Array.isArray(view?.nodes),
  assertView: assertGraphView,
  assertSnapshotOwnership: assertGraphSnapshotOwnership,
  projectView: projectGraphView
});

export function assertGraphView(view, stepIndex) {
  if (
    !view
    || view.structure !== "graph"
    || typeof view.directed !== "boolean"
    || !Array.isArray(view.nodes)
    || !Array.isArray(view.edges)
    || !Array.isArray(view.activeNodeIds)
    || !Array.isArray(view.activeEdgeIds)
    || !Array.isArray(view.changedNodeIds)
    || !Array.isArray(view.states)
    || !Array.isArray(view.annotations)
    || view.nodes.length > maximumGraphNodes
    || view.edges.length > maximumGraphEdges
  ) {
    throw new Error(`Trace step ${stepIndex} has an invalid graph renderer view.`);
  }

  const nodeIds = new Set();
  for (const node of view.nodes) {
    if (!node || !isSafeRendererToken(node.id) || nodeIds.has(node.id) || !isGraphValue(node.value)) {
      throw new Error(`Trace step ${stepIndex} has an invalid graph node.`);
    }
    nodeIds.add(node.id);
  }
  const edgeIds = new Set();
  for (const edge of view.edges) {
    if (
      !edge
      || !isSafeRendererToken(edge.id)
      || edgeIds.has(edge.id)
      || !nodeIds.has(edge.fromId)
      || !nodeIds.has(edge.toId)
      || (edge.label !== undefined && !hasText(edge.label))
    ) {
      throw new Error(`Trace step ${stepIndex} has an invalid graph edge.`);
    }
    edgeIds.add(edge.id);
  }
  assertUniqueKnownIds(view.activeNodeIds, nodeIds, stepIndex, "active node");
  assertUniqueKnownIds(view.activeEdgeIds, edgeIds, stepIndex, "active edge");
  assertUniqueKnownIds(view.changedNodeIds, nodeIds, stepIndex, "changed node");
  assertNodeMetadata(view.states, nodeIds, stepIndex, "state", ({ kind, label }) => (
    isSafeRendererToken(kind) && hasText(label)
  ));
  assertNodeMetadata(view.annotations, nodeIds, stepIndex, "annotation", ({ label }) => hasText(label));
  return view;
}

export function assertGraphSnapshotOwnership(trace) {
  const arrays = ["nodes", "edges", "activeNodeIds", "activeEdgeIds", "changedNodeIds", "states", "annotations"];
  assertOwnedArrays(trace, arrays, "graph renderer");
  assertOwnedObjects(trace, ["nodes", "edges", "states", "annotations"], "graph renderer");
  return trace;
}

export function projectGraphView(view) {
  const activeNodeIds = new Set(view.activeNodeIds);
  const activeEdgeIds = new Set(view.activeEdgeIds);
  const changedNodeIds = new Set(view.changedNodeIds);
  const statesById = groupByNodeId(view.states);
  const annotationsById = groupByNodeId(view.annotations);
  const positions = graphPositions(view.nodes.length);
  const nodes = view.nodes.map((node, index) => {
    const valueText = typeof node.value === "number" ? formatNumber(node.value) : node.value;
    const active = activeNodeIds.has(node.id);
    const changed = changedNodeIds.has(node.id);
    const states = statesById.get(node.id) ?? [];
    const annotations = annotationsById.get(node.id) ?? [];
    const details = [
      ...(active ? ["active"] : []),
      ...(changed ? ["changed this step"] : []),
      ...states.map(({ label }) => label),
      ...annotations.map(({ label }) => label)
    ];
    const description = `Graph node ${valueText}${details.length ? `, ${details.join(", ")}` : ""}`;
    return {
      ...node,
      ...positions[index],
      valueText,
      active,
      changed,
      states,
      annotations,
      description,
      ariaLabel: description
    };
  });
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const edges = view.edges.map((edge) => {
    const from = nodeById.get(edge.fromId);
    const to = nodeById.get(edge.toId);
    const active = activeEdgeIds.has(edge.id);
    const description = `${view.directed ? "Directed e" : "E"}dge from ${from.valueText} to ${to.valueText}${edge.label ? `, ${edge.label}` : ""}${active ? ", active" : ""}`;
    return { ...edge, from, to, active, description, ariaLabel: description };
  });
  const description = `Graph with ${nodes.length} ${nodes.length === 1 ? "node" : "nodes"} and ${edges.length} ${edges.length === 1 ? "edge" : "edges"}${view.directed ? ", directed" : ", undirected"}.`;
  return { directed: view.directed, nodes, edges, description, ariaLabel: description };
}

function graphPositions(count) {
  if (count === 0) return [];
  if (count === 1) return [{ x: 50, y: 50 }];
  const radius = count <= 8 ? 38 : 42;
  return Array.from({ length: count }, (_, index) => {
    const angle = (-Math.PI / 2) + ((Math.PI * 2 * index) / count);
    return {
      x: 50 + (radius * Math.cos(angle)),
      y: 50 + (radius * Math.sin(angle))
    };
  });
}

function assertUniqueKnownIds(ids, knownIds, stepIndex, label) {
  if (new Set(ids).size !== ids.length || ids.some((id) => !knownIds.has(id))) {
    throw new Error(`Trace step ${stepIndex} has an invalid graph ${label}.`);
  }
}

function assertNodeMetadata(items, nodeIds, stepIndex, label, validate) {
  const keys = new Set();
  for (const item of items) {
    const key = item && `${item.nodeId}:${item.kind ?? ""}`;
    if (!item || !nodeIds.has(item.nodeId) || keys.has(key) || !validate(item)) {
      throw new Error(`Trace step ${stepIndex} has an invalid graph ${label}.`);
    }
    keys.add(key);
  }
}

function groupByNodeId(items) {
  const grouped = new Map();
  for (const item of items) {
    if (!grouped.has(item.nodeId)) grouped.set(item.nodeId, []);
    grouped.get(item.nodeId).push({ ...item });
  }
  return grouped;
}

function isGraphValue(value) {
  return typeof value === "string" || (typeof value === "number" && Number.isFinite(value));
}

function hasText(value) {
  return typeof value === "string" && value.trim() !== "";
}
