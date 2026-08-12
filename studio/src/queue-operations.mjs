import {
  runQueueOperations,
  validateQueueOperations
} from "../../queues/queue-operations.mjs";
import { formatNumber } from "./input.mjs";

export { runQueueOperations };

export function buildQueueOperationsTrace(operations) {
  validateQueueOperations(operations);
  const queue = [];
  const outputs = [];
  const trace = [];

  trace.push(createStep({
    trace,
    phase: "initialize",
    codeSteps: ["initialize"],
    queue,
    outputs,
    operationIndex: null,
    operation: null,
    narration: "Start with an empty queue. New values enter at the back; reads and removals happen at the front.",
    prompt: "After two enqueues, which value should leave first?"
  }));

  for (let index = 0; index < operations.length; index += 1) {
    const operation = operations[index];
    if (operation.type === "enqueue") {
      const item = { id: `item-${index}`, value: operation.value, state: "queued" };
      queue.push(item);
      trace.push(createStep({
        trace,
        phase: "enqueue",
        codeSteps: ["read-operation", "enqueue"],
        queue,
        outputs,
        operationIndex: index,
        operation,
        activeItemIds: [item.id],
        changedItemIds: [item.id],
        annotations: [{ itemId: item.id, label: "entered at back" }],
        narration: `Enqueue ${formatNumber(item.value)} at the back.`,
        prompt: "Did the front value change?"
      }));
      continue;
    }

    const front = queue[0];
    trace.push(createStep({
      trace,
      phase: operation.type === "peek" ? "peek" : "read-front",
      codeSteps: ["read-operation", operation.type === "peek" ? "peek" : "dequeue"],
      queue,
      outputs,
      operationIndex: index,
      operation,
      activeItemIds: [front.id],
      annotations: [{ itemId: front.id, label: operation.type === "peek" ? "read only" : "next out" }],
      narration: `${operation.type === "peek" ? "Peek reads" : "Dequeue selects"} ${formatNumber(front.value)} at the front.`,
      prompt: operation.type === "peek" ? "Why does the queue remain unchanged?" : "Which item becomes front after removal?"
    }));
    outputs.push({ operation: operation.type, index, value: front.value });
    if (operation.type === "dequeue") {
      queue.shift();
      trace.push(createStep({
        trace,
        phase: "dequeue",
        codeSteps: ["advance-head"],
        queue,
        outputs,
        operationIndex: index,
        operation,
        activeItemIds: queue.length ? [queue[0].id] : [],
        changedItemIds: queue.length ? [queue[0].id] : [],
        annotations: queue.length ? [{ itemId: queue[0].id, label: "new front" }] : [],
        narration: `Remove ${formatNumber(front.value)}. ${queue.length ? `${formatNumber(queue[0].value)} is now at the front.` : "The queue is now empty."}`,
        prompt: "How does advancing the front preserve first-in, first-out order?"
      }));
    }
  }

  trace.push({
    ...createStep({
      trace,
      phase: "complete",
      codeSteps: ["return"],
      queue,
      outputs,
      operationIndex: null,
      operation: null,
      narration: `All ${operations.length} operations ran in order, producing ${outputs.length} observable ${outputs.length === 1 ? "value" : "values"}.`,
      prompt: "Which endpoint does each queue operation touch?"
    }),
    result: outputs.map((output) => ({ ...output }))
  });
  return trace;
}

function createStep({
  trace,
  phase,
  codeSteps,
  queue,
  outputs,
  operationIndex,
  operation,
  narration,
  prompt,
  activeItemIds = [],
  changedItemIds = [],
  annotations = []
}) {
  const items = queue.map((item) => ({ id: item.id, value: item.value, state: item.state }));
  return {
    step: trace.length,
    phase,
    codeSteps,
    operationIndex,
    operation: operation === null ? null : { ...operation },
    queueSize: items.length,
    outputCount: outputs.length,
    latestOutput: outputs.length ? { ...outputs.at(-1) } : null,
    view: {
      structure: "queue",
      items,
      frontItemId: items[0]?.id ?? null,
      backItemId: items.at(-1)?.id ?? null,
      activeItemIds: [...activeItemIds],
      changedItemIds: [...changedItemIds],
      annotations: annotations.map((annotation) => ({ ...annotation }))
    },
    narration,
    prompt
  };
}
