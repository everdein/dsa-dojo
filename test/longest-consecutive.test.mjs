import test from "node:test";
import assert from "node:assert/strict";
import {
  longestConsecutive,
  maximumConsecutiveValues,
  validateLongestConsecutiveInput
} from "../arrays/longest-consecutive.mjs";
import {
  buildLongestConsecutiveTrace,
  consecutiveLookupKey
} from "../studio/src/longest-consecutive.mjs";
import {
  assertLesson,
  assertTrace,
  buildValidatedTrace
} from "../studio/src/lesson-contract.mjs";
import { longestConsecutiveLesson } from "../studio/src/lessons/longest-consecutive.mjs";

test("longestConsecutive returns the full longest run without sorting or mutating input", () => {
  const values = [100, 4, 200, 1, 3, 2];
  const before = [...values];
  assert.deepEqual(longestConsecutive(values), {
    length: 4,
    start: 1,
    end: 4,
    values: [1, 2, 3, 4]
  });
  assert.deepEqual(values, before);

  assert.deepEqual(longestConsecutive([-1, -2, 2, 0, -1, 1]), {
    length: 5,
    start: -2,
    end: 2,
    values: [-2, -1, 0, 1, 2]
  });
});

test("longestConsecutive ignores duplicates and keeps the first equal-length start", () => {
  assert.deepEqual(longestConsecutive([10, 11, 1, 2, 11, 10]), {
    length: 2,
    start: 10,
    end: 11,
    values: [10, 11]
  });
  assert.deepEqual(longestConsecutive([-0, 0, 1]), {
    length: 2,
    start: 0,
    end: 1,
    values: [0, 1]
  });
  assert.equal(consecutiveLookupKey(-0), "0");
  assert.equal(consecutiveLookupKey(0), "0");
});

test("longestConsecutive guards arithmetic at both safe-integer boundaries", () => {
  const minimum = Number.MIN_SAFE_INTEGER;
  const maximum = Number.MAX_SAFE_INTEGER;
  assert.deepEqual(longestConsecutive([maximum, maximum - 1, minimum]), {
    length: 2,
    start: maximum - 1,
    end: maximum,
    values: [maximum - 1, maximum]
  });
  assert.deepEqual(longestConsecutive([minimum + 1, minimum]), {
    length: 2,
    start: minimum,
    end: minimum + 1,
    values: [minimum, minimum + 1]
  });
});

test("Longest Consecutive Sequence rejects empty, sparse, unsafe, decimal, and oversized inputs", () => {
  for (const values of [
    null,
    [],
    Array(2),
    [1.5],
    [Number.MAX_SAFE_INTEGER + 1],
    [Number.NaN],
    [Infinity],
    Array.from({ length: maximumConsecutiveValues + 1 }, (_, index) => index)
  ]) {
    assert.throws(() => validateLongestConsecutiveInput(values), /Longest Consecutive Sequence/);
    assert.throws(() => longestConsecutive(values), /Longest Consecutive Sequence/);
  }
  assert.throws(() => consecutiveLookupKey(1.5), /safe integers/);
});

test("Longest Consecutive lesson satisfies the composite contract deterministically", () => {
  assert.equal(assertLesson(longestConsecutiveLesson), longestConsecutiveLesson);
  const input = { values: [100, 4, 200, 1, 3, 2] };
  const trace = buildValidatedTrace(longestConsecutiveLesson, input);
  assert.equal(assertTrace(trace, longestConsecutiveLesson), trace);
  assert.deepEqual(trace.at(-1).result, longestConsecutive(input.values));
  assert.deepEqual(input, { values: [100, 4, 200, 1, 3, 2] });
});

test("Longest Consecutive trace grows streaks only from values with no predecessor", () => {
  const values = [100, 4, 200, 1, 3, 2];
  const valueSet = new Set(values);
  const trace = buildLongestConsecutiveTrace(values);
  const starts = trace.filter(({ phase }) => phase === "start-streak");
  assert.deepEqual(starts.map(({ currentValue }) => currentValue), [100, 200, 1]);
  for (const step of starts) {
    assert.equal(
      step.currentValue > Number.MIN_SAFE_INTEGER && valueSet.has(step.currentValue - 1),
      false
    );
  }

  const nonStarts = trace.filter(
    ({ phase, isSequenceStart }) => phase === "check-start" && isSequenceStart === false
  );
  assert.deepEqual(nonStarts.map(({ currentValue }) => currentValue), [4, 3, 2]);
  assert.ok(nonStarts.every(({ currentValue, predecessor }) => (
    predecessor === currentValue - 1 && valueSet.has(predecessor)
  )));
  assert.deepEqual(trace.at(-1).views.set.resultKeys, ["1", "2", "3", "4"]);
  assert.ok(trace.at(-1).views.set.entries.every(({ value }) => typeof value === "string"));
});

test("Longest Consecutive trace keeps the first equal-length streak and owns every snapshot", () => {
  const trace = buildLongestConsecutiveTrace([10, 11, 1, 2]);
  assert.deepEqual(trace.at(-1).result, {
    length: 2,
    start: 10,
    end: 11,
    values: [10, 11]
  });
  assert.equal(trace.some(({ phase }) => phase === "keep-best"), true);

  trace[1].views.set.entries = trace[0].views.set.entries;
  assert.throws(
    () => assertTrace(trace, longestConsecutiveLesson),
    /View panel set:.*entries snapshot/i
  );

  const nestedTrace = buildLongestConsecutiveTrace([10, 11, 1, 2]);
  nestedTrace[1].views.set.entries[0] = nestedTrace[0].views.set.entries[0];
  assert.throws(
    () => assertTrace(nestedTrace, longestConsecutiveLesson),
    /View panel set:.*entries objects/i
  );
});

test("Longest Consecutive lesson parses and serializes only bounded safe integers", () => {
  assert.deepEqual(
    longestConsecutiveLesson.input.parse({ values: " -2, -1, 0, 1, 2 " }),
    { values: [-2, -1, 0, 1, 2] }
  );
  assert.deepEqual(
    longestConsecutiveLesson.input.serialize({ values: [-0, 1, 2] }),
    { values: "-0, 1, 2" }
  );
  assert.throws(
    () => longestConsecutiveLesson.input.parse({ values: "1, 1.5, 2" }),
    /safe integers/
  );
  assert.throws(
    () => longestConsecutiveLesson.input.parse({ values: String(Number.MAX_SAFE_INTEGER + 1) }),
    /safe integers/
  );
});
