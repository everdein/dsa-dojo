import { formatNumber } from "./input.mjs";
import {
  assertOwnedArrays,
  assertOwnedObjects,
  isSafeRendererToken
} from "./renderer-validation.mjs";

export const maximumBranchingNodes = 31;

export const branchingRendererAdapter = Object.freeze({
  id: "branching",
  matchesView: (view) => Array.isArray(view?.nodes) && Array.isArray(view?.edges) && Array.isArray(view?.rootIds),
  assertView: assertBranchingView,
  assertSnapshotOwnership: assertBranchingSnapshotOwnership,
  projectView: projectBranchingView
});

export function assertBranchingView(view, stepIndex) {
  if (
    !view
    || !Array.isArray(view.nodes)
    || !Array.isArray(view.edges)
    || !Array.isArray(view.rootIds)
    || !Array.isArray(view.activeNodeIds)
    || !Array.isArray(view.changedNodeIds)
    || !Array.isArray(view.states)
    || !Array.isArray(view.annotations)
    || !Array.isArray(view.pointers)
    || view.nodes.length > maximumBranchingNodes
  ) {
    throw new Error(`Trace step ${stepIndex} has an invalid branching renderer view.`);
  }

  const nodeIds = new Set();
  for (const node of view.nodes) {
    if (!node || !isSafeRendererToken(node.id) || nodeIds.has(node.id) || !isBranchingValue(node.value)) {
      throw new Error(`Trace step ${stepIndex} has an invalid branching node.`);
    }
    nodeIds.add(node.id);
  }
  assertUniqueKnownIds(view.rootIds, nodeIds, stepIndex, "root");
  assertUniqueKnownIds(view.activeNodeIds, nodeIds, stepIndex, "active node");
  assertUniqueKnownIds(view.changedNodeIds, nodeIds, stepIndex, "changed node");

  const edgeIds = new Set();
  const parentByChild = new Map();
  const childrenByParent = new Map([...nodeIds].map((id) => [id, []]));
  for (const edge of view.edges) {
    if (
      !edge
      || !isSafeRendererToken(edge.id)
      || edgeIds.has(edge.id)
      || !nodeIds.has(edge.fromId)
      || !nodeIds.has(edge.toId)
      || edge.fromId === edge.toId
      || (edge.label !== undefined && (typeof edge.label !== "string" || edge.label.trim() === ""))
      || parentByChild.has(edge.toId)
    ) {
      throw new Error(`Trace step ${stepIndex} has an invalid branching edge.`);
    }
    edgeIds.add(edge.id);
    parentByChild.set(edge.toId, edge.fromId);
    childrenByParent.get(edge.fromId).push(edge.toId);
  }

  const expectedRoots = [...nodeIds].filter((id) => !parentByChild.has(id));
  if (view.rootIds.length !== expectedRoots.length || expectedRoots.some((id) => !view.rootIds.includes(id))) {
    throw new Error(`Trace step ${stepIndex} branching roots must match the parentless nodes.`);
  }
  const visited = new Set();
  const visiting = new Set();
  const visit = (id) => {
    if (visiting.has(id)) throw new Error(`Trace step ${stepIndex} branching edges contain a cycle.`);
    if (visited.has(id)) return;
    visiting.add(id);
    for (const childId of childrenByParent.get(id)) visit(childId);
    visiting.delete(id);
    visited.add(id);
  };
  for (const rootId of view.rootIds) visit(rootId);
  if (visited.size !== nodeIds.size) {
    throw new Error(`Trace step ${stepIndex} branching nodes must be reachable from a root.`);
  }

  assertNodeMetadata(view.states, nodeIds, stepIndex, "state", ({ kind, label }) => (
    isSafeRendererToken(kind) && hasText(label)
  ));
  assertNodeMetadata(view.annotations, nodeIds, stepIndex, "annotation", ({ label }) => hasText(label));
  const pointerKinds = new Set();
  for (const pointer of view.pointers) {
    if (
      !pointer
      || !isSafeRendererToken(pointer.kind)
      || pointerKinds.has(pointer.kind)
      || !hasText(pointer.label)
      || (pointer.nodeId !== null && !nodeIds.has(pointer.nodeId))
    ) {
      throw new Error(`Trace step ${stepIndex} has an invalid branching pointer.`);
    }
    pointerKinds.add(pointer.kind);
  }
  return view;
}

export function assertBranchingSnapshotOwnership(trace) {
  const arrays = ["nodes", "edges", "rootIds", "activeNodeIds", "changedNodeIds", "states", "annotations", "pointers"];
  assertOwnedArrays(trace, arrays, "branching renderer");
  assertOwnedObjects(trace, ["nodes", "edges", "states", "annotations", "pointers"], "branching renderer");
  return trace;
}

export function projectBranchingView(view) {
  const activeIds = new Set(view.activeNodeIds);
  const changedIds = new Set(view.changedNodeIds);
  const statesById = groupByNodeId(view.states);
  const annotationsById = groupByNodeId(view.annotations);
  const pointersById = new Map(view.nodes.map(({ id }) => [id, []]));
  const nullPointers = [];
  for (const pointer of view.pointers) {
    if (pointer.nodeId === null) nullPointers.push({ ...pointer });
    else pointersById.get(pointer.nodeId).push({ ...pointer });
  }
  const childrenByParent = new Map(view.nodes.map(({ id }) => [id, []]));
  for (const edge of view.edges) childrenByParent.get(edge.fromId).push(edge.toId);

  const placement = new Map();
  const levels = [];
  const queue = view.rootIds.map((id) => ({ id, depth: 0 }));
  while (queue.length) {
    const { id, depth } = queue.shift();
    if (!levels[depth]) levels[depth] = [];
    placement.set(id, { depth, order: levels[depth].length });
    levels[depth].push(id);
    for (const childId of childrenByParent.get(id)) queue.push({ id: childId, depth: depth + 1 });
  }

  const nodes = view.nodes.map((node) => {
    const valueText = typeof node.value === "number" ? formatNumber(node.value) : node.value;
    const states = statesById.get(node.id) ?? [];
    const annotations = annotationsById.get(node.id) ?? [];
    const pointers = pointersById.get(node.id);
    const active = activeIds.has(node.id);
    const changed = changedIds.has(node.id);
    const details = [
      ...(active ? ["active"] : []),
      ...(changed ? ["changed this step"] : []),
      ...pointers.map(({ label }) => label),
      ...states.map(({ label }) => label),
      ...annotations.map(({ label }) => label)
    ];
    const description = `Node ${node.id}, value ${valueText}${details.length ? `, ${details.join(", ")}` : ""}`;
    return {
      ...node,
      ...placement.get(node.id),
      valueText,
      active,
      changed,
      states,
      annotations,
      pointers,
      description,
      ariaLabel: description
    };
  });
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const edges = view.edges.map((edge) => ({
    ...edge,
    from: nodeById.get(edge.fromId),
    to: nodeById.get(edge.toId),
    description: `Edge from ${nodeById.get(edge.fromId).valueText} to ${nodeById.get(edge.toId).valueText}${edge.label ? `, ${edge.label}` : ""}`
  }));
  const levelModels = levels.map((ids) => ids.map((id) => nodeById.get(id)));
  const description = nodes.length === 0
    ? "Branching structure is empty."
    : `Branching structure with ${nodes.length} ${nodes.length === 1 ? "node" : "nodes"} across ${levelModels.length} ${levelModels.length === 1 ? "level" : "levels"}.`;
  return { nodes, edges, levels: levelModels, nullPointers, description, ariaLabel: description };
}

function assertUniqueKnownIds(ids, knownIds, stepIndex, label) {
  if (new Set(ids).size !== ids.length || ids.some((id) => !knownIds.has(id))) {
    throw new Error(`Trace step ${stepIndex} has an invalid branching ${label}.`);
  }
}

function assertNodeMetadata(items, nodeIds, stepIndex, label, validate) {
  const keys = new Set();
  for (const item of items) {
    const key = item && `${item.nodeId}:${item.kind ?? ""}`;
    if (!item || !nodeIds.has(item.nodeId) || keys.has(key) || !validate(item)) {
      throw new Error(`Trace step ${stepIndex} has an invalid branching ${label}.`);
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

function isBranchingValue(value) {
  return typeof value === "string" || (typeof value === "number" && Number.isFinite(value));
}

function hasText(value) {
  return typeof value === "string" && value.trim() !== "";
}
