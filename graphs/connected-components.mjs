import {
  buildAdjacency,
  validateGraphInput
} from "./model.mjs";

export function connectedComponents(nodes, edges) {
  validateGraphInput(nodes, edges);
  const adjacency = buildAdjacency(nodes, edges);
  const visited = new Set();
  const components = [];
  for (const start of nodes) {
    if (visited.has(start)) continue;
    const component = [];
    const queue = [start];
    visited.add(start);
    let head = 0;
    while (head < queue.length) {
      const node = queue[head];
      head += 1;
      component.push(node);
      for (const neighbor of adjacency.get(node)) {
        if (visited.has(neighbor.node)) continue;
        visited.add(neighbor.node);
        queue.push(neighbor.node);
      }
    }
    components.push(component);
  }
  return components;
}
