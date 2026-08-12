import {
  applyPostfixOperator,
  evaluatePostfix,
  validatePostfixTokens
} from "../../stacks/evaluate-postfix.mjs";
import { formatNumber } from "./input.mjs";

export { evaluatePostfix };

export function buildEvaluatePostfixTrace(tokens) {
  validatePostfixTokens(tokens);

  const trace = [];
  const stack = [];

  trace.push(createStep({
    trace,
    phase: "initialize",
    codeSteps: ["initialize"],
    tokenCount: tokens.length,
    tokenIndex: null,
    token: null,
    stack,
    narration: "Start with an empty stack. Each number will wait here until an operator consumes it.",
    prompt: "What should happen when the first operand is read?"
  }));

  for (let tokenIndex = 0; tokenIndex < tokens.length; tokenIndex += 1) {
    const token = tokens[tokenIndex];
    if (typeof token === "number") {
      trace.push(createStep({
        trace,
        phase: "read-operand",
        codeSteps: ["read-token", "identify-operand"],
        tokenCount: tokens.length,
        tokenIndex,
        token,
        stack,
        narration: `${formatNumber(token)} is an operand, so it belongs on the stack.`,
        prompt: "Where will this operand sit relative to the current top?"
      }));

      const item = { id: `item-${tokenIndex}`, value: token, state: "operand" };
      stack.push(item);
      trace.push(createStep({
        trace,
        phase: "push-operand",
        codeSteps: ["push-operand"],
        tokenCount: tokens.length,
        tokenIndex,
        token,
        stack,
        activeItemIds: [item.id],
        changedItemIds: [item.id],
        annotations: [{ itemId: item.id, label: "operand pushed" }],
        narration: `Push ${formatNumber(token)}. It is now the top operand.`,
        prompt: "Which future operator will be allowed to consume this value?"
      }));
      continue;
    }

    if (stack.length < 2) {
      throw new Error(`Operator ${token} at token ${tokenIndex + 1} requires two operands.`);
    }
    const rightItem = stack.at(-1);
    const leftItem = stack.at(-2);
    const result = applyPostfixOperator(leftItem.value, token, rightItem.value, tokenIndex);

    trace.push(createStep({
      trace,
      phase: "read-operator",
      codeSteps: ["read-token", "identify-operator"],
      tokenCount: tokens.length,
      tokenIndex,
      token,
      stack,
      leftOperand: leftItem.value,
      rightOperand: rightItem.value,
      activeItemIds: [leftItem.id, rightItem.id],
      annotations: [
        { itemId: leftItem.id, label: "left operand" },
        { itemId: rightItem.id, label: "right operand" }
      ],
      narration: `${token} consumes the top two values in left-then-right expression order: ${formatNumber(leftItem.value)} ${token} ${formatNumber(rightItem.value)}.`,
      prompt: "Why must the top value become the right operand?"
    }));

    stack.pop();
    stack.pop();
    const revealedItem = stack.at(-1) ?? null;
    trace.push(createStep({
      trace,
      phase: "pop-operands",
      codeSteps: ["pop-operands"],
      tokenCount: tokens.length,
      tokenIndex,
      token,
      stack,
      leftOperand: leftItem.value,
      rightOperand: rightItem.value,
      computedValue: result,
      activeItemIds: revealedItem ? [revealedItem.id] : [],
      changedItemIds: revealedItem ? [revealedItem.id] : [],
      annotations: revealedItem ? [{ itemId: revealedItem.id, label: "revealed after pop" }] : [],
      narration: `Pop right operand ${formatNumber(rightItem.value)}, then left operand ${formatNumber(leftItem.value)}.`,
      prompt: `What value should ${formatNumber(leftItem.value)} ${token} ${formatNumber(rightItem.value)} produce?`
    }));

    const resultItem = { id: `item-${tokenIndex}`, value: result, state: "result" };
    stack.push(resultItem);
    trace.push(createStep({
      trace,
      phase: "push-result",
      codeSteps: ["apply-operator", "push-result"],
      tokenCount: tokens.length,
      tokenIndex,
      token,
      stack,
      leftOperand: leftItem.value,
      rightOperand: rightItem.value,
      computedValue: result,
      activeItemIds: [resultItem.id],
      changedItemIds: [resultItem.id],
      annotations: [{
        itemId: resultItem.id,
        label: `${formatNumber(leftItem.value)} ${token} ${formatNumber(rightItem.value)}`
      }],
      narration: `Compute ${formatNumber(leftItem.value)} ${token} ${formatNumber(rightItem.value)} = ${formatNumber(result)}, then push the result.`,
      prompt: "How can this result participate in the next operation?"
    }));
  }

  if (stack.length !== 1) {
    throw new Error(`Postfix program ended with ${stack.length} operands instead of one result.`);
  }

  const result = stack[0].value;
  trace.push({
    ...createStep({
      trace,
      phase: "complete",
      codeSteps: ["return-result"],
      tokenCount: tokens.length,
      tokenIndex: null,
      token: null,
      stack,
      computedValue: result,
      activeItemIds: [stack[0].id],
      annotations: [{ itemId: stack[0].id, label: "final result" }],
      narration: `All tokens are consumed and exactly one value remains: ${formatNumber(result)}.`,
      prompt: "Why must a well-formed postfix program finish with exactly one stack item?"
    }),
    result
  });

  return trace;
}

function createStep({
  trace,
  phase,
  codeSteps,
  tokenCount,
  tokenIndex,
  token,
  stack,
  narration,
  prompt,
  leftOperand = null,
  rightOperand = null,
  computedValue = null,
  activeItemIds = [],
  changedItemIds = [],
  annotations = []
}) {
  const items = stack.map((item) => ({ ...item }));
  return {
    step: trace.length,
    phase,
    codeSteps,
    tokenCount,
    tokenIndex,
    token,
    tokensProcessed: tokenIndex === null ? (phase === "complete" ? tokenCount : 0) : tokenIndex + 1,
    stackSize: items.length,
    leftOperand,
    rightOperand,
    computedValue,
    view: {
      structure: "stack",
      items,
      topItemId: items.at(-1)?.id ?? null,
      activeItemIds: [...activeItemIds],
      changedItemIds: [...changedItemIds],
      annotations: annotations.map((annotation) => ({ ...annotation }))
    },
    narration,
    prompt
  };
}
