import {
  maximumQueueOperations,
  runQueueOperations,
  validateQueueOperations
} from "../../../queues/queue-operations.mjs";
import { formatNumber } from "../input.mjs";
import { buildQueueOperationsTrace } from "../queue-operations.mjs";

export const queueOperationsLesson = {
  id: "queues/queue-operations",
  order: 20,
  topic: "Queues",
  prerequisites: ["stacks/valid-parentheses"],
  patterns: ["queue", "fifo"],
  catalogLabel: "Queue Operations",
  catalogDescription: "Separate the front that leaves from the back that receives.",
  title: "Run first-in, first-out queue operations",
  summary: "Enqueue at the back, then peek or dequeue at the front. A moving head preserves arrival order without shifting stored values.",
  renderer: "queue",
  input: {
    heading: "Your queue program",
    fields: [{
      id: "operations",
      label: `Enter 1-${maximumQueueOperations} comma-separated operations`,
      type: "text",
      inputMode: "text",
      placeholder: "enqueue 4, enqueue 9, peek, dequeue"
    }],
    help: "Use enqueue followed by a finite number, or use peek and dequeue after the queue has a value.",
    defaultValue: { operations: [
      { type: "enqueue", value: 4 },
      { type: "enqueue", value: 9 },
      { type: "peek" },
      { type: "dequeue" },
      { type: "peek" }
    ] },
    sampleValue: { operations: [
      { type: "enqueue", value: -2 },
      { type: "dequeue" },
      { type: "enqueue", value: 7 },
      { type: "peek" }
    ] },
    parse: ({ operations }) => ({ operations: parseQueueProgram(operations) }),
    serialize: ({ operations }) => ({ operations: serializeQueueProgram(operations) })
  },
  solve: ({ operations }) => runQueueOperations(operations),
  buildTrace: ({ operations }) => buildQueueOperationsTrace(operations),
  code: {
    title: "Move a head instead of shifting",
    filename: "queue-operations.mjs",
    sourcePath: "queues/queue-operations.mjs",
    lines: [
      { number: 27, text: "export function runQueueOperations(operations) {", steps: ["function"] },
      { number: 28, text: "  validateQueueOperations(operations);", steps: ["initialize"] },
      { number: 29, text: "  const storage = [];", steps: ["initialize"] },
      { number: 30, text: "  const outputs = [];", steps: ["initialize"] },
      { number: 31, text: "  let head = 0;", steps: ["initialize"] },
      { number: 8, text: "  for (let index = 0; index < operations.length; index += 1) {", steps: ["read-operation"] },
      { number: 12, text: "    const operation = operations[index];", steps: ["read-operation"] },
      { number: 13, text: "    if (operation.type === \"enqueue\") {", steps: ["enqueue"] },
      { number: 35, text: "      storage.push(operation.value);", steps: ["enqueue"] },
      { number: 36, text: "    } else if (operation.type === \"peek\") {", steps: ["peek"] },
      { number: 37, text: "      outputs.push({ operation: \"peek\", index, value: storage[head] });", steps: ["peek"] },
      { number: 38, text: "    } else {", steps: ["dequeue"] },
      { number: 39, text: "      outputs.push({ operation: \"dequeue\", index, value: storage[head] });", steps: ["dequeue"] },
      { number: 40, text: "      head += 1;", steps: ["advance-head"] },
      { number: 11, text: "    }", steps: ["read-operation"] },
      { number: 6, text: "  }", steps: ["read-operation"] },
      { number: 43, text: "  return outputs;", steps: ["return"] },
      { number: 25, text: "}", steps: ["function"] }
    ]
  },
  stats: [
    {
      label: "Operation",
      value: (step) => step.operation === null ? "-" : operationLabel(step.operation),
      detail: (step) => step.operationIndex === null ? "program boundary" : `instruction ${step.operationIndex}`
    },
    {
      label: "Queue size",
      value: (step) => String(step.queueSize),
      detail: () => "front through back"
    },
    {
      label: "Outputs",
      value: (step) => String(step.outputCount),
      detail: (step) => step.latestOutput ? `${step.latestOutput.operation} → ${formatNumber(step.latestOutput.value)}` : "none yet"
    }
  ],
  complexity: {
    chip: "FIRST IN, FIRST OUT",
    time: "O(m)",
    space: "O(m)",
    explanation: "Each of m operations takes constant time when dequeue advances a head index rather than shifting the array. Stored values and observable outputs use linear space."
  },
  guide: {
    heading: "Enter at back; leave at front."
  },
  legend: [
    { kind: "front", label: "next out" },
    { kind: "back", label: "newest arrival" },
    { kind: "active", label: "current item" },
    { kind: "changed", label: "endpoint changed" }
  ],
  reflection: {
    eyebrow: "BEFORE YOU MOVE ON",
    title: "Why avoid Array.shift for a queue?",
    body: "Explain how a head index makes dequeue constant time and why values after the head can remain in storage even though they are no longer logically in the queue."
  }
};

export function parseQueueProgram(value) {
  const source = String(value ?? "").trim();
  if (source === "") throw new Error("Enter at least one queue operation.");
  const tokens = source.split(",").map((token) => token.trim());
  if (tokens.some((token) => token === "")) throw new Error("Enter an operation between each comma.");
  const operations = tokens.map((token) => {
    if (/^(?:peek|dequeue)$/i.test(token)) return { type: token.toLowerCase() };
    const match = /^enqueue\s+(.+)$/i.exec(token);
    if (!match) throw new Error(`Unknown queue operation: ${token}.`);
    const number = Number(match[1].trim());
    if (!Number.isFinite(number)) throw new Error(`Enqueue value is not finite: ${match[1].trim()}.`);
    return { type: "enqueue", value: number };
  });
  validateQueueOperations(operations);
  return operations;
}

export function serializeQueueProgram(operations) {
  validateQueueOperations(operations);
  return operations.map(operationLabel).join(", ");
}

function operationLabel(operation) {
  return operation.type === "enqueue" ? `enqueue ${formatNumber(operation.value)}` : operation.type;
}
