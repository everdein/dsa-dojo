import { connectedComponents } from "../../../graphs/connected-components.mjs";
import {
  formatGraphInput,
  parseGraphText
} from "../../../graphs/model.mjs";
import { buildConnectedComponentsTrace } from "../connected-components.mjs";

export const connectedComponentsLesson = {
  id: "graphs/connected-components",
  order: 34,
  topic: "Graphs",
  prerequisites: ["trees/level-order-traversal"],
  patterns: ["breadth-first-search", "graph", "connected-components"],
  catalogLabel: "Connected Components",
  catalogDescription: "Start one breadth-first search for each unvisited region.",
  title: "Find connected components with BFS",
  summary: "Scan every node. Whenever one is still unvisited, a complete breadth-first search discovers exactly one connected component.",
  views: [
    { id: "graph", renderer: "graph", heading: "Undirected graph" },
    { id: "queue", renderer: "queue", heading: "BFS frontier" }
  ],
  input: {
    heading: "Your undirected graph",
    fields: [
      { id: "nodes", label: "Unique node labels", type: "text", inputMode: "text", placeholder: "A, B, C, D, E" },
      { id: "edges", label: "Edges (A:B)", type: "text", inputMode: "text", placeholder: "A:B, C:D" }
    ],
    help: "Declare isolated nodes too. Labels start with a letter and may contain hyphens. Write each undirected edge with a colon (A:B), then separate nodes and edges with commas.",
    defaultValue: { nodes: ["A", "B", "C", "D", "E"], edges: [{ from: "A", to: "B" }, { from: "C", to: "D" }] },
    sampleValue: { nodes: ["A", "B", "C", "D"], edges: [{ from: "A", to: "B" }, { from: "B", to: "C" }, { from: "C", to: "D" }] },
    parse: ({ nodes, edges }) => parseGraphText(nodes, edges),
    serialize: ({ nodes, edges }) => formatGraphInput(nodes, edges)
  },
  solve: ({ nodes, edges }) => connectedComponents(nodes, edges),
  buildTrace: buildConnectedComponentsTrace,
  code: {
    title: "Launch BFS from each unvisited node",
    filename: "connected-components.mjs",
    sourcePath: "graphs/connected-components.mjs",
    lines: [
      { number: 6, text: "export function connectedComponents(nodes, edges) {", steps: ["initialize"] },
      { number: 8, text: "  const adjacency = buildAdjacency(nodes, edges);", steps: ["initialize"] },
      { number: 9, text: "  const visited = new Set();", steps: ["initialize"] },
      { number: 10, text: "  const components = [];", steps: ["initialize"] },
      { number: 11, text: "  for (const start of nodes) {", steps: ["scan-start"] },
      { number: 12, text: "    if (visited.has(start)) continue;", steps: ["scan-start"] },
      { number: 13, text: "    const component = [];", steps: ["start-bfs"] },
      { number: 14, text: "    const queue = [start];", steps: ["start-bfs"] },
      { number: 15, text: "    visited.add(start);", steps: ["start-bfs"] },
      { number: 16, text: "    let head = 0;", steps: ["start-bfs"] },
      { number: 17, text: "    while (head < queue.length) {", steps: ["dequeue"] },
      { number: 18, text: "      const node = queue[head];", steps: ["dequeue"] },
      { number: 19, text: "      head += 1;", steps: ["dequeue"] },
      { number: 20, text: "      component.push(node);", steps: ["record"] },
      { number: 21, text: "      for (const neighbor of adjacency.get(node)) {", steps: ["scan-neighbors"] },
      { number: 22, text: "        if (visited.has(neighbor.node)) continue;", steps: ["scan-neighbors"] },
      { number: 23, text: "        visited.add(neighbor.node);", steps: ["enqueue"] },
      { number: 24, text: "        queue.push(neighbor.node);", steps: ["enqueue"] },
      { number: 25, text: "      }", steps: ["scan-neighbors"] },
      { number: 26, text: "    }", steps: ["dequeue"] },
      { number: 27, text: "    components.push(component);", steps: ["start-bfs"] },
      { number: 28, text: "  }", steps: ["scan-start"] },
      { number: 29, text: "  return components;", steps: ["return"] },
      { number: 30, text: "}", steps: ["return"] }
    ]
  },
  stats: [
    { label: "Current node", value: (step) => step.currentNode ?? "-", detail: () => "declared label" },
    { label: "Visited", value: (step) => String(step.visitedCount), detail: () => "marked before enqueue" },
    { label: "Queue", value: (step) => String(step.queueSize), detail: () => "BFS frontier" },
    { label: "Components", accent: true, value: (step) => String(step.componentCount), detail: () => "BFS launches" }
  ],
  complexity: {
    chip: "BFS FOREST",
    time: "O(V + E)",
    space: "O(V)",
    explanation: "Every node is enqueued once and every undirected edge is inspected from each endpoint. Visited state and the queue hold at most V labels."
  },
  guide: { heading: "One BFS, one connected region." },
  legend: [
    { kind: "active", label: "current node" },
    { kind: "visited", label: "discovered" },
    { kind: "frontier", label: "queued" },
    { kind: "component", label: "assigned region" }
  ],
  reflection: {
    eyebrow: "BEFORE YOU MOVE ON",
    title: "Why does every unvisited start prove a new component?",
    body: "A completed BFS reaches every node connected to its start. Explain why a node that remains unvisited afterward cannot belong to that same component."
  }
};
