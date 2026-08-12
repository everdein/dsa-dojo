import {
  formatMemoizedFibonacciInput,
  maximumMemoizedFibonacciInput,
  memoizedFibonacci,
  parseMemoizedFibonacciInput
} from "../../../dynamic-programming/memoized-fibonacci.mjs";
import { buildMemoizedFibonacciTrace } from "../memoized-fibonacci.mjs";

export const memoizedFibonacciLesson = {
  id: "dynamic-programming/memoized-fibonacci",
  order: 50,
  topic: "Dynamic Programming",
  prerequisites: ["recursion/recursive-fibonacci"],
  patterns: ["dynamic-programming", "memoization", "overlapping-subproblems"],
  catalogLabel: "Memoized Fibonacci",
  catalogDescription: "Cache recursive results so repeated subproblems become constant-time lookups.",
  title: "Replace repeated Fibonacci subtrees with memo hits",
  summary: "Keep the familiar recursive recurrence, but store each result by n. Later calls with the same n return from the memo table instead of rebuilding an identical subtree.",
  views: [
    { id: "calls", renderer: "branching", heading: "Memoized call tree" },
    { id: "memo", renderer: "lookup", heading: "Memo table" }
  ],
  input: {
    heading: "Your Fibonacci input",
    fields: [{
      id: "value",
      label: `Enter a whole number from 0 to ${maximumMemoizedFibonacciInput}`,
      type: "number",
      inputMode: "numeric",
      min: "0",
      max: String(maximumMemoizedFibonacciInput),
      step: "1"
    }],
    help: "The input matches the L43 bound so the memoized work count can be compared directly with the complete naive call tree.",
    defaultValue: { value: 6 },
    sampleValue: { value: 5 },
    parse: ({ value }) => ({ value: parseMemoizedFibonacciInput(value) }),
    serialize: ({ value }) => ({ value: formatMemoizedFibonacciInput(value) })
  },
  solve: ({ value }) => memoizedFibonacci(value),
  buildTrace: ({ value }) => buildMemoizedFibonacciTrace(value),
  code: {
    title: "Cache each distinct recursive result",
    filename: "memoized-fibonacci.mjs",
    sourcePath: "dynamic-programming/memoized-fibonacci.mjs",
    lines: [
      { number: 35, text: "export function memoizedFibonacci(value) {", steps: ["function"] },
      { number: 37, text: "  const memo = new Map();", steps: ["initialize"] },
      { number: 39, text: "  function visit(current) {", steps: ["function"] },
      { number: 40, text: "    if (memo.has(current)) return memo.get(current);", steps: ["check-cache", "return-cached"] },
      { number: 42, text: "    if (current <= 1) {", steps: ["check-base"] },
      { number: 43, text: "      memo.set(current, current);", steps: ["store-base"] },
      { number: 47, text: "    const result = visit(current - 1) + visit(current - 2);", steps: ["recurse", "combine"] },
      { number: 48, text: "    memo.set(current, result);", steps: ["store-result"] },
      { number: 49, text: "    return result;", steps: ["return-result"] },
      { number: 52, text: "  return visit(value);", steps: ["return-result"] },
      { number: 53, text: "}", steps: ["function"] }
    ]
  },
  stats: [
    {
      label: "Current n",
      value: (step) => step.currentValue === null ? "-" : String(step.currentValue),
      detail: (step) => step.currentValue === null ? "memo starts empty" : `depth ${step.currentDepth}`
    },
    {
      label: "Unique work",
      value: (step) => String(step.computations),
      detail: (step) => `${step.memoSize} memo ${step.memoSize === 1 ? "entry" : "entries"}`
    },
    {
      label: "Calls",
      value: (step) => `${step.memoizedCalls} / ${step.naiveCalls}`,
      detail: () => "memoized / naive L43"
    },
    {
      label: "Cache hits",
      accent: true,
      value: (step) => String(step.cacheHits),
      detail: (step) => step.workSaved === null
        ? "repeated subtrees skipped"
        : `${step.workSaved} calls avoided`
    }
  ],
  complexity: {
    chip: "CACHE OVERLAPPING WORK",
    time: "O(n)",
    space: "O(n)",
    spaceLabel: "memo + call stack",
    explanation: "There are only n + 1 distinct Fibonacci inputs from 0 through n. Each is computed once, later requests are constant-time memo lookups, and the memo table plus deepest recursive path are linear."
  },
  guide: {
    heading: "A cache hit is a leaf, not another repeated subtree."
  },
  legend: [
    { kind: "current", label: "current call" },
    { kind: "waiting", label: "waiting parent" },
    { kind: "returned", label: "computed result" },
    { kind: "cache-hit", label: "returned from memo" },
    { kind: "cached", label: "stored subproblem" }
  ],
  reflection: {
    eyebrow: "BEFORE YOU MOVE ON",
    title: "Why is memoized recursion linear?",
    body: "Compare this tree with L43 for the same n. Identify where a whole repeated subtree became one cache-hit leaf, then explain why only n + 1 distinct keys can ever require computation."
  }
};
