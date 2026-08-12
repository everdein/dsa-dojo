import {
  factorial,
  formatFactorialInput,
  maximumFactorialInput,
  parseFactorialInput
} from "../../../recursion/factorial.mjs";
import { formatNumber } from "../input.mjs";
import { buildFactorialTrace } from "../factorial.mjs";

export const factorialLesson = {
  id: "recursion/factorial",
  order: 42,
  topic: "Recursion",
  prerequisites: ["stacks/valid-parentheses"],
  patterns: ["recursion", "call-stack"],
  catalogLabel: "Factorial and the Recursive Call Stack",
  catalogDescription: "Identify the base case, recursive descent, and return-value unwinding.",
  title: "Compute factorial through recursive calls",
  summary: "Each non-base call waits for factorial(n - 1). The base case returns 1, then suspended frames resume in reverse order and multiply their arguments into the result.",
  renderer: "stack",
  input: {
    heading: "Your factorial input",
    fields: [{
      id: "value",
      label: `Enter a whole number from 0 through ${maximumFactorialInput}`,
      type: "number",
      inputMode: "numeric",
      min: 0,
      max: maximumFactorialInput
    }],
    help: "The bounded input keeps every result exact and the visual call stack compact. Both 0! and 1! use the base value 1.",
    defaultValue: { value: 5 },
    sampleValue: { value: 0 },
    parse: ({ value }) => ({ value: parseFactorialInput(value) }),
    serialize: ({ value }) => ({ value: formatFactorialInput(value) })
  },
  solve: ({ value }) => factorial(value),
  buildTrace: ({ value }) => buildFactorialTrace(value),
  code: {
    title: "Descend to the base case, then multiply while returning",
    filename: "factorial.mjs",
    sourcePath: "recursion/factorial.mjs",
    lines: [
      { number: 30, text: "export function factorial(value) {", steps: ["initialize", "call-function"] },
      { number: 31, text: "  validateFactorialInput(value);", steps: ["validate"] },
      { number: 32, text: "  if (value <= 1) return 1;", steps: ["check-base", "return-base", "return-result"] },
      { number: 33, text: "  const smallerFactorial = factorial(value - 1);", steps: ["recursive-call"] },
      { number: 34, text: "  return value * smallerFactorial;", steps: ["multiply-return", "return-result"] },
      { number: 35, text: "}", steps: ["call-function"] }
    ]
  },
  stats: [
    {
      label: "Current argument",
      value: (step) => step.currentArgument === null ? "-" : String(step.currentArgument)
    },
    {
      label: "Stack depth",
      value: (step) => String(step.stackDepth),
      detail: (step) => `maximum ${step.maximumDepth}`
    },
    {
      label: "Multiplications",
      value: (step) => String(step.multiplications),
      detail: () => "during unwinding"
    },
    {
      label: "Returned value",
      accent: true,
      value: (step) => step.returnedValue === null ? "-" : formatNumber(step.returnedValue),
      detail: (step) => `${step.callsMade} ${step.callsMade === 1 ? "call" : "calls"}`
    }
  ],
  complexity: {
    chip: "BASE CASE → UNWIND",
    time: "O(n)",
    space: "O(n)",
    explanation: "The argument decreases by one until it reaches 1 or 0, so there are O(n) calls and O(n) suspended frames. Each returning non-base frame performs one multiplication."
  },
  guide: {
    heading: "Every recursive call must promise how it will stop."
  },
  legend: [
    { kind: "active", label: "current call" },
    { kind: "waiting", label: "waiting for child" },
    { kind: "base-case", label: "returns 1" },
    { kind: "returning", label: "multiplying return" }
  ],
  reflection: {
    eyebrow: "BEFORE YOU MOVE ON",
    title: "Why do multiplications happen in reverse call order?",
    body: "Try 0, 1, and a larger input. Explain why factorial(n) cannot multiply until factorial(n - 1) returns, and why removing the base case would prevent unwinding."
  }
};
