import { countComponentsWithUnionFind } from "../../../disjoint-sets/count-components.mjs";
import {
  formatGraphInput,
  parseGraphText
} from "../../../graphs/model.mjs";
import { buildCountUnionFindComponentsTrace } from "../count-union-find-components.mjs";

export const countUnionFindComponentsLesson = {
  id: "disjoint-sets/count-components",
  order: 39,
  topic: "Disjoint Sets",
  prerequisites: [
    "graphs/connected-components",
    "disjoint-sets/connectivity-queries"
  ],
  patterns: ["union-find", "connected-components", "edge-stream"],
  catalogLabel: "Count Components with Union-Find",
  catalogDescription: "Reduce the component count only when an edge merges distinct roots.",
  title: "Count graph components with Union-Find",
  summary: "Begin with one component per node. Process each undirected edge as a union and decrement only when its endpoints previously had different roots.",
  views: [
    { id: "edge-stream", renderer: "graph", heading: "Undirected edge stream" },
    { id: "forest", renderer: "graph", heading: "Directed parent forest" },
    { id: "parents", renderer: "lookup", heading: "Parent table" }
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
        placeholder: "A:B, B:C, D:E"
      }
    ],
    help: "Declare isolated nodes too. Labels start with a letter and may contain hyphens. Write each undirected edge with a colon (A:B), then separate nodes and edges with commas.",
    defaultValue: {
      nodes: ["A", "B", "C", "D", "E"],
      edges: [
        { from: "A", to: "B" },
        { from: "B", to: "C" },
        { from: "A", to: "C" },
        { from: "D", to: "E" }
      ]
    },
    sampleValue: {
      nodes: ["A", "B", "C", "D"],
      edges: [
        { from: "A", to: "B" },
        { from: "B", to: "C" },
        { from: "C", to: "D" }
      ]
    },
    parse: ({ nodes, edges }) => parseGraphText(nodes, edges),
    serialize: ({ nodes, edges }) => formatGraphInput(nodes, edges)
  },
  solve: ({ nodes, edges }) => countComponentsWithUnionFind(nodes, edges),
  buildTrace: buildCountUnionFindComponentsTrace,
  code: {
    title: "Count only successful root merges",
    filename: "count-components.mjs",
    sourcePath: "disjoint-sets/count-components.mjs",
    lines: [
      { number: 8, text: "export function countComponentsWithUnionFind(nodes, edges) {", steps: ["function"] },
      { number: 9, text: "  validateGraphInput(nodes, edges);", steps: ["initialize"] },
      { number: 10, text: "  const unionFind = new UnionFind(nodes);", steps: ["initialize"] },
      { number: 11, text: "  for (const { from, to } of edges) unionFind.union(from, to);", steps: ["scan-edge", "find-roots", "union-roots", "decrement-count", "keep-count"] },
      { number: 12, text: "  return unionFind.components;", steps: ["return-count"] },
      { number: 13, text: "}", steps: ["function"] }
    ]
  },
  stats: [
    {
      label: "Edge",
      value: (step) => step.currentEdge === null ? "-" : `${step.currentEdge.from}:${step.currentEdge.to}`,
      detail: (step) => step.edgeIndex === null ? "stream boundary" : `${step.edgeIndex + 1} of ${step.edgeCount}`
    },
    {
      label: "Successful unions",
      value: (step) => String(step.successfulUnions),
      detail: () => "distinct roots merged"
    },
    {
      label: "Redundant edges",
      value: (step) => String(step.redundantEdges),
      detail: () => "already one component"
    },
    {
      label: "Components",
      accent: true,
      value: (step) => String(step.components),
      detail: (step) => step.countReduced ? `${step.countBefore} to ${step.countAfter}` : "current count"
    }
  ],
  complexity: {
    chip: "SUCCESSFUL UNIONS",
    time: "O((V + E) alpha(V))",
    space: "O(V)",
    explanation: "Union-Find initializes V singleton roots and processes each edge once. Weighted union and path compression make each find/union nearly constant amortized time."
  },
  guide: {
    heading: "One successful union removes exactly one component."
  },
  legend: [
    { kind: "candidate", label: "current edge" },
    { kind: "successful", label: "merged distinct roots" },
    { kind: "redundant", label: "same component" },
    { kind: "root", label: "component root" },
    { kind: "component", label: "final assignment" },
    { kind: "compressed", label: "path compressed" },
    { kind: "union-root", label: "winning root" },
    { kind: "attached", label: "attached root" }
  ],
  reflection: {
    eyebrow: "BEFORE YOU MOVE ON",
    title: "Why do cycles not lower the count?",
    body: "An edge inside an existing component may close a cycle, but both endpoints already share a root. Explain why decrementing for that redundant edge would undercount components."
  }
};
