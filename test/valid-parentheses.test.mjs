import test from "node:test";
import assert from "node:assert/strict";
import {
  isValidParentheses,
  maximumParenthesesCharacters,
  validateParenthesesInput
} from "../stacks/valid-parentheses.mjs";
import { buildValidatedTrace } from "../studio/src/lesson-contract.mjs";
import { validParenthesesLesson } from "../studio/src/lessons/valid-parentheses.mjs";
import { buildValidParenthesesTrace } from "../studio/src/valid-parentheses.mjs";

test("valid-parentheses distinguishes nesting, ordering, and unmatched brackets", () => {
  for (const text of ["()", "({[]})", "[ ]", "{}[]()", "((()))"]) {
    assert.equal(isValidParentheses(text), true, text);
  }
  for (const text of ["(", ")", "([)]", "(()", "())", "{[}]"]) {
    assert.equal(isValidParentheses(text), false, text);
  }
});

test("valid-parentheses validates its bounded bracket alphabet", () => {
  for (const value of [undefined, null, "", "   ", "(a)", "🙂", "()".repeat(maximumParenthesesCharacters)]) {
    assert.throws(() => validateParenthesesInput(value));
  }
  assert.equal(validateParenthesesInput("( [ ] )"), "( [ ] )");
});

test("valid-parentheses trace pushes, matches, pops, and completes", () => {
  const trace = buildValidParenthesesTrace("([])");
  assert.ok(trace.some(({ phase }) => phase === "push"));
  assert.ok(trace.some(({ phase }) => phase === "match"));
  assert.ok(trace.some(({ phase }) => phase === "pop"));
  assert.equal(trace.at(-1).result, true);
  assert.equal(trace.at(-1).stackSize, 0);
});

test("valid-parentheses trace stops at the first mismatch and reports leftover openers", () => {
  const mismatch = buildValidParenthesesTrace("([)]");
  assert.ok(mismatch.some(({ phase }) => phase === "mismatch"));
  assert.equal(mismatch.at(-1).result, false);

  const leftover = buildValidParenthesesTrace("((");
  assert.equal(leftover.at(-1).result, false);
  assert.equal(leftover.at(-1).stackSize, 2);
});

test("valid-parentheses lesson satisfies deterministic composite ownership", () => {
  const trace = buildValidatedTrace(validParenthesesLesson, validParenthesesLesson.input.defaultValue);
  assert.equal(trace.at(-1).result, true);
  for (const panel of ["characters", "stack"]) {
    assert.equal(new Set(trace.map((step) => step.views[panel])).size, trace.length, panel);
  }
  for (const property of ["items", "activeItemIds", "changedItemIds", "annotations"]) {
    assert.equal(new Set(trace.map((step) => step.views.stack[property])).size, trace.length, property);
  }
});
