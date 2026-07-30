import { formatNumber } from "./input.mjs";

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
