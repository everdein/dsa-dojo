import {
  maximumRecursiveFibonacciInput,
  parseRecursiveFibonacciInput,
  recursiveFibonacci
} from "../../../recursion/fibonacci.mjs";
import { buildRecursiveFibonacciTrace } from "../fibonacci.mjs";

export const recursiveFibonacciLesson = {
  id: "recursion/recursive-fibonacci",
  order: 43,
  topic: "Recursion",
  prerequisites: ["recursion/factorial"],
  patterns: ["recursion", "call-tree", "overlapping-subproblems"],
  catalogLabel: "Recursive Fibonacci",
  catalogDescription: "Expose repeated subproblems in the naive recursive call tree.",
  title: "See repeated work in recursive Fibonacci",
  summary: "Expand each non-base call into fib(n - 1) and fib(n - 2), then watch identical subproblems build identical subtrees again.",
  renderer: "branching",
  input: {
    fields: [{ id: "value", label: `Enter a whole number from 0 to ${maximumRecursiveFibonacciInput}`, type: "number", inputMode: "numeric", min: "0", max: String(maximumRecursiveFibonacciInput), step: "1" }],
    help: "The input is capped at 6 so every recursive call remains visible in the call tree.",
    defaultValue: { value: 6 },
    sampleValue: { value: 5 },
    parse: ({ value }) => ({ value: parseRecursiveFibonacciInput(value) }),
    serialize: ({ value }) => ({ value: String(value) })
  },
  solve: ({ value }) => recursiveFibonacci(value),
  buildTrace: ({ value }) => buildRecursiveFibonacciTrace(value),
  code: {
    title: "Expand two recursive subproblems",
    filename: "fibonacci.mjs",
    sourcePath: "recursion/fibonacci.mjs",
    lines: [
      { number: 17, text: "export function recursiveFibonacci(value) {", steps: ["call-function"] },
      { number: 18, text: "  validateRecursiveFibonacciInput(value);", steps: ["call-function"] },
      { number: 19, text: "  if (value <= 1) return value;", steps: ["check-base", "return-base"] },
      { number: 20, text: "  return recursiveFibonacci(value - 1) + recursiveFibonacci(value - 2);", steps: ["recurse", "combine-return"] },
      { number: 21, text: "}", steps: ["combine-return"] }
    ]
  },
  stats: [
    { label: "Current n", value: (step) => step.currentValue === null ? "-" : String(step.currentValue) },
    { label: "Call depth", value: (step) => String(step.currentDepth), detail: () => "active frames" },
    { label: "Total calls", value: (step) => String(step.calls), detail: () => "tree nodes" },
    { label: "Repeated calls", accent: true, value: (step) => String(step.repeatedCalls), detail: () => "overlapping work" }
  ],
  complexity: {
    chip: "REPEATED SUBPROBLEMS",
    time: "O(2^n)",
    space: "O(n)",
    spaceLabel: "call stack",
    explanation: "The naive recursion recomputes overlapping Fibonacci values and grows an exponential call tree. Only one root-to-leaf path is active at a time, so stack depth is linear."
  },
  guide: { heading: "Equal n values root equal subtrees." },
  legend: [
    { kind: "current", label: "active call" },
    { kind: "waiting", label: "waiting parent" },
    { kind: "repeated", label: "repeated subproblem" },
    { kind: "returned", label: "returned value" }
  ],
  reflection: {
    eyebrow: "BEFORE YOU MOVE ON",
    title: "What should memoization remember?",
    body: "Find two nodes with the same n and compare their subtrees. Explain why caching the first result can replace every later copy with a constant-time lookup."
  }
};
