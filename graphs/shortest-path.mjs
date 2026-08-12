import {
  buildAdjacency,
  validateGraphInput
} from "./model.mjs";

export function validateShortestPathInput(nodes, edges, start, target) {
  validateGraphInput(nodes, edges);
  const labels = new Set(nodes);
  if (typeof start !== "string" || !labels.has(start)) {
    throw new Error("Shortest Path start must be a declared graph node.");
  }
  if (typeof target !== "string" || !labels.has(target)) {
    throw new Error("Shortest Path target must be a declared graph node.");
  }
  return { nodes, edges, start, target };
}

/**
 * Finds an unweighted shortest path with breadth-first search. Neighbors are
 * visited in declared edge order, so multiple equally short routes resolve
 * deterministically. Discovery stops as soon as the target receives a parent.
 */
export function unweightedShortestPath(nodes, edges, start, target) {
  validateShortestPathInput(nodes, edges, start, target);
  if (start === target) return { distance: 0, path: [start] };

  const adjacency = buildAdjacency(nodes, edges);
  const parents = new Map([[start, null]]);
  const queue = [start];
  let head = 0;

  while (head < queue.length) {
    const node = queue[head];
    head += 1;
    for (const neighbor of adjacency.get(node)) {
      if (parents.has(neighbor.node)) continue;
      parents.set(neighbor.node, node);
      if (neighbor.node === target) return resultFromParents(parents, target);
      queue.push(neighbor.node);
    }
  }
  return null;
}

export function resultFromParents(parents, target) {
  if (!(parents instanceof Map) || !parents.has(target)) {
    throw new Error("Path reconstruction requires a parent entry for the target.");
  }
  const path = [];
  let current = target;
  while (current !== null) {
    path.push(current);
    current = parents.get(current);
  }
  path.reverse();
  return { distance: path.length - 1, path };
}
