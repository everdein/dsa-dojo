import {
  runMinStack,
  validateMinStackOperations
} from "../../stacks/min-stack.mjs";
import { formatNumber } from "./input.mjs";

export { runMinStack };

export function buildMinStackTrace(operations) {
  validateMinStackOperations(operations);

  const trace = [];
  const stack = [];
  const outputs = [];
  let lastOutput = null;

  trace.push(createStep({
    trace,
    phase: "initialize",
    codeSteps: ["initialize"],
    operations,
    operationIndex: null,
    operation: null,
    stack,
    outputs,
    lastOutput,
    narration: "Start with an empty augmented stack. Every pushed item will store both its value and the minimum at that depth.",
    prompt: "Prediction: what minimum should the first pushed item store?"
  }));

  for (let operationIndex = 0; operationIndex < operations.length; operationIndex += 1) {
    const operation = operations[operationIndex];

    if (operation.type === "push") {
      const previousMinimum = stack.at(-1)?.minimum;
      const item = {
        id: `item-${operationIndex}`,
        value: operation.value,
        minimum: previousMinimum === undefined
          ? operation.value
          : Math.min(previousMinimum, operation.value)
      };
      stack.push(item);
      lastOutput = null;
      trace.push(createStep({
        trace,
        phase: "push",
        codeSteps: ["read-operation", "compute-minimum", "push-item"],
        operations,
        operationIndex,
        operation,
        stack,
        outputs,
        lastOutput,
        activeItemIds: [item.id],
        changedItemIds: [item.id],
        annotations: [{
          itemId: item.id,
          label: previousMinimum === undefined
            ? "first value sets minimum"
            : item.minimum < previousMinimum || Object.is(item.minimum, -0) && Object.is(previousMinimum, 0)
              ? "new minimum"
              : "minimum carried forward"
        }],
        narration: previousMinimum === undefined
          ? `Push ${formatNumber(item.value)}. As the first item, it stores minimum ${formatNumber(item.minimum)}.`
          : `Push ${formatNumber(item.value)} with minimum ${formatNumber(item.minimum)}, the smaller of the new value and the previous minimum ${formatNumber(previousMinimum)}.`,
        prompt: "How can the top item now answer min without scanning below it?"
      }));
      continue;
    }

    if (operation.type === "min") {
      lastOutput = {
        operationIndex,
        type: "min",
        value: stack.at(-1).minimum
      };
      outputs.push(lastOutput);
      trace.push(createStep({
        trace,
        phase: "min",
        codeSteps: ["read-operation", "read-minimum", "record-output"],
        operations,
        operationIndex,
        operation,
        stack,
        outputs,
        lastOutput,
        activeItemIds: [stack.at(-1).id],
        annotations: [{
          itemId: stack.at(-1).id,
          label: `minimum ${formatNumber(lastOutput.value)}`
        }],
        narration: `Read minimum ${formatNumber(lastOutput.value)} directly from the top augmented item.`,
        prompt: "Why does this take constant time regardless of stack height?"
      }));
      continue;
    }

    const popped = stack.pop();
    lastOutput = {
      operationIndex,
      type: "pop",
      value: popped.value
    };
    outputs.push(lastOutput);
    const revealed = stack.at(-1) ?? null;
    trace.push(createStep({
      trace,
      phase: "pop",
      codeSteps: ["read-operation", "pop-item", "record-output"],
      operations,
      operationIndex,
      operation,
      stack,
      outputs,
      lastOutput,
      poppedValue: popped.value,
      poppedMinimum: popped.minimum,
      activeItemIds: revealed ? [revealed.id] : [],
      changedItemIds: revealed ? [revealed.id] : [],
      annotations: revealed ? [{
        itemId: revealed.id,
        label: `minimum restored to ${formatNumber(revealed.minimum)}`
      }] : [],
      narration: revealed
        ? `Pop ${formatNumber(popped.value)}. The previous top is revealed with minimum ${formatNumber(revealed.minimum)} already stored.`
        : `Pop ${formatNumber(popped.value)}. The stack is empty again.`,
      prompt: revealed
        ? "Why is no minimum recomputation needed after the pop?"
        : "What must happen before another min or pop operation is valid?"
    }));
  }

  trace.push({
    ...createStep({
      trace,
      phase: "complete",
      codeSteps: ["return-outputs"],
      operations,
      operationIndex: null,
      operation: null,
      stack,
      outputs,
      lastOutput,
      narration: `The ${operations.length}-operation program produced ${outputs.length} observable ${outputs.length === 1 ? "output" : "outputs"}.`,
      prompt: "Explain how storing a minimum in every item makes both min and pop constant-time."
    }),
    result: cloneOutputs(outputs)
  });

  return trace;
}

function createStep({
  trace,
  phase,
  codeSteps,
  operations,
  operationIndex,
  operation,
  stack,
  outputs,
  lastOutput,
  narration,
  prompt,
  poppedValue = null,
  poppedMinimum = null,
  activeItemIds = [],
  changedItemIds = [],
  annotations = []
}) {
  const items = stack.map((item) => ({
    id: item.id,
    value: `${formatNumber(item.value)} · min ${formatNumber(item.minimum)}`,
    state: "augmented"
  }));
  const top = stack.at(-1) ?? null;
  return {
    step: trace.length,
    phase,
    codeSteps,
    operationIndex,
    operationCount: operations.length,
    operationType: operation?.type ?? null,
    operationValue: operation?.type === "push" ? operation.value : null,
    stackSize: stack.length,
    currentMinimum: top?.minimum ?? null,
    poppedValue,
    poppedMinimum,
    outputCount: outputs.length,
    lastOutput: lastOutput === null ? null : { ...lastOutput },
    outputs: cloneOutputs(outputs),
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

function cloneOutputs(outputs) {
  return outputs.map((output) => ({ ...output }));
}
