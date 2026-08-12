import test from "node:test";
import assert from "node:assert/strict";
import {
  factorial,
  formatFactorialInput,
  maximumFactorialInput,
  parseFactorialInput,
  validateFactorialInput
} from "../recursion/factorial.mjs";
import {
  buildFactorialTrace,
  factorialFrameId
} from "../studio/src/factorial.mjs";
import {
  assertLesson,
  assertTrace,
  buildValidatedTrace
} from "../studio/src/lesson-contract.mjs";
import { factorialLesson } from "../studio/src/lessons/factorial.mjs";

test("factorial handles both base inputs and recursive products exactly", () => {
  assert.equal(factorial(0), 1);
  assert.equal(factorial(1), 1);
  assert.equal(factorial(2), 2);
  assert.equal(factorial(5), 120);
  assert.equal(factorial(10), 3_628_800);
  assert.equal(factorial(maximumFactorialInput), 479_001_600);
  assert.equal(Number.isSafeInteger(factorial(maximumFactorialInput)), true);
});

test("factorial agrees with an iterative product throughout its domain", () => {
  for (let value = 0; value <= maximumFactorialInput; value += 1) {
    let expected = 1;
    for (let factor = 2; factor <= value; factor += 1) expected *= factor;
    assert.equal(factorial(value), expected);
  }
});

test("factorial validation rejects negative, fractional, nonnumeric, and oversized inputs", () => {
  for (const value of [
    undefined,
    null,
    "5",
    true,
    -1,
    1.5,
    Number.NaN,
    Infinity,
    -Infinity,
    maximumFactorialInput + 1
  ]) {
    assert.throws(() => validateFactorialInput(value), /Factorial input/);
    assert.throws(() => factorial(value), /Factorial input/);
  }
});

test("factorial parser and formatter round trip bounded whole numbers", () => {
  assert.equal(parseFactorialInput(" 0 "), 0);
  assert.equal(parseFactorialInput("+5"), 5);
  assert.equal(parseFactorialInput(12), 12);
  assert.equal(formatFactorialInput(0), "0");
  assert.equal(formatFactorialInput(12), "12");
  for (const raw of [undefined, null, "", "   ", "word", "1.5", "-1", "13", "Infinity"]) {
    assert.throws(() => parseFactorialInput(raw), /factorial/i);
  }
  assert.throws(() => formatFactorialInput(13), /Factorial input/);
});

test("Factorial lesson declares the exact roadmap metadata and stack renderer", () => {
  assert.equal(assertLesson(factorialLesson), factorialLesson);
  assert.equal(factorialLesson.id, "recursion/factorial");
  assert.equal(factorialLesson.order, 42);
  assert.equal(factorialLesson.topic, "Recursion");
  assert.equal(factorialLesson.renderer, "stack");
  assert.deepEqual(factorialLesson.prerequisites, ["stacks/valid-parentheses"]);
  assert.deepEqual(factorialLesson.patterns, ["recursion", "call-stack"]);
  assert.deepEqual(factorialLesson.input.parse({ value: "6" }), { value: 6 });
  assert.deepEqual(factorialLesson.input.serialize({ value: 6 }), { value: "6" });
});

test("factorial trace descends to the base case and unwinds in reverse order", () => {
  const trace = buildFactorialTrace(4);
  assert.deepEqual(trace.map(({ phase }) => phase), [
    "initialize",
    "call",
    "descend",
    "call",
    "descend",
    "call",
    "descend",
    "call",
    "base-case",
    "unwind",
    "unwind",
    "unwind",
    "complete"
  ]);

  const calls = trace.filter(({ phase }) => phase === "call");
  assert.deepEqual(calls.map(({ currentArgument }) => currentArgument), [4, 3, 2, 1]);
  assert.deepEqual(calls.map(({ stackDepth }) => stackDepth), [1, 2, 3, 4]);
  assert.deepEqual(calls.map((step) => step.view.topItemId), [
    "frame-4",
    "frame-3",
    "frame-2",
    "frame-1"
  ]);

  const base = trace.find(({ phase }) => phase === "base-case");
  assert.equal(base.currentArgument, 1);
  assert.equal(base.returnedValue, 1);
  assert.equal(base.view.items.at(-1).state, "base-case");

  const unwinds = trace.filter(({ phase }) => phase === "unwind");
  assert.deepEqual(unwinds.map(({ currentArgument }) => currentArgument), [2, 3, 4]);
  assert.deepEqual(unwinds.map(({ returnedValue }) => returnedValue), [2, 6, 24]);
  assert.deepEqual(unwinds.map(({ multiplications }) => multiplications), [1, 2, 3]);
  assert.ok(unwinds.every((step) => step.view.items.at(-1).state === "returning"));

  assert.equal(trace.at(-1).result, 24);
  assert.equal(trace.at(-1).stackDepth, 0);
  assert.equal(trace.at(-1).maximumDepth, 4);
  assert.equal(trace.at(-1).callsMade, 4);
  assert.equal(trace.at(-1).multiplications, 3);
  assert.deepEqual(trace.at(-1).view.items, []);
});

test("zero and one traces use the base case without multiplication", () => {
  for (const value of [0, 1]) {
    const trace = buildFactorialTrace(value);
    assert.deepEqual(trace.map(({ phase }) => phase), [
      "initialize",
      "call",
      "base-case",
      "complete"
    ]);
    assert.equal(trace.at(-1).result, 1);
    assert.equal(trace.at(-1).callsMade, 1);
    assert.equal(trace.at(-1).maximumDepth, 1);
    assert.equal(trace.at(-1).multiplications, 0);
    assert.equal(trace.some(({ phase }) => phase === "descend"), false);
    assert.equal(trace.some(({ phase }) => phase === "unwind"), false);
  }
});

test("factorial frame ids are stable by argument and reject invalid arguments", () => {
  assert.equal(factorialFrameId(0), "frame-0");
  assert.equal(factorialFrameId(12), "frame-12");
  for (const argument of [-1, 1.5, 13, Number.NaN, "1"]) {
    assert.throws(() => factorialFrameId(argument), /Factorial input/);
  }
});

test("Factorial trace is deterministic and solver-aligned under the full lesson contract", () => {
  const input = { value: 6 };
  const before = structuredClone(input);
  const trace = buildValidatedTrace(factorialLesson, input);
  assert.equal(assertTrace(trace, factorialLesson), trace);
  assert.equal(trace.at(-1).result, factorial(input.value));
  assert.deepEqual(input, before);
  assert.deepEqual(buildFactorialTrace(6), buildFactorialTrace(6));

  const sampleTrace = buildValidatedTrace(factorialLesson, factorialLesson.input.sampleValue);
  assert.equal(sampleTrace.at(-1).result, 1);
});

test("Factorial trace owns stack and derived frame snapshots deeply", () => {
  const trace = buildFactorialTrace(4);
  for (const property of ["items", "activeItemIds", "changedItemIds", "annotations"]) {
    assert.equal(new Set(trace.map((step) => step.view[property])).size, trace.length, property);
  }
  assert.equal(new Set(trace.map((step) => step.frames)).size, trace.length);

  for (const property of ["items", "annotations"]) {
    const objects = trace.flatMap((step) => step.view[property]);
    assert.equal(new Set(objects).size, objects.length, property);
  }
  const frames = trace.flatMap((step) => step.frames);
  assert.equal(new Set(frames).size, frames.length);

  trace[2].view.items = trace[1].view.items;
  assert.throws(() => assertTrace(trace, factorialLesson), /items snapshot/);

  const nestedTrace = buildFactorialTrace(4);
  nestedTrace[2].view.items[0] = nestedTrace[1].view.items[0];
  assert.throws(() => assertTrace(nestedTrace, factorialLesson), /items objects/);
});
