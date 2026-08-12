import {
  evaluatePostfix,
  formatPostfixProgram,
  maximumPostfixTokens,
  parsePostfixProgram
} from "../../../stacks/evaluate-postfix.mjs";
import { buildEvaluatePostfixTrace } from "../evaluate-postfix.mjs";

export const evaluatePostfixLesson = {
  id: "stacks/evaluate-postfix",
  order: 19,
  topic: "Stacks",
  prerequisites: ["stacks/min-stack"],
  patterns: ["stack", "expression-evaluation"],
  catalogLabel: "Evaluate Postfix",
  catalogDescription: "Evaluate an operator only after both of its operands are ready on a stack.",
  title: "Evaluate postfix expressions with a value stack",
  summary: "Push every operand. When an operator appears, pop its right operand and then its left operand, compute once, and push the result back.",
  renderer: "stack",
  input: {
    heading: "Your postfix program",
    fields: [{
      id: "program",
      label: `Enter 1-${maximumPostfixTokens} whitespace-separated tokens`,
      type: "text",
      inputMode: "text",
      placeholder: "5 1 2 + 4 * + 3 -"
    }],
    help: "Use finite numbers and the operators +, -, *, and /. Spaces separate every token.",
    defaultValue: { tokens: [5, 1, 2, "+", 4, "*", "+", 3, "-"] },
    sampleValue: { tokens: [-3.5, 2, "*", 4, "/"] },
    parse: ({ program }) => ({ tokens: parsePostfixProgram(program) }),
    serialize: ({ tokens }) => ({ program: formatPostfixProgram(tokens) })
  },
  solve: ({ tokens }) => evaluatePostfix(tokens),
  buildTrace: ({ tokens }) => buildEvaluatePostfixTrace(tokens),
  code: {
    title: "Pop right, pop left, then apply",
    filename: "evaluate-postfix.mjs",
    sourcePath: "stacks/evaluate-postfix.mjs",
    lines: [
      { number: 57, text: "export function evaluatePostfix(tokens) {", steps: ["function"] },
      { number: 58, text: "  validatePostfixTokens(tokens);", steps: ["initialize"] },
      { number: 59, text: "  const stack = [];", steps: ["initialize"] },
      { number: 60, text: "  for (let tokenIndex = 0; tokenIndex < tokens.length; tokenIndex += 1) {", steps: ["read-token"] },
      { number: 61, text: "    const token = tokens[tokenIndex];", steps: ["read-token"] },
      { number: 62, text: "    if (typeof token === \"number\") {", steps: ["identify-operand"] },
      { number: 63, text: "      stack.push(token);", steps: ["push-operand"] },
      { number: 66, text: "    if (stack.length < 2) {", steps: ["identify-operator"] },
      { number: 69, text: "    const right = stack.pop();", steps: ["pop-operands"] },
      { number: 70, text: "    const left = stack.pop();", steps: ["pop-operands"] },
      { number: 71, text: "    const result = applyPostfixOperator(left, token, right, tokenIndex);", steps: ["apply-operator"] },
      { number: 72, text: "    stack.push(result);", steps: ["push-result"] },
      { number: 74, text: "  if (stack.length !== 1) {", steps: ["return-result"] },
      { number: 77, text: "  return stack[0];", steps: ["return-result"] },
      { number: 78, text: "}", steps: ["function"] }
    ]
  },
  stats: [
    {
      label: "Current token",
      value: (step) => formatToken(step.token),
      detail: (step) => step.tokenIndex === null ? "program boundary" : `token ${step.tokenIndex + 1} of ${step.tokenCount}`
    },
    {
      label: "Stack depth",
      value: (step) => String(step.stackSize),
      detail: () => "values waiting"
    },
    {
      label: "Operand order",
      value: (step) => step.leftOperand === null ? "-" : `${formatToken(step.leftOperand)} then ${formatToken(step.rightOperand)}`,
      detail: () => "left, then right"
    },
    {
      label: "Computed value",
      accent: true,
      value: (step) => formatToken(step.computedValue),
      detail: (step) => step.phase === "complete" ? "final result" : "current operation"
    }
  ],
  complexity: {
    chip: "LAST IN, FIRST OUT",
    time: "O(n)",
    space: "O(n)",
    explanation: "Each token is read once and each intermediate value is pushed and popped at most once. An operand-only prefix can fill the stack linearly."
  },
  guide: {
    heading: "The first value popped is the right operand."
  },
  legend: [
    { kind: "operand", label: "input operand" },
    { kind: "result", label: "intermediate result" },
    { kind: "active", label: "current operand pair" },
    { kind: "changed", label: "pushed or revealed" }
  ],
  reflection: {
    eyebrow: "BEFORE YOU MOVE ON",
    title: "Why does operand order matter even without parentheses?",
    body: "Compare 7 2 - with the values in the order they are popped. Explain why the top value is the right operand, and why reversing the pops changes subtraction and division."
  }
};

function formatToken(token) {
  if (token === null || token === undefined) return "-";
  return typeof token === "number" && Object.is(token, -0) ? "-0" : String(token);
}
