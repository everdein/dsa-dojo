import { unweightedShortestPath } from "../../../graphs/shortest-path.mjs";
import {
  formatGraphInput,
  parseGraphText
} from "../../../graphs/model.mjs";
import { buildShortestPathTrace } from "../shortest-path.mjs";

export const shortestPathLesson = {
  id: "graphs/unweighted-shortest-path",
  order: 35,
  topic: "Graphs",
  prerequisites: ["graphs/connected-components"],
  patterns: ["breadth-first-search", "shortest-path", "parent-map"],
  catalogLabel: "Unweighted Shortest Path",
  catalogDescription: "Use BFS layers and parent links to reconstruct a shortest route.",
  title: "Find an unweighted shortest path",
  summary: "Breadth-first search discovers nodes in nondecreasing edge distance. Record each node's first parent, stop when the target is discovered, then follow parents back to the start.",
  views: [
    { id: "graph", renderer: "graph", heading: "Undirected graph" },
    { id: "queue", renderer: "queue", heading: "BFS frontier" }
  ],
  input: {
    heading: "Your undirected graph",
    fields: [
      {
        id: "nodes",
        label: "Unique node labels",
        type: "text",
        inputMode: "text",
        placeholder: "A, B, C, D, E"
      },
      {
        id: "edges",
        label: "Edges (A:B)",
        type: "text",
        inputMode: "text",
        placeholder: "A:B, A:C, B:D"
      },
      {
        id: "start",
        label: "Start node",
        type: "text",
        inputMode: "text",
        placeholder: "A"
      },
      {
        id: "target",
        label: "Target node",
        type: "text",
        inputMode: "text",
        placeholder: "D"
      }
    ],
    help: "Declare every node, including isolated nodes. Labels are case-sensitive, start with a letter, and may contain hyphens. Write each edge with a colon (A:B). Equally short routes follow declared edge order.",
    defaultValue: {
      nodes: ["A", "B", "C", "D", "E"],
      edges: [
        { from: "A", to: "B" },
        { from: "A", to: "C" },
        { from: "B", to: "D" },
        { from: "C", to: "E" },
        { from: "E", to: "D" }
      ],
      start: "A",
      target: "D"
    },
    sampleValue: {
      nodes: ["S", "A", "B", "C", "T"],
      edges: [
        { from: "S", to: "A" },
        { from: "S", to: "B" },
        { from: "A", to: "C" },
        { from: "B", to: "C" },
        { from: "C", to: "T" }
      ],
      start: "S",
      target: "T"
    },
    parse: (fields) => {
      const { nodes, edges } = parseGraphText(fields.nodes, fields.edges);
      const start = String(fields.start ?? "").trim();
      const target = String(fields.target ?? "").trim();
      unweightedShortestPath(nodes, edges, start, target);
      return { nodes, edges, start, target };
    },
    serialize: ({ nodes, edges, start, target }) => ({
      ...formatGraphInput(nodes, edges),
      start,
      target
    })
  },
  solve: ({ nodes, edges, start, target }) => (
    unweightedShortestPath(nodes, edges, start, target)
  ),
  buildTrace: buildShortestPathTrace,
  code: {
    title: "First discovery fixes the shortest parent",
    filename: "shortest-path.mjs",
    sourcePath: "graphs/shortest-path.mjs",
    lines: [
      { number: 23, text: "export function unweightedShortestPath(nodes, edges, start, target) {", steps: ["function"] },
      { number: 24, text: "  validateShortestPathInput(nodes, edges, start, target);", steps: ["initialize"] },
      { number: 25, text: "  if (start === target) return { distance: 0, path: [start] };", steps: ["return"] },
      { number: 27, text: "  const adjacency = buildAdjacency(nodes, edges);", steps: ["initialize"] },
      { number: 28, text: "  const parents = new Map([[start, null]]);", steps: ["initialize"] },
      { number: 29, text: "  const queue = [start];", steps: ["initialize"] },
      { number: 32, text: "  while (head < queue.length) {", steps: ["dequeue"] },
      { number: 33, text: "    const node = queue[head];", steps: ["dequeue"] },
      { number: 34, text: "    head += 1;", steps: ["dequeue"] },
      { number: 35, text: "    for (const neighbor of adjacency.get(node)) {", steps: ["scan-neighbor"] },
      { number: 36, text: "      if (parents.has(neighbor.node)) continue;", steps: ["skip-discovered"] },
      { number: 37, text: "      parents.set(neighbor.node, node);", steps: ["record-parent"] },
      { number: 38, text: "      if (neighbor.node === target) return resultFromParents(parents, target);", steps: ["stop-on-discovery", "reconstruct-path"] },
      { number: 39, text: "      queue.push(neighbor.node);", steps: ["enqueue"] },
      { number: 42, text: "  return null;", steps: ["return"] },
      { number: 43, text: "}", steps: ["function"] }
    ]
  },
  stats: [
    {
      label: "Current node",
      value: (step) => step.currentNode ?? "-",
      detail: () => "declared label"
    },
    {
      label: "Discovered",
      value: (step) => String(step.discoveredCount),
      detail: () => "one parent each"
    },
    {
      label: "Queue",
      value: (step) => String(step.queueSize),
      detail: () => "BFS frontier"
    },
    {
      label: "Path",
      accent: true,
      value: (step) => step.resultPath.length === 0 ? "-" : step.resultPath.join(" → "),
      detail: (step) => step.resultPath.length === 0
        ? "reconstructed after discovery"
        : `${step.resultPath.length - 1} edges`
    }
  ],
  complexity: {
    chip: "FIRST DISCOVERY WINS",
    time: "O(V + E)",
    space: "O(V)",
    explanation: "Every discovered node enters the queue once, and each undirected edge is inspected at most from both endpoints. The queue, discovered set encoded by the parent map, and reconstructed path use O(V) space."
  },
  guide: {
    heading: "Parents turn BFS layers into a route."
  },
  legend: [
    { kind: "start", label: "start node" },
    { kind: "target", label: "target node" },
    { kind: "discovered", label: "parent recorded" },
    { kind: "processed", label: "dequeued" },
    { kind: "frontier", label: "queued" },
    { kind: "shortest-path", label: "result path" }
  ],
  reflection: {
    eyebrow: "BEFORE YOU MOVE ON",
    title: "Why can BFS stop on target discovery?",
    body: "Try cycles, disconnected targets, a start equal to the target, and two equally short routes. Explain why the target's first parent cannot be replaced by a path with fewer edges."
  }
};
