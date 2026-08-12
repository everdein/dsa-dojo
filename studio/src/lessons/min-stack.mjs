import {
  formatMinStackProgram,
  maximumMinStackOperations,
  parseMinStackProgram,
  runMinStack
} from "../../../stacks/min-stack.mjs";
import { formatNumber } from "../input.mjs";
import { buildMinStackTrace } from "../min-stack.mjs";

export const minStackLesson = {
  id: "stacks/min-stack",
  order: 18,
  topic: "Stacks",
  prerequisites: ["stacks/valid-parentheses"],
  patterns: ["augmented-stack", "running-minimum"],
  catalogLabel: "Min Stack",
  catalogDescription: "Store the minimum at every depth so min and pop remain constant-time.",
  title: "Maintain a minimum inside a stack",
  summary: "Augment each pushed value with the minimum so far. The top item can answer min immediately, and popping restores the previous minimum automatically.",
  renderer: "stack",
  input: {
    fields: [{
      id: "program",
      label: `Enter 1–${maximumMinStackOperations} comma-separated operations`,
      type: "text",
      inputMode: "text",
      placeholder: "push 5, push 2, min, pop, min"
    }],
    help: "Use push <number>, pop, and min. A pop or min operation requires a non-empty stack at that point.",
    defaultValue: {
      operations: parseMinStackProgram("push 5, push 2, min, pop, min")
    },
    sampleValue: {
      operations: parseMinStackProgram("push -3, push -3, min, pop, min")
    },
    parse: (fields) => ({ operations: parseMinStackProgram(fields.program) }),
    serialize: ({ operations }) => ({ program: formatMinStackProgram(operations) })
  },
  solve: ({ operations }) => runMinStack(operations),
  buildTrace: ({ operations }) => buildMinStackTrace(operations),
  code: {
    title: "Store the minimum at each depth",
    filename: "min-stack.mjs",
    sourcePath: "stacks/min-stack.mjs",
    lines: [
      { number: 59, text: "export function runMinStack(operations) {", steps: ["function"] },
      { number: 60, text: "  validateMinStackOperations(operations);", steps: ["initialize"] },
      { number: 61, text: "", steps: ["initialize"] },
      { number: 62, text: "  const stack = [];", steps: ["initialize"] },
      { number: 63, text: "  const outputs = [];", steps: ["initialize"] },
      { number: 64, text: "  for (let operationIndex = 0; operationIndex < operations.length; operationIndex += 1) {", steps: ["read-operation"] },
      { number: 65, text: "    const operation = operations[operationIndex];", steps: ["read-operation"] },
      { number: 66, text: "    if (operation.type === \"push\") {", steps: ["compute-minimum"] },
      { number: 67, text: "      const previousMinimum = stack.at(-1)?.minimum;", steps: ["compute-minimum"] },
      { number: 68, text: "      stack.push({", steps: ["push-item"] },
      { number: 69, text: "        value: operation.value,", steps: ["push-item"] },
      { number: 70, text: "        minimum: previousMinimum === undefined", steps: ["compute-minimum"] },
      { number: 71, text: "          ? operation.value", steps: ["compute-minimum"] },
      { number: 72, text: "          : Math.min(previousMinimum, operation.value)", steps: ["compute-minimum"] },
      { number: 73, text: "      });", steps: ["push-item"] },
      { number: 74, text: "      continue;", steps: ["push-item"] },
      { number: 75, text: "    }", steps: ["push-item"] },
      { number: 76, text: "", steps: ["read-minimum"] },
      { number: 77, text: "    if (operation.type === \"min\") {", steps: ["read-minimum"] },
      { number: 78, text: "      outputs.push({", steps: ["record-output"] },
      { number: 79, text: "        operationIndex,", steps: ["record-output"] },
      { number: 80, text: "        type: \"min\",", steps: ["record-output"] },
      { number: 81, text: "        value: stack.at(-1).minimum", steps: ["read-minimum"] },
      { number: 82, text: "      });", steps: ["record-output"] },
      { number: 83, text: "      continue;", steps: ["record-output"] },
      { number: 84, text: "    }", steps: ["read-minimum"] },
      { number: 85, text: "", steps: ["pop-item"] },
      { number: 86, text: "    outputs.push({", steps: ["pop-item", "record-output"] },
      { number: 87, text: "      operationIndex,", steps: ["record-output"] },
      { number: 88, text: "      type: \"pop\",", steps: ["record-output"] },
      { number: 89, text: "      value: stack.pop().value", steps: ["pop-item"] },
      { number: 90, text: "    });", steps: ["record-output"] },
      { number: 91, text: "  }", steps: ["read-operation"] },
      { number: 92, text: "", steps: ["return-outputs"] },
      { number: 93, text: "  return outputs;", steps: ["return-outputs"] },
      { number: 94, text: "}", steps: ["function"] }
    ]
  },
  stats: [
    {
      label: "Operation",
      value: (step) => step.operationIndex === null
        ? step.phase === "complete" ? "done" : "ready"
        : `${step.operationIndex + 1} / ${step.operationCount}`,
      detail: (step) => operationDetail(step)
    },
    {
      label: "Stack size",
      value: (step) => String(step.stackSize),
      detail: () => "augmented items"
    },
    {
      label: "Current minimum",
      accent: true,
      value: (step) => step.currentMinimum === null ? "empty" : formatNumber(step.currentMinimum),
      detail: () => "stored on the top item"
    },
    {
      label: "Outputs",
      value: (step) => String(step.outputCount),
      detail: (step) => outputDetail(step.lastOutput)
    }
  ],
  complexity: {
    chip: "AUGMENT EACH ITEM",
    time: "O(1)",
    space: "O(n)",
    explanation: "Each push, pop, and min operation touches only the top item, so every operation is O(1) and a program of m operations is O(m). Storing one additional minimum per stack item keeps total space O(n)."
  },
  guide: {
    heading: "Carry the invariant upward."
  },
  legend: [
    { kind: "augmented", label: "value plus minimum" },
    { kind: "active", label: "active top" },
    { kind: "changed", label: "top changed" }
  ],
  reflection: {
    eyebrow: "BEFORE YOU MOVE ON",
    title: "Why does pop restore the old minimum for free?",
    body: "Try duplicate minima, negative values, a new minimum followed by pop, and several min reads. Explain why each depth stores exactly the information the next depth needs."
  }
};

function operationDetail(step) {
  if (step.operationType === "push") return `push ${formatNumber(step.operationValue)}`;
  if (step.operationType) return step.operationType;
  return step.phase === "complete" ? "program complete" : "waiting to begin";
}

function outputDetail(output) {
  if (!output) return "min and pop produce output";
  return `${output.type} returned ${formatNumber(output.value)}`;
}
