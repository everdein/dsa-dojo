import test from "node:test";
import assert from "node:assert/strict";
import {
  answerRangeSumQueries,
  maximumRangeSumQueries,
  maximumRangeSumValues,
  parseRangeQueries,
  rangeSumQueries,
  validateRangeSumInput
} from "../patterns/prefix-sums/range-sum-queries.mjs";
import { buildRangeSumQueriesTrace } from "../studio/src/range-sum-queries.mjs";
import { rangeSumQueriesLesson } from "../studio/src/lessons/range-sum-queries.mjs";
import {
  assertLesson,
  buildValidatedTrace
} from "../studio/src/lesson-contract.mjs";

test("range-sum solver builds a leading-zero prefix and preserves query order", () => {
  const values = [3, -1, 4, 2, -5];
  const queries = [[0, 2], [1, 4], [3, 3], [0, 2]];
  const originalValues = [...values];
  const originalQueries = queries.map((query) => [...query]);
  const expected = {
    prefix: [0, 3, 2, 6, 8, 3],
    answers: [6, 0, 2, 6]
  };

  assert.deepEqual(rangeSumQueries(values, queries), expected);
  assert.deepEqual(answerRangeSumQueries(values, queries), expected);
  assert.deepEqual(values, originalValues);
  assert.deepEqual(queries, originalQueries);
});

test("range-sum solver handles singleton arrays, singleton ranges, and repeated queries", () => {
  assert.deepEqual(rangeSumQueries([-7], [[0, 0], [0, 0]]), {
    prefix: [0, -7],
    answers: [-7, -7]
  });
  assert.deepEqual(rangeSumQueries([5, -8, 3], [[1, 1], [2, 2], [1, 1]]), {
    prefix: [0, 5, -3, 0],
    answers: [-8, 3, -8]
  });
});

test("range-sum validation rejects malformed, sparse, nonfinite, and out-of-bounds input", () => {
  const sparseValues = Array(2);
  sparseValues[0] = 1;
  const sparseQueries = Array(1);
  const sparseQuery = Array(2);
  sparseQuery[0] = 0;

  for (const values of [undefined, null, [], sparseValues, [1, Number.NaN], [Infinity]]) {
    assert.throws(() => validateRangeSumInput(values, [[0, 0]]));
  }
  assert.throws(
    () => validateRangeSumInput(Array(maximumRangeSumValues + 1).fill(1), [[0, 0]]),
    /10 values or fewer/
  );
  for (const queries of [undefined, null, [], sparseQueries, [[0]], [sparseQuery], [[0, 1, 2]], [[0.5, 1]], [[-1, 0]], [[1, 0]], [[0, 2]]]) {
    assert.throws(() => validateRangeSumInput([1, 2], queries));
  }
  assert.throws(
    () => validateRangeSumInput([1], Array.from({ length: maximumRangeSumQueries + 1 }, () => [0, 0])),
    /8 queries or fewer/
  );
});

test("range-sum rejects overflow while building prefixes and while subtracting them", () => {
  assert.throws(
    () => rangeSumQueries([Number.MAX_VALUE, Number.MAX_VALUE], [[0, 1]]),
    /Prefix sums must remain finite/
  );
  assert.throws(
    () => rangeSumQueries([Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE], [[1, 2]]),
    /answers must remain finite/
  );
  assert.throws(
    () => buildRangeSumQueriesTrace({ values: [Number.MAX_VALUE, Number.MAX_VALUE], queries: [[0, 1]] }),
    /Prefix sums must remain finite/
  );
});

test("range query parser accepts bounded start-end fields and rejects malformed ranges", () => {
  assert.deepEqual(parseRangeQueries("0-2, 1 - 4, 3-3", 5), [[0, 2], [1, 4], [3, 3]]);
  for (const raw of ["", "0", "0:2", "0-2,", "-1-2", "2-1", "0-5", "1.0-2"]) {
    assert.throws(() => parseRangeQueries(raw, 5));
  }
  assert.throws(() => parseRangeQueries("0-0", 0));
  assert.throws(
    () => parseRangeQueries(Array(maximumRangeSumQueries + 1).fill("0-0").join(","), 1),
    /8 queries or fewer/
  );
});

test("range-sum lesson declares its metadata, parses fields, and satisfies the lesson contract", () => {
  assert.equal(assertLesson(rangeSumQueriesLesson), rangeSumQueriesLesson);
  assert.equal(rangeSumQueriesLesson.id, "patterns/prefix-sum-range-queries");
  assert.equal(rangeSumQueriesLesson.order, 22);
  assert.deepEqual(rangeSumQueriesLesson.prerequisites, ["arrays/sliding-window"]);
  assert.deepEqual(rangeSumQueriesLesson.patterns, ["prefix-sum", "preprocessing", "range-query"]);
  assert.equal(Object.hasOwn(rangeSumQueriesLesson, "renderer"), false);
  assert.deepEqual(rangeSumQueriesLesson.views, [
    { id: "values", renderer: "array", heading: "Source values" },
    { id: "prefix", renderer: "array", heading: "Prefix sums (leading zero)" }
  ]);
  assert.deepEqual(rangeSumQueriesLesson.input.parse({
    values: "3, -1, 4, 2, 5",
    queries: "0-2, 1-4"
  }), {
    values: [3, -1, 4, 2, 5],
    queries: [[0, 2], [1, 4]]
  });
  assert.deepEqual(rangeSumQueriesLesson.input.serialize({
    values: [-0, 2],
    queries: [[0, 0], [0, 1]]
  }), {
    values: "-0, 2",
    queries: "0-0, 0-1"
  });
});

test("range-sum trace builds one prefix cell at a time, then answers each query", () => {
  const input = { values: [3, -1, 4], queries: [[0, 2], [1, 1], [0, 2]] };
  const trace = buildValidatedTrace(rangeSumQueriesLesson, input);

  assert.deepEqual(trace.map((step) => step.phase), [
    "initialize",
    "build-prefix",
    "build-prefix",
    "build-prefix",
    "answer-query",
    "answer-query",
    "answer-query",
    "complete"
  ]);
  assert.deepEqual(
    trace.filter((step) => step.phase === "build-prefix").map((step) => ({
      builtThrough: step.prefixBuiltThrough,
      prefix: step.views.prefix.values,
      changed: step.views.prefix.changedIndices
    })),
    [
      { builtThrough: 1, prefix: [0, 3, 0, 0], changed: [1] },
      { builtThrough: 2, prefix: [0, 3, 2, 0], changed: [2] },
      { builtThrough: 3, prefix: [0, 3, 2, 6], changed: [3] }
    ]
  );
  const querySteps = trace.filter((step) => step.phase === "answer-query");
  assert.deepEqual(querySteps.map((step) => step.answer), [6, -1, 6]);
  assert.deepEqual(querySteps[1].views.values.ranges, [
    { start: 1, end: 1, kind: "query", label: "requested range" }
  ]);
  assert.deepEqual(querySteps[1].views.prefix.activeIndices, [1, 2]);
  assert.deepEqual(trace.at(-1).result, {
    prefix: [0, 3, 2, 6],
    answers: [6, -1, 6]
  });
});

test("range-sum traces are deterministic, immutable, and deeply own panel snapshots", () => {
  const input = { values: [-4, 6, -2, 7], queries: [[0, 3], [1, 1], [1, 3]] };
  const original = structuredClone(input);
  const first = buildRangeSumQueriesTrace(input);
  const second = buildRangeSumQueriesTrace(structuredClone(input));

  assert.deepEqual(first, second);
  assert.deepEqual(input, original);
  assert.deepEqual(first.at(-1).result, rangeSumQueries(input.values, input.queries));
  first.forEach((step, index) => {
    assert.equal(step.step, index);
    assert.ok(step.codeSteps.length > 0);
    assert.equal(typeof step.narration, "string");
    assert.equal(typeof step.prompt, "string");
  });

  for (const panelId of ["values", "prefix"]) {
    assert.equal(new Set(first.map((step) => step.views[panelId])).size, first.length);
    for (const property of ["values", "activeIndices", "ranges", "markers", "annotations", "changedIndices"]) {
      assert.equal(
        new Set(first.map((step) => step.views[panelId][property])).size,
        first.length,
        `${panelId}.${property}`
      );
    }
    for (const property of ["ranges", "markers", "annotations"]) {
      const objects = first.flatMap((step) => step.views[panelId][property]);
      assert.equal(new Set(objects).size, objects.length, `${panelId}.${property} objects`);
    }
  }
  assert.equal(new Set(first.map((step) => step.answers)).size, first.length);
  const queryArrays = first.map((step) => step.currentQuery).filter(Boolean);
  assert.equal(new Set(queryArrays).size, queryArrays.length);
});
