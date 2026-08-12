import test from "node:test";
import assert from "node:assert/strict";
import {
  maximumQueueOperations,
  runQueueOperations,
  validateQueueOperations
} from "../queues/queue-operations.mjs";
import { buildValidatedTrace } from "../studio/src/lesson-contract.mjs";
import {
  parseQueueProgram,
  queueOperationsLesson,
  serializeQueueProgram
} from "../studio/src/lessons/queue-operations.mjs";
import { buildQueueOperationsTrace } from "../studio/src/queue-operations.mjs";

test("queue operations preserve first-in, first-out behavior", () => {
  const operations = [
    { type: "enqueue", value: 4 },
    { type: "enqueue", value: 9 },
    { type: "peek" },
    { type: "dequeue" },
    { type: "enqueue", value: -2 },
    { type: "dequeue" }
  ];
  assert.deepEqual(runQueueOperations(operations), [
    { operation: "peek", index: 2, value: 4 },
    { operation: "dequeue", index: 3, value: 4 },
    { operation: "dequeue", index: 5, value: 9 }
  ]);
});

test("queue operations reject invalid programs and underflow", () => {
  for (const operations of [
    undefined,
    [],
    [{ type: "peek" }],
    [{ type: "dequeue" }],
    [{ type: "enqueue", value: Infinity }],
    [{ type: "unknown" }],
    Array.from({ length: maximumQueueOperations + 1 }, (_, index) => ({ type: "enqueue", value: index }))
  ]) {
    assert.throws(() => validateQueueOperations(operations));
  }
});

test("queue lesson parses and serializes operation programs", () => {
  const operations = parseQueueProgram("enqueue 4, ENQUEUE -2.5, peek, dequeue");
  assert.deepEqual(operations, [
    { type: "enqueue", value: 4 },
    { type: "enqueue", value: -2.5 },
    { type: "peek" },
    { type: "dequeue" }
  ]);
  assert.equal(serializeQueueProgram(operations), "enqueue 4, enqueue -2.5, peek, dequeue");
  assert.throws(() => parseQueueProgram(""));
  assert.throws(() => parseQueueProgram("enqueue 1,,peek"));
  assert.throws(() => parseQueueProgram("push 1"));
  assert.throws(() => parseQueueProgram("enqueue nope"));
});

test("queue trace shows enqueue, peek, and dequeue endpoints", () => {
  const operations = parseQueueProgram("enqueue 4, enqueue 9, peek, dequeue");
  const trace = buildQueueOperationsTrace(operations);
  assert.ok(trace.some(({ phase }) => phase === "enqueue"));
  assert.ok(trace.some(({ phase }) => phase === "peek"));
  assert.ok(trace.some(({ phase }) => phase === "dequeue"));
  assert.deepEqual(trace.at(-1).result, runQueueOperations(operations));
  assert.equal(trace.at(-1).view.frontItemId, "item-1");
});

test("queue lesson satisfies deterministic queue snapshot ownership", () => {
  const trace = buildValidatedTrace(queueOperationsLesson, queueOperationsLesson.input.defaultValue);
  for (const property of ["items", "activeItemIds", "changedItemIds", "annotations"]) {
    assert.equal(new Set(trace.map((step) => step.view[property])).size, trace.length, property);
  }
  assert.equal(new Set(trace.flatMap((step) => step.view.items)).size, trace.flatMap((step) => step.view.items).length);
});
