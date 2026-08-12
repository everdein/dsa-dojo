import {
  isValidParentheses,
  maximumParenthesesCharacters,
  validateParenthesesInput
} from "../../../stacks/valid-parentheses.mjs";
import { buildValidParenthesesTrace } from "../valid-parentheses.mjs";

export const validParenthesesLesson = {
  id: "stacks/valid-parentheses",
  order: 17,
  topic: "Stacks",
  prerequisites: ["strings/valid-palindrome"],
  patterns: ["stack", "nesting"],
  catalogLabel: "Valid Parentheses",
  catalogDescription: "Match each closer with the most recent unmatched opener.",
  title: "Validate nested brackets with a stack",
  summary: "Push opening brackets. Every closer must match the opener on top, and a valid sequence must finish with nothing left unmatched.",
  views: [
    { id: "characters", renderer: "sequence", heading: "Bracket sequence" },
    { id: "stack", renderer: "stack", heading: "Unmatched openers" }
  ],
  input: {
    heading: "Your bracket sequence",
    fields: [{
      id: "text",
      label: `Enter 1-${maximumParenthesesCharacters} brackets`,
      type: "text",
      inputMode: "text",
      placeholder: "({[]})"
    }],
    help: "Use parentheses, square brackets, curly braces, and optional whitespace.",
    defaultValue: { text: "({[]})" },
    sampleValue: { text: "([)]" },
    parse: ({ text }) => {
      const value = String(text ?? "");
      validateParenthesesInput(value);
      return { text: value };
    },
    serialize: ({ text }) => ({ text })
  },
  solve: ({ text }) => isValidParentheses(text),
  buildTrace: ({ text }) => buildValidParenthesesTrace(text),
  code: {
    title: "Match against the top opener",
    filename: "valid-parentheses.mjs",
    sourcePath: "stacks/valid-parentheses.mjs",
    lines: [
      { number: 25, text: "export function isValidParentheses(text) {", steps: ["function"] },
      { number: 26, text: "  validateParenthesesInput(text);", steps: ["initialize"] },
      { number: 27, text: "  const stack = [];", steps: ["initialize"] },
      { number: 28, text: "  for (const character of Array.from(text)) {", steps: ["scan"] },
      { number: 29, text: "    if (/^\\s$/u.test(character)) continue;", steps: ["skip-space"] },
      { number: 30, text: "    if (!matchingOpener.has(character)) {", steps: ["scan"] },
      { number: 31, text: "      stack.push(character);", steps: ["push-opener"] },
      { number: 32, text: "      continue;", steps: ["push-opener"] },
      { number: 33, text: "    }", steps: ["check-closer"] },
      { number: 34, text: "    if (stack.pop() !== matchingOpener.get(character)) return false;", steps: ["check-closer", "pop-match", "return-false"] },
      { number: 35, text: "  }", steps: ["scan"] },
      { number: 36, text: "  return stack.length === 0;", steps: ["return-empty", "return-false"] },
      { number: 37, text: "}", steps: ["function"] }
    ]
  },
  stats: [
    {
      label: "Current position",
      value: (step) => step.currentIndex === null ? "-" : String(step.currentIndex),
      detail: () => "raw character index"
    },
    {
      label: "Stack size",
      value: (step) => String(step.stackSize),
      detail: () => "unmatched openers"
    },
    {
      label: "Pairs matched",
      value: (step) => String(step.pairs),
      detail: () => "correctly nested pairs"
    },
    {
      label: "Still valid?",
      accent: true,
      value: (step) => step.valid ? "yes" : "no",
      detail: (step) => step.phase === "complete" ? "final result" : "so far"
    }
  ],
  complexity: {
    chip: "LAST IN, FIRST OUT",
    time: "O(n)",
    space: "O(n)",
    explanation: "Each bracket is pushed or matched once. In the all-openers case, the stack stores every meaningful character."
  },
  guide: {
    heading: "The newest opener must close first."
  },
  legend: [
    { kind: "current", label: "current character" },
    { kind: "waiting", label: "unmatched opener" },
    { kind: "matched", label: "matching top" },
    { kind: "mismatch", label: "invalid closer" }
  ],
  reflection: {
    eyebrow: "BEFORE YOU MOVE ON",
    title: "Why is counting brackets not enough?",
    body: "Compare ([)] with ([]). Both have balanced counts, but only one respects nesting. Explain how the stack preserves the order that counts lose."
  }
};
