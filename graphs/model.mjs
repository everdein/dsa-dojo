export const maximumGraphModelNodes = 12;
export const maximumGraphModelEdges = 24;
const nodeLabelPattern = /^[A-Za-z][A-Za-z0-9-]*$/;

export function graphNodeId(label) {
  if (typeof label !== "string" || !nodeLabelPattern.test(label)) {
    throw new Error("Graph labels must start with a letter and contain letters, numbers, or hyphens.");
  }
  return `node-${label.toLocaleLowerCase("en-US")}`;
}

export function graphEdgeId(from, to, index) {
  if (!Number.isInteger(index) || index < 0 || index >= maximumGraphModelEdges) {
    throw new Error("Graph edge indices must be nonnegative bounded integers.");
  }
  graphNodeId(from);
  graphNodeId(to);
  return `edge-${index}`;
}

export function validateGraphInput(nodes, edges, { directed = false } = {}) {
  if (!Array.isArray(nodes) || nodes.length === 0 || nodes.length > maximumGraphModelNodes) {
    throw new Error(`Graph input requires 1-${maximumGraphModelNodes} nodes.`);
  }
  if (!Array.isArray(edges) || edges.length > maximumGraphModelEdges) {
    throw new Error(`Graph input accepts at most ${maximumGraphModelEdges} edges.`);
  }
  const labels = new Set();
  const nodeIds = new Set();
  for (let index = 0; index < nodes.length; index += 1) {
    const id = typeof nodes[index] === "string" && nodeLabelPattern.test(nodes[index])
      ? graphNodeId(nodes[index])
      : null;
    if (!Object.hasOwn(nodes, index) || id === null || labels.has(nodes[index]) || nodeIds.has(id)) {
      throw new Error("Graph nodes require unique safe labels.");
    }
    labels.add(nodes[index]);
    nodeIds.add(id);
  }
  const edgeKeys = new Set();
  for (let index = 0; index < edges.length; index += 1) {
    const edge = edges[index];
    if (
      !Object.hasOwn(edges, index)
      || !edge
      || typeof edge !== "object"
      || !labels.has(edge.from)
      || !labels.has(edge.to)
    ) {
      throw new Error("Every graph edge must connect two declared nodes.");
    }
    const endpoints = directed
      ? [edge.from, edge.to]
      : [edge.from, edge.to].sort();
    const key = JSON.stringify([directed, ...endpoints]);
    if (edgeKeys.has(key)) throw new Error("Graph edges must be unique.");
    edgeKeys.add(key);
  }
  return { nodes, edges, directed };
}

export function parseGraphText(rawNodes, rawEdges, { directed = false } = {}) {
  const nodeSource = String(rawNodes ?? "").trim();
  if (nodeSource === "") throw new Error("Enter at least one graph node.");
  const nodes = nodeSource.split(",").map((node) => node.trim());
  if (nodes.some((node) => node === "")) throw new Error("Enter a node between each comma.");

  const edgeSource = String(rawEdges ?? "").trim();
  const edges = edgeSource === "" ? [] : edgeSource.split(",").map((token) => {
    const match = /^([A-Za-z][A-Za-z0-9-]*)\s*:\s*([A-Za-z][A-Za-z0-9-]*)$/.exec(token.trim());
    if (!match) throw new Error(`Invalid graph edge: ${token.trim() || "empty"}. Use A:B.`);
    return { from: match[1], to: match[2] };
  });
  validateGraphInput(nodes, edges, { directed });
  return { nodes, edges };
}

export function formatGraphInput(nodes, edges, { directed = false } = {}) {
  validateGraphInput(nodes, edges, { directed });
  return {
    nodes: nodes.join(", "),
    edges: edges.map(({ from, to }) => `${from}:${to}`).join(", ")
  };
}

export function buildAdjacency(nodes, edges, { directed = false } = {}) {
  validateGraphInput(nodes, edges, { directed });
  const adjacency = new Map(nodes.map((node) => [node, []]));
  edges.forEach(({ from, to }, index) => {
    adjacency.get(from).push({ node: to, edgeIndex: index });
    if (!directed && from !== to) adjacency.get(to).push({ node: from, edgeIndex: index });
  });
  return adjacency;
}

export function graphRendererSnapshot(nodes, edges, {
  directed = false,
  activeNodes = [],
  activeEdges = [],
  changedNodes = [],
  states = [],
  annotations = []
} = {}) {
  validateGraphInput(nodes, edges, { directed });
  return {
    structure: "graph",
    directed,
    nodes: nodes.map((label) => ({ id: graphNodeId(label), value: label })),
    edges: edges.map(({ from, to }, index) => ({
      id: graphEdgeId(from, to, index),
      fromId: graphNodeId(from),
      toId: graphNodeId(to)
    })),
    activeNodeIds: activeNodes.map(graphNodeId),
    activeEdgeIds: activeEdges.map((index) => graphEdgeId(edges[index].from, edges[index].to, index)),
    changedNodeIds: changedNodes.map(graphNodeId),
    states: states.map(({ node, kind, label }) => ({ nodeId: graphNodeId(node), kind, label })),
    annotations: annotations.map(({ node, label }) => ({ nodeId: graphNodeId(node), label }))
  };
}
