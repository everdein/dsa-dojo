import {
  formatConnectivityProgram,
  maximumConnectivityOperations,
  parseConnectivityProgram,
  runConnectivityQueries
} from "../../../disjoint-sets/connectivity-queries.mjs";
import {
  formatUnionFindNodes,
  maximumUnionFindNodes,
  parseUnionFindNodes
} from "../../../disjoint-sets/union-find.mjs";
import { buildConnectivityQueriesTrace } from "../connectivity-queries.mjs";

export const connectivityQueriesLesson = {
  id: "disjoint-sets/connectivity-queries",
  order: 38,
  topic: "Disjoint Sets",
  prerequisites: ["disjoint-sets/union-find-fundamentals"],
  patterns: ["union-find", "path-compression", "union-by-size", "connectivity-query"],
  catalogLabel: "Connectivity Queries",
  catalogDescription: "Answer whether pairs share a representative while weighted unions and path compression keep future queries fast.",
  title: "Answer dynamic connectivity queries",
  summary: "Union joins two components by size. Connected finds both representatives, compresses the traversed parent paths, and compares the roots.",
  views: [
    { id: "forest", renderer: "graph", heading: "Directed parent forest" },
    { id: "parents", renderer: "lookup", heading: "Parent table" }
  ],
  input: {
    heading: "Your dynamic connectivity program",
    fields: [
      {
        id: "nodes",
        label: `Enter 1-${maximumUnionFindNodes} unique node labels`,
        type: "text",
        inputMode: "text",
        placeholder: "A, B, C, D, E"
      },
      {
        id: "operations",
        label: `Enter 1-${maximumConnectivityOperations} union/connected operations`,
        type: "text",
        inputMode: "text",
        placeholder: "union A B, connected B C, union B C"
      }
    ],
    help: "Labels start with a letter and contain letters, numbers, or hyphens. Use union A B or connected A B, separated by commas.",
    defaultValue: {
      nodes: ["A", "B", "C", "D", "E"],
      operations: [
        { type: "union", left: "A", right: "B" },
        { type: "union", left: "C", right: "D" },
        { type: "union", left: "A", right: "C" },
        { type: "connected", left: "D", right: "B" },
        { type: "connected", left: "D", right: "E" },
        { type: "union", left: "E", right: "A" },
        { type: "connected", left: "E", right: "B" },
        { type: "union", left: "B", right: "D" }
      ]
    },
    sampleValue: {
      nodes: ["A", "B", "C", "D"],
      operations: [
        { type: "connected", left: "A", right: "B" },
        { type: "union", left: "A", right: "B" },
        { type: "connected", left: "A", right: "B" },
        { type: "union", left: "C", right: "D" },
        { type: "connected", left: "B", right: "D" }
      ]
    },
    parse: ({ nodes, operations }) => {
      const parsedNodes = parseUnionFindNodes(nodes);
      return {
        nodes: parsedNodes,
        operations: parseConnectivityProgram(operations, parsedNodes)
      };
    },
    serialize: ({ nodes, operations }) => ({
      nodes: formatUnionFindNodes(nodes),
      operations: formatConnectivityProgram(operations, nodes)
    })
  },
  solve: ({ nodes, operations }) => runConnectivityQueries(nodes, operations),
  buildTrace: buildConnectivityQueriesTrace,
  code: {
    title: "Find, compress, compare, and join by size",
    filename: "connectivity-queries.mjs",
    sourcePath: "disjoint-sets/connectivity-queries.mjs",
    lines: [
      { number: 87, text: "export function runConnectivityQueries(nodes, operations) {", steps: ["function"] },
      { number: 88, text: "  validateConnectivityInput(nodes, operations);", steps: ["initialize"] },
      { number: 89, text: "  const unionFind = new UnionFind(nodes);", steps: ["initialize"] },
      { number: 90, text: "  const answers = [];", steps: ["initialize"] },
      { number: 92, text: "  for (let operationIndex = 0; operationIndex < operations.length; operationIndex += 1) {", steps: ["find-root"] },
      { number: 93, text: "    const operation = operations[operationIndex];", steps: ["find-root"] },
      { number: 94, text: "    if (operation.type === \"union\") {", steps: ["compare-sizes"] },
      { number: 95, text: "      unionFind.unionWithDetails(operation.left, operation.right);", steps: ["find-root", "compress-path", "compare-sizes", "attach-smaller", "already-connected"] },
      { number: 99, text: "    const leftRoot = unionFind.findWithDetails(operation.left).root;", steps: ["find-root", "compress-path"] },
      { number: 100, text: "    const rightRoot = unionFind.findWithDetails(operation.right).root;", steps: ["find-root", "compress-path"] },
      { number: 101, text: "    answers.push({", steps: ["record-answer"] },
      { number: 105, text: "      connected: leftRoot === rightRoot", steps: ["compare-roots"] },
      { number: 109, text: "  return {", steps: ["return-result"] },
      { number: 110, text: "    answers,", steps: ["return-result"] },
      { number: 111, text: "    final: unionFind.snapshot()", steps: ["return-result"] },
      { number: 113, text: "}", steps: ["function"] }
    ]
  },
  stats: [
    {
      label: "Operation",
      value: (step) => step.operationLabel,
      detail: (step) => step.operationIndex === null
        ? "program boundary"
        : `${step.operationIndex + 1} of ${step.operationCount}`
    },
    {
      label: "Find path",
      value: (step) => step.pathLength === 0 ? "-" : String(step.pathLength),
      detail: (step) => step.root === null ? "no active find" : `representative ${step.root}`
    },
    {
      label: "Components",
      value: (step) => String(step.components),
      detail: (step) => step.winningRoot === null
        ? "successful unions reduce this"
        : `root ${step.winningRoot} has size ${step.winningSize}`
    },
    {
      label: "Answers",
      accent: true,
      value: (step) => String(step.answerCount),
      detail: (step) => step.answers.length === 0
        ? "none yet"
        : latestAnswer(step.answers.at(-1))
    }
  ],
  complexity: {
    chip: "DYNAMIC CONNECTIVITY",
    time: "O((n + m) alpha(n))",
    space: "O(n + q)",
    explanation: "Initialization touches n nodes. Across m weighted unions and connectivity queries, path compression plus union by size gives near-constant inverse-Ackermann amortized work; parent state and q answers use O(n + q) space."
  },
  guide: {
    heading: "Representatives answer the query; compression improves the next one."
  },
  legend: [
    { kind: "root", label: "component representative" },
    { kind: "find-path", label: "parent path before compression" },
    { kind: "compressed", label: "rewired directly to root" },
    { kind: "union-root", label: "larger root" },
    { kind: "attached", label: "smaller root attached" },
    { kind: "connected", label: "same representative" },
    { kind: "separate", label: "different representatives" }
  ],
  reflection: {
    eyebrow: "BEFORE YOU MOVE ON",
    title: "What work does a query save for the future?",
    body: "Repeat a connected query after it compresses a multi-edge path, reverse the operands of a weighted union, and query a node against itself. Explain what changes in the forest and what must stay logically equivalent."
  }
};

function latestAnswer(answer) {
  return `${answer.left} and ${answer.right}: ${answer.connected ? "connected" : "separate"}`;
}
