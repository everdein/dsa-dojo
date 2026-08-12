import {
  buildAdjacency,
  validateGraphInput
} from "./model.mjs";

/**
 * Detects a cycle in an undirected graph. Each DFS frame remembers the node it
 * arrived from: seeing that parent again is the same undirected edge, while a
 * visited non-parent neighbor proves a cycle. A self-loop is therefore a cycle.
 */
export function detectGraphCycle(nodes, edges) {
  validateGraphInput(nodes, edges);
  const adjacency = buildAdjacency(nodes, edges);
  const visited = new Set();

  for (const start of nodes) {
    if (visited.has(start)) continue;
    const stack = [{ node: start, parent: null, nextNeighborIndex: 0 }];
    visited.add(start);

    while (stack.length > 0) {
      const frame = stack.at(-1);
      const neighbors = adjacency.get(frame.node);
      if (frame.nextNeighborIndex >= neighbors.length) {
        stack.pop();
        continue;
      }

      const neighbor = neighbors[frame.nextNeighborIndex];
      frame.nextNeighborIndex += 1;
      if (neighbor.node === frame.parent) continue;
      if (visited.has(neighbor.node)) return true;

      visited.add(neighbor.node);
      stack.push({
        node: neighbor.node,
        parent: frame.node,
        nextNeighborIndex: 0
      });
    }
  }
  return false;
}

export const hasUndirectedCycle = detectGraphCycle;
