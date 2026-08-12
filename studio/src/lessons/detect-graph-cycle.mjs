import { detectGraphCycle } from "../../../graphs/detect-cycle.mjs";
import {
  formatGraphInput,
  parseGraphText
} from "../../../graphs/model.mjs";
import { buildDetectGraphCycleTrace } from "../detect-graph-cycle.mjs";

export const detectGraphCycleLesson = {
  id: "graphs/detect-cycle",
  order: 36,
  topic: "Graphs",
  prerequisites: ["trees/inorder-traversal", "graphs/connected-components"],
  patterns: ["depth-first-search", "cycle-detection", "parent-tracking"],
  catalogLabel: "Detect a Graph Cycle",
  catalogDescription: "Track each DFS frame's parent so a visited neighbor can prove, rather than merely repeat, a cycle.",
  title: "Detect an undirected cycle with DFS",
  summary: "Search every component. Ignore the one edge back to a frame's parent; any other visited neighbor closes a cycle.",
  views: [
    { id: "graph", renderer: "graph", heading: "Undirected graph" },
    { id: "stack", renderer: "stack", heading: "DFS frames" }
  ],
  input: {
    heading: "Your undirected graph",
    fields: [
      {
        id: "nodes",
        label: "Unique node labels",
        type: "text",
        inputMode: "text",
        placeholder: "A, B, C, D"
      },
      {
        id: "edges",
        label: "Edges (A:B)",
        type: "text",
        inputMode: "text",
        placeholder: "A:B, B:C, C:A"
      }
    ],
    help: "Declare isolated nodes too. Labels may contain hyphens; write each edge with a colon (A:B). Edges are undirected, duplicate reverse edges are rejected, and a self-loop is a cycle.",
    defaultValue: {
      nodes: ["A", "B", "C", "D"],
      edges: [
        { from: "A", to: "B" },
        { from: "B", to: "C" },
        { from: "C", to: "A" }
      ]
    },
    sampleValue: {
      nodes: ["A", "B", "C", "D", "E"],
      edges: [
        { from: "A", to: "B" },
        { from: "B", to: "C" },
        { from: "D", to: "E" }
      ]
    },
    parse: ({ nodes, edges }) => parseGraphText(nodes, edges),
    serialize: ({ nodes, edges }) => formatGraphInput(nodes, edges)
  },
  solve: ({ nodes, edges }) => detectGraphCycle(nodes, edges),
  buildTrace: buildDetectGraphCycleTrace,
  code: {
    title: "A visited neighbor is safe only when it is the parent",
    filename: "detect-cycle.mjs",
    sourcePath: "graphs/detect-cycle.mjs",
    lines: [
      { number: 11, text: "export function detectGraphCycle(nodes, edges) {", steps: ["function"] },
      { number: 12, text: "  validateGraphInput(nodes, edges);", steps: ["initialize"] },
      { number: 13, text: "  const adjacency = buildAdjacency(nodes, edges);", steps: ["initialize"] },
      { number: 14, text: "  const visited = new Set();", steps: ["initialize"] },
      { number: 16, text: "  for (const start of nodes) {", steps: ["scan-start"] },
      { number: 17, text: "    if (visited.has(start)) continue;", steps: ["scan-start"] },
      { number: 18, text: "    const stack = [{ node: start, parent: null, nextNeighborIndex: 0 }];", steps: ["start-component", "push-frame"] },
      { number: 19, text: "    visited.add(start);", steps: ["visit-node"] },
      { number: 21, text: "    while (stack.length > 0) {", steps: ["inspect-edge", "pop-frame"] },
      { number: 22, text: "      const frame = stack.at(-1);", steps: ["inspect-edge"] },
      { number: 23, text: "      const neighbors = adjacency.get(frame.node);", steps: ["inspect-edge"] },
      { number: 24, text: "      if (frame.nextNeighborIndex >= neighbors.length) {", steps: ["pop-frame"] },
      { number: 25, text: "        stack.pop();", steps: ["pop-frame"] },
      { number: 29, text: "      const neighbor = neighbors[frame.nextNeighborIndex];", steps: ["inspect-edge"] },
      { number: 30, text: "      frame.nextNeighborIndex += 1;", steps: ["inspect-edge"] },
      { number: 31, text: "      if (neighbor.node === frame.parent) continue;", steps: ["skip-parent"] },
      { number: 32, text: "      if (visited.has(neighbor.node)) return true;", steps: ["detect-cycle", "return-true"] },
      { number: 34, text: "      visited.add(neighbor.node);", steps: ["discover-neighbor", "visit-node"] },
      { number: 35, text: "      stack.push({", steps: ["push-frame"] },
      { number: 36, text: "        node: neighbor.node,", steps: ["push-frame"] },
      { number: 37, text: "        parent: frame.node,", steps: ["discover-neighbor", "push-frame"] },
      { number: 38, text: "        nextNeighborIndex: 0", steps: ["push-frame"] },
      { number: 42, text: "  return false;", steps: ["return-false"] },
      { number: 43, text: "}", steps: ["function"] }
    ]
  },
  stats: [
    {
      label: "Current node",
      value: (step) => step.currentNode ?? "-",
      detail: (step) => step.parentNode === null ? "no parent" : `parent ${step.parentNode}`
    },
    {
      label: "Neighbor",
      value: (step) => step.neighborNode ?? "-",
      detail: (step) => step.activeEdgeIndex === null ? "no edge active" : `edge ${step.activeEdgeIndex}`
    },
    {
      label: "DFS stack",
      value: (step) => String(step.stackDepth),
      detail: (step) => `${step.finishedCount} finished, ${step.visitedCount} visited`
    },
    {
      label: "Cycle",
      accent: true,
      value: (step) => step.hasCycle ? "found" : step.phase === "complete" ? "none" : "searching",
      detail: (step) => step.cycleEdgeIndex === null ? "parent tracking active" : `witness edge ${step.cycleEdgeIndex}`
    }
  ],
  complexity: {
    chip: "TRACK THE PARENT",
    time: "O(V + E)",
    space: "O(V)",
    explanation: "Every node is visited once and each undirected edge is inspected from at most both endpoints. Visited state and DFS frames hold at most V node labels."
  },
  guide: {
    heading: "Visited is suspicious; visited parent is expected."
  },
  legend: [
    { kind: "visited", label: "visited node" },
    { kind: "finished", label: "finished DFS frame" },
    { kind: "cycle", label: "cycle witness node" },
    { kind: "current-frame", label: "top DFS frame" },
    { kind: "dfs-frame", label: "suspended DFS frame" }
  ],
  reflection: {
    eyebrow: "BEFORE YOU MOVE ON",
    title: "Why does the parent get one exception?",
    body: "Try a tree, a triangle, a disconnected cycle, and a self-loop. Explain why every undirected child sees its parent again and why any different visited neighbor proves an alternate path."
  }
};
