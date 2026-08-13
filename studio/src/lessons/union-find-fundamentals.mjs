import {
  formatUnionFindNodes,
  formatUnionFindProgram,
  maximumUnionFindNodes,
  maximumUnionFindOperations,
  parseUnionFindNodes,
  parseUnionFindProgram,
  runUnionFindProgram
} from "../../../disjoint-sets/union-find.mjs";
import { buildUnionFindFundamentalsTrace } from "../union-find-fundamentals.mjs";

export const unionFindFundamentalsLesson = {
  id: "disjoint-sets/union-find-fundamentals",
  order: 37,
  topic: "Disjoint Sets",
  prerequisites: ["graphs/connected-components"],
  patterns: ["union-find", "path-compression", "union-by-size"],
  catalogLabel: "Union-Find Fundamentals",
  catalogDescription: "Maintain representative roots with compression and weighted unions.",
  title: "Build connectivity with Union-Find",
  summary: "Find follows parent links to a representative and compresses the path. Union attaches the smaller root beneath the larger root to keep future paths shallow.",
  views: [
    { id: "forest", renderer: "graph", heading: "Directed parent forest" },
    { id: "parents", renderer: "lookup", heading: "Parent table" }
  ],
  input: {
    heading: "Your nodes and operation program",
    fields: [
      {
        id: "nodes",
        label: `Enter 1-${maximumUnionFindNodes} unique node labels`,
        type: "text",
        inputMode: "text",
        placeholder: "A, B, C, D"
      },
      {
        id: "operations",
        label: `Enter 1-${maximumUnionFindOperations} union/find operations`,
        type: "text",
        inputMode: "text",
        placeholder: "union A B, find B, union B C"
      }
    ],
    help: "Labels start with a letter and contain letters, numbers, or hyphens. Use union A B or find A, separated by commas.",
    defaultValue: {
      nodes: ["A", "B", "C", "D"],
      operations: [
        { type: "union", left: "A", right: "B" },
        { type: "union", left: "C", right: "D" },
        { type: "union", left: "A", right: "C" },
        { type: "find", node: "D" },
        { type: "union", left: "B", right: "D" }
      ]
    },
    sampleValue: {
      nodes: ["A", "B", "C"],
      operations: [
        { type: "union", left: "A", right: "B" },
        { type: "find", node: "B" },
        { type: "union", left: "B", right: "C" }
      ]
    },
    parse: ({ nodes, operations }) => {
      const parsedNodes = parseUnionFindNodes(nodes);
      return {
        nodes: parsedNodes,
        operations: parseUnionFindProgram(operations, parsedNodes)
      };
    },
    serialize: ({ nodes, operations }) => ({
      nodes: formatUnionFindNodes(nodes),
      operations: formatUnionFindProgram(operations, nodes)
    })
  },
  solve: ({ nodes, operations }) => runUnionFindProgram(nodes, operations),
  buildTrace: buildUnionFindFundamentalsTrace,
  code: {
    title: "Compress paths and attach the smaller root",
    filename: "union-find.mjs",
    sourcePath: "disjoint-sets/union-find.mjs",
    lines: [
      { number: 105, text: "  inspectFind(node) {", steps: ["find-path"] },
      { number: 109, text: "    while (this.parent.get(current) !== current) {", steps: ["find-path"] },
      { number: 110, text: "      current = this.parent.get(current);", steps: ["find-path"] },
      { number: 121, text: "  findWithDetails(node) {", steps: ["find-path"] },
      { number: 123, text: "    for (const pathNode of details.path.slice(0, -1)) {", steps: ["compress-path"] },
      { number: 124, text: "      this.parent.set(pathNode, details.root);", steps: ["compress-path"] },
      { number: 135, text: "    return this.findWithDetails(node).root;", steps: ["return-root"] },
      { number: 138, text: "  unionRoots(leftRoot, rightRoot) {", steps: ["union-roots"] },
      { number: 141, text: "    if (leftRoot === rightRoot) {", steps: ["already-connected"] },
      { number: 153, text: "    if (this.size.get(root) < this.size.get(attachedRoot)) {", steps: ["attach-smaller"] },
      { number: 154, text: "      [root, attachedRoot] = [attachedRoot, root];", steps: ["attach-smaller"] },
      { number: 156, text: "    this.parent.set(attachedRoot, root);", steps: ["attach-smaller"] },
      { number: 157, text: "    this.size.set(root, this.size.get(root) + this.size.get(attachedRoot));", steps: ["attach-smaller"] },
      { number: 158, text: "    this.components -= 1;", steps: ["attach-smaller"] },
      { number: 188, text: "  snapshot() {", steps: ["initialize", "return-state"] },
      { number: 255, text: "  return {", steps: ["return-state"] },
      { number: 190, text: "      parent: Object.fromEntries(this.nodes.map((node) => [node, this.parent.get(node)])),", steps: ["return-state"] },
      { number: 191, text: "      size: Object.fromEntries(this.nodes.map((node) => [node, this.size.get(node)])),", steps: ["return-state"] },
      { number: 192, text: "      components: this.components", steps: ["return-state"] },
      { number: 258, text: "  };", steps: ["return-state"] }
    ]
  },
  stats: [
    {
      label: "Operation",
      value: (step) => step.operationLabel,
      detail: (step) => step.operationIndex === null ? "program boundary" : `${step.operationIndex + 1} of ${step.operationCount}`
    },
    {
      label: "Find path",
      value: (step) => step.pathLength === 0 ? "-" : String(step.pathLength),
      detail: (step) => step.root === null ? "no active find" : `root ${step.root}`
    },
    {
      label: "Components",
      accent: true,
      value: (step) => String(step.components),
      detail: () => "successful unions reduce this"
    },
    {
      label: "Observations",
      value: (step) => `${step.observationCount}/${step.operationCount}`,
      detail: (step) => step.compressedCount === 0 ? "program results" : `${step.compressedCount} compressed now`
    }
  ],
  complexity: {
    chip: "WEIGHT + COMPRESSION",
    time: "O(alpha(n)) amortized",
    space: "O(n)",
    explanation: "Union by size limits tree growth and path compression flattens traversed paths. Across a sequence, each operation has near-constant inverse-Ackermann amortized cost."
  },
  guide: {
    heading: "Find the roots first; only roots are linked."
  },
  legend: [
    { kind: "root", label: "component root" },
    { kind: "find-path", label: "parent path" },
    { kind: "compressed", label: "rewired to root" },
    { kind: "union-root", label: "larger root" },
    { kind: "attached", label: "smaller root attached" }
  ],
  reflection: {
    eyebrow: "BEFORE YOU MOVE ON",
    title: "Why do both optimizations matter?",
    body: "Union by size prevents tall trees from forming quickly; path compression repairs paths that are traversed. Explain how their effects reinforce one another across later operations."
  }
};
