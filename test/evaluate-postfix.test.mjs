import test from "node:test";
import assert from "node:assert/strict";
import {
  evaluatePostfix,
  formatPostfixProgram,
  maximumPostfixTokens,
  parsePostfixProgram,
  validatePostfixTokens
} from "../stacks/evaluate-postfix.mjs";
import {
  assertLesson,
  assertTrace,
  buildValidatedTrace
} from "../studio/src/lesson-contract.mjs";
import { buildEvaluatePostfixTrace } from "../studio/src/evaluate-postfix.mjs";
import { evaluatePostfixLesson } from "../studio/src/lessons/evaluate-postfix.mjs";

test("postfix evaluation preserves operand order and supports every operator", () => {
  assert.equal(evaluatePostfix([2, 3, "+"]), 5);
  assert.equal(evaluatePostfix([7, 2, "-"]), 5);
  assert.equal(evaluatePostfix([8, 2, "/"]), 4);
  assert.equal(evaluatePostfix([-3.5, 2, "*"]), -7);
  assert.equal(evaluatePostfix([5, 1, 2, "+", 4, "*", "+", 3, "-"]), 14);
  assert.equal(evaluatePostfix([3]), 3);
});

test("postfix parser accepts finite decimal tokens and serializes deterministically", () => {
  const tokens = parsePostfixProgram("  -3.5  2 * 4 /  ");
  assert.deepEqual(tokens, [-3.5, 2, "*", 4, "/"]);
  assert.equal(formatPostfixProgram(tokens), "-3.5 2 * 4 /");
  assert.deepEqual(parsePostfixProgram("-0 1e2 +"), [-0, 100, "+"]);
  assert.equal(formatPostfixProgram([-0, 100, "+"]), "-0 100 +");
});

test("postfix validation rejects missing, sparse, malformed, and oversized tokens", () => {
  for (const tokens of [undefined, null, [], [1, "^"], [1, Infinity], [1, "2", "+"]]) {
    assert.throws(() => validatePostfixTokens(tokens));
  }
  const sparse = [1, 2, "+"];
  delete sparse[1];
  assert.throws(() => validatePostfixTokens(sparse), /Token 2/);
  assert.throws(
    () => validatePostfixTokens(Array.from({ length: maximumPostfixTokens + 1 }, () => 1)),
    /fewer/
  );
  for (const program of [undefined, "", "   ", "1 nope +", "NaN 1 +", "Infinity 1 +", "1e309 1 +"]) {
    assert.throws(() => parsePostfixProgram(program));
  }
});

test("postfix evaluation reports controlled arity, division, and overflow errors", () => {
  assert.throws(() => evaluatePostfix([2, "+"]), /requires two operands/);
  assert.throws(() => evaluatePostfix(["+"]), /requires two operands/);
  assert.throws(() => evaluatePostfix([1, 2]), /2 operands instead of one result/);
  assert.throws(() => evaluatePostfix([1, 0, "/"]), /Division by zero/);
  assert.throws(() => evaluatePostfix([1, -0, "/"]), /Division by zero/);
  assert.throws(() => evaluatePostfix([Number.MAX_VALUE, 2, "*"]), /non-finite result/);
});

test("postfix solver and trace do not mutate token input", () => {
  const tokens = [7, 2, "-", 3, "*"];
  const before = structuredClone(tokens);
  assert.equal(evaluatePostfix(tokens), 15);
  buildEvaluatePostfixTrace(tokens);
  assert.deepEqual(tokens, before);
});

test("postfix trace reads, pushes, pops in right-left order, and pushes results", () => {
  const trace = buildEvaluatePostfixTrace([7, 2, "-"]);
  assert.deepEqual(trace.map(({ phase }) => phase), [
    "initialize",
    "read-operand",
    "push-operand",
    "read-operand",
    "push-operand",
    "read-operator",
    "pop-operands",
    "push-result",
    "complete"
  ]);
  const operator = trace.find(({ phase }) => phase === "read-operator");
  assert.equal(operator.leftOperand, 7);
  assert.equal(operator.rightOperand, 2);
  assert.deepEqual(operator.view.annotations.map(({ label }) => label), ["left operand", "right operand"]);
  const pushed = trace.find(({ phase }) => phase === "push-result");
  assert.equal(pushed.computedValue, 5);
  assert.equal(pushed.view.items.at(-1).id, "item-2");
  assert.equal(trace.at(-1).result, 5);
});

test("postfix trace keeps stable IDs while allocating fresh rewind snapshots", () => {
  const trace = buildValidatedTrace(evaluatePostfixLesson, { tokens: [2, 3, "+"] });
  const firstPush = trace.find(({ phase, tokenIndex }) => phase === "push-operand" && tokenIndex === 0);
  const secondPush = trace.find(({ phase, tokenIndex }) => phase === "push-operand" && tokenIndex === 1);
  const readOperator = trace.find(({ phase }) => phase === "read-operator");
  assert.equal(firstPush.view.items[0].id, "item-0");
  assert.equal(secondPush.view.items[0].id, "item-0");
  assert.equal(readOperator.view.items[0].id, "item-0");
  assert.notEqual(firstPush.view.items[0], secondPush.view.items[0]);

  for (const property of ["items", "activeItemIds", "changedItemIds", "annotations"]) {
    assert.equal(new Set(trace.map((step) => step.view[property])).size, trace.length, property);
  }
});

test("postfix lesson satisfies the full legacy stack lesson contract", () => {
  assert.equal(assertLesson(evaluatePostfixLesson), evaluatePostfixLesson);
  const trace = buildValidatedTrace(evaluatePostfixLesson, evaluatePostfixLesson.input.defaultValue);
  assert.equal(assertTrace(trace, evaluatePostfixLesson), trace);
  assert.equal(trace.at(-1).result, 14);
  assert.deepEqual(evaluatePostfixLesson.prerequisites, ["stacks/min-stack"]);
  assert.deepEqual(evaluatePostfixLesson.patterns, ["stack", "expression-evaluation"]);
  assert.deepEqual(
    evaluatePostfixLesson.input.parse(evaluatePostfixLesson.input.serialize({ tokens: [2, 3, "+"] })),
    { tokens: [2, 3, "+"] }
  );
});

test("postfix trace rejects shared mutable stack snapshots", () => {
  const trace = buildEvaluatePostfixTrace([2, 3, "+"]);
  trace[1].view.items = trace[0].view.items;
  assert.throws(() => assertTrace(trace, evaluatePostfixLesson), /items snapshot/);
});
