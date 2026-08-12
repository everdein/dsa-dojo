import { formatNumber } from "./input.mjs";
import {
  assertOwnedArrays,
  assertOwnedObjects,
  isSafeRendererToken
} from "./renderer-validation.mjs";

export const linkedListRendererAdapter = Object.freeze({
  id: "linked-list",
  matchesView: (view) => Array.isArray(view?.nodes),
  assertView: assertLinkedListView,
  assertSnapshotOwnership: assertLinkedListSnapshotOwnership,
  projectView: projectLinkedListView
});

export function assertLinkedListView(view, stepIndex) {
  if (
    !view
    || !Array.isArray(view.nodes)
    || !Array.isArray(view.pointers)
    || !Array.isArray(view.activeNodeIds)
    || !Array.isArray(view.changedNodeIds)
    || !Array.isArray(view.states)
    || !Array.isArray(view.annotations)
  ) {
    throw new Error(`Trace step ${stepIndex} has an invalid linked-list renderer view.`);
  }
  const nodeIds = new Set();
  view.nodes.forEach((node, nodeIndex) => {
    if (
      !isSafeRendererToken(node.id)
      || nodeIds.has(node.id)
      || node.index !== nodeIndex
      || !Number.isFinite(node.value)
      || (node.nextId !== null && !isSafeRendererToken(node.nextId))
    ) {
      throw new Error(`Trace step ${stepIndex} has an invalid linked-list node.`);
    }
    nodeIds.add(node.id);
  });
  for (const node of view.nodes) {
    if (node.nextId !== null && !nodeIds.has(node.nextId)) {
      throw new Error(`Trace step ${stepIndex} has a dangling next-node reference.`);
    }
  }
  for (const nodeId of view.activeNodeIds) {
    assertNodeId(nodeId, nodeIds, stepIndex, "active node");
  }
  for (const nodeId of view.changedNodeIds) {
    assertNodeId(nodeId, nodeIds, stepIndex, "changed node");
  }
  for (const pointer of view.pointers) {
    if (!isSafeRendererToken(pointer.kind) || !pointer.label) {
      throw new Error(`Trace step ${stepIndex} has an invalid pointer.`);
    }
    if (pointer.nodeId !== null) {
      assertNodeId(pointer.nodeId, nodeIds, stepIndex, "pointer");
    }
  }
  for (const state of view.states) {
    if (!isSafeRendererToken(state.kind) || !state.label) {
      throw new Error(`Trace step ${stepIndex} has an invalid node state.`);
    }
    assertNodeId(state.nodeId, nodeIds, stepIndex, "node state");
  }
  for (const annotation of view.annotations) {
    if (!annotation.label) {
      throw new Error(`Trace step ${stepIndex} has an invalid annotation.`);
    }
    assertNodeId(annotation.nodeId, nodeIds, stepIndex, "annotation");
  }
  return view;
}

export function assertLinkedListSnapshotOwnership(trace) {
  assertOwnedArrays(
    trace,
    ["nodes", "pointers", "activeNodeIds", "changedNodeIds", "states", "annotations"],
    "linked-list renderer"
  );
  assertOwnedObjects(
    trace,
    ["nodes", "pointers", "states", "annotations"],
    "linked-list renderer"
  );
  return trace;
}

/**
 * Converts a renderer-neutral linked-list snapshot into stable node, link,
 * and null-pointer models. DOM layout and SVG path geometry remain browser
 * adapter concerns.
 */
export function projectLinkedListView(view) {
  const nodeById = new Map(view.nodes.map((node) => [node.id, node]));
  const activeNodeIds = new Set(view.activeNodeIds);
  const changedNodeIds = new Set(view.changedNodeIds);
  const pointers = view.pointers.map((pointer, pointerIndex) => {
    const target = pointer.nodeId === null ? null : nodeById.get(pointer.nodeId);
    return {
      ...pointer,
      id: `pointer-${pointer.kind}-${pointerIndex}`,
      isNull: pointer.nodeId === null,
      targetIndex: target?.index ?? null,
      ariaLabel: pointer.nodeId === null
        ? `${pointer.label} points to null`
        : `${pointer.label} points to node ${target.index}, value ${formatNumber(target.value)}`
    };
  });

  const nodes = view.nodes.map((node) => {
    const nextNode = node.nextId === null ? null : nodeById.get(node.nextId);
    const nodePointers = pointers.filter((pointer) => pointer.nodeId === node.id);
    const states = view.states.filter((state) => state.nodeId === node.id);
    const annotations = view.annotations.filter((annotation) => annotation.nodeId === node.id);
    const active = activeNodeIds.has(node.id);
    const changed = changedNodeIds.has(node.id);
    const descriptions = [
      ...(active ? ["active"] : []),
      ...(changed ? ["changed this step"] : []),
      ...nodePointers.map((pointer) => pointer.label),
      ...states.map((state) => state.label),
      ...annotations.map((annotation) => annotation.label)
    ];
    const nextDescription = nextNode
      ? `next points to node ${nextNode.index}, value ${formatNumber(nextNode.value)}`
      : "next points to null";

    return {
      ...node,
      formattedValue: formatNumber(node.value),
      active,
      changed,
      pointers: nodePointers,
      states,
      annotations,
      nextIndex: nextNode?.index ?? null,
      nextValue: nextNode?.value ?? null,
      pointsToNull: node.nextId === null,
      ariaLabel: [
        `Node ${node.index}, value ${formatNumber(node.value)}`,
        nextDescription,
        ...descriptions
      ].join(", ")
    };
  });

  const links = view.nodes.map((node) => {
    const nextNode = node.nextId === null ? null : nodeById.get(node.nextId);
    const changed = changedNodeIds.has(node.id);
    return {
      id: `link-${node.id}`,
      fromId: node.id,
      fromIndex: node.index,
      toId: nextNode?.id ?? null,
      toIndex: nextNode?.index ?? null,
      direction: classifyLinkDirection(node, nextNode),
      changed,
      pointsToNull: nextNode === null,
      ariaLabel: nextNode
        ? `Link from node ${node.index} to node ${nextNode.index}${changed ? ", changed this step" : ""}`
        : `Link from node ${node.index} to null${changed ? ", changed this step" : ""}`
    };
  });

  const nullPointers = pointers.filter((pointer) => pointer.isNull);
  const aggregateDescription = nodes.length === 0
    ? "Empty linked list"
    : `Linked list with ${nodes.length} ${nodes.length === 1 ? "node" : "nodes"}. ${nodes.map((node) => node.ariaLabel).join(". ")}`;

  return {
    nodes,
    links,
    pointers,
    nullPointers,
    ariaLabel: aggregateDescription
  };
}

function classifyLinkDirection(fromNode, toNode) {
  if (toNode === null) return "null";

  const distance = toNode.index - fromNode.index;
  if (distance === 1) return "forward-adjacent";
  if (distance === -1) return "backward-adjacent";
  if (distance === 0) return "self-loop";
  if (distance < -1) return "return";
  return "forward-jump";
}

function assertNodeId(nodeId, nodeIds, stepIndex, label) {
  if (!nodeIds.has(nodeId)) {
    throw new Error(`Trace step ${stepIndex} has an unknown ${label} reference.`);
  }
}
