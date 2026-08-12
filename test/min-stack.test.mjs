import test from "node:test";
import assert from "node:assert/strict";
import {
  formatMinStackProgram,
  maximumMinStackOperations,
  parseMinStackProgram,
  runMinStack,
  validateMinStackOperations
} from "../stacks/min-stack.mjs";
import { buildMinStackTrace } from "../studio/src/min-stack.mjs";
import { minStackLesson } from "../studio/src/lessons/min-stack.mjs";
import {
  assertLesson,
  buildValidatedTrace
} from "../studio/src/lesson-contract.mjs";

test("Min Stack parser accepts a deterministic operation language", () => {
  const operations = parseMinStackProgram(" PUSH 5 , push -2.5, min, pop, min ");
  assert.deepEqual(operations, [
    { type: "push", value: 5 },
    { type: "push", value: -2.5 },
    { type: "min" },
    { type: "pop" },
    { type: "min" }
  ]);
  assert.equal(formatMinStackProgram(operations), "push 5, push -2.5, min, pop, min");
  assert.deepEqual(parseMinStackProgram("push .5, push 1e2, min"), [
    { type: "push", value: 0.5 },
    { type: "push", value: 100 },
    { type: "min" }
  ]);
});

test("Min Stack parser rejects malformed operations, overflow, and underflow", () => {
  for (const program of [
    undefined,
    null,
    "",
    "   ",
    "push",
    "push nope",
    "push Infinity",
    "push 1,,min",
    "peek",
    "pop",
    "min",
    "push 1, pop, min",
    "push 1, pop, pop"
  ]) {
    assert.throws(() => parseMinStackProgram(program));
  }
  const tooLong = Array.from({ length: maximumMinStackOperations + 1 }, (_, index) => `push ${index}`).join(", ");
  assert.throws(() => parseMinStackProgram(tooLong), /12 operations or fewer/);

  const sparse = Array(2);
  sparse[1] = { type: "push", value: 1 };
  for (const operations of [
    undefined,
    [],
    sparse,
    [{ type: "push", value: Number.NaN }],
    [{ type: "push", value: Infinity }],
    [{ type: "peek" }]
  ]) {
    assert.throws(() => validateMinStackOperations(operations));
  }
});

test("Min Stack returns explicit observable outputs for min and pop", () => {
  const operations = parseMinStackProgram("push 5, push 2, min, pop, min");
  const original = structuredClone(operations);
  assert.deepEqual(runMinStack(operations), [
    { operationIndex: 2, type: "min", value: 2 },
    { operationIndex: 3, type: "pop", value: 2 },
    { operationIndex: 4, type: "min", value: 5 }
  ]);
  assert.deepEqual(operations, original);
});

test("Min Stack handles duplicate minima, negatives, and restored minima", () => {
  const operations = parseMinStackProgram(
    "push 4, push -2, push -2, min, pop, min, pop, min"
  );
  assert.deepEqual(runMinStack(operations), [
    { operationIndex: 3, type: "min", value: -2 },
    { operationIndex: 4, type: "pop", value: -2 },
    { operationIndex: 5, type: "min", value: -2 },
    { operationIndex: 6, type: "pop", value: -2 },
    { operationIndex: 7, type: "min", value: 4 }
  ]);
});

test("Min Stack lesson satisfies metadata, parsing, and shared contracts", () => {
  assert.equal(minStackLesson.id, "stacks/min-stack");
  assert.equal(minStackLesson.order, 18);
  assert.equal(minStackLesson.renderer, "stack");
  assert.deepEqual(minStackLesson.prerequisites, ["stacks/valid-parentheses"]);
  assert.deepEqual(minStackLesson.patterns, ["augmented-stack", "running-minimum"]);

  const parsed = minStackLesson.input.parse({ program: "push -0, min" });
  assert.deepEqual(parsed, {
    operations: [{ type: "push", value: -0 }, { type: "min" }]
  });
  assert.deepEqual(minStackLesson.input.serialize(parsed), {
    program: "push -0, min"
  });
  assert.equal(assertLesson(minStackLesson), minStackLesson);
  assert.deepEqual(
    buildValidatedTrace(minStackLesson, minStackLesson.input.defaultValue).at(-1).result,
    runMinStack(minStackLesson.input.defaultValue.operations)
  );
});

test("Min Stack trace stores the running minimum in every item", () => {
  const trace = buildMinStackTrace(parseMinStackProgram("push 5, push 2, push 7, min"));
  const pushes = trace.filter((step) => step.phase === "push");
  assert.deepEqual(
    pushes.map((step) => step.view.items.map((item) => item.value)),
    [
      ["5 · min 5"],
      ["5 · min 5", "2 · min 2"],
      ["5 · min 5", "2 · min 2", "7 · min 2"]
    ]
  );
  assert.deepEqual(pushes.map((step) => step.currentMinimum), [5, 2, 2]);

  const minStep = trace.find((step) => step.phase === "min");
  assert.equal(minStep.currentMinimum, 2);
  assert.deepEqual(minStep.lastOutput, {
    operationIndex: 3,
    type: "min",
    value: 2
  });
  assert.deepEqual(minStep.view.activeItemIds, ["item-2"]);
});

test("Min Stack trace makes pop reveal a previously stored minimum", () => {
  const trace = buildMinStackTrace(parseMinStackProgram("push 5, push 2, pop, min"));
  assert.deepEqual(trace.map((step) => step.phase), [
    "initialize",
    "push",
    "push",
    "pop",
    "min",
    "complete"
  ]);

  const pop = trace.find((step) => step.phase === "pop");
  assert.equal(pop.poppedValue, 2);
  assert.equal(pop.poppedMinimum, 2);
  assert.equal(pop.currentMinimum, 5);
  assert.equal(pop.view.topItemId, "item-0");
  assert.deepEqual(pop.view.changedItemIds, ["item-0"]);
  assert.deepEqual(pop.view.annotations, [{
    itemId: "item-0",
    label: "minimum restored to 5"
  }]);
});

test("Min Stack trace is deterministic, solver-aligned, immutable, and deeply owned", () => {
  const operations = parseMinStackProgram("push 3, push -1, min, push -1, pop, min");
  const original = structuredClone(operations);
  const first = buildMinStackTrace(operations);
  const second = buildMinStackTrace(structuredClone(operations));

  assert.deepEqual(first, second);
  assert.deepEqual(operations, original);
  assert.deepEqual(first.at(-1).result, runMinStack(operations));
  first.forEach((step, index) => {
    assert.equal(step.step, index);
    assert.ok(step.codeSteps.length > 0);
    assert.equal(typeof step.narration, "string");
    assert.equal(typeof step.prompt, "string");
    assert.equal(step.view.topItemId, step.view.items.at(-1)?.id ?? null);
  });

  for (const property of ["items", "activeItemIds", "changedItemIds", "annotations"]) {
    assert.equal(new Set(first.map((step) => step.view[property])).size, first.length, property);
  }
  for (const property of ["items", "annotations"]) {
    const objects = first.flatMap((step) => step.view[property]);
    assert.equal(new Set(objects).size, objects.length, property);
  }
  assert.equal(new Set(first.map((step) => step.outputs)).size, first.length, "outputs");
  assert.equal(new Set(first.flatMap((step) => step.outputs)).size, first.flatMap((step) => step.outputs).length);
});
