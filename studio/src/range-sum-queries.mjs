import {
  assertFiniteAnswer,
  assertFinitePrefix,
  rangeSumQueries,
  validateRangeSumInput
} from "../../patterns/prefix-sums/range-sum-queries.mjs";
import { formatNumber } from "./input.mjs";

export { rangeSumQueries };

export function buildRangeSumQueriesTrace({ values, queries }) {
  validateRangeSumInput(values, queries);

  const trace = [];
  const prefix = Array(values.length + 1).fill(0);
  const answers = [];

  trace.push(createStep({
    trace,
    phase: "initialize",
    codeSteps: ["initialize-prefix"],
    values,
    prefix,
    answers,
    prefixBuiltThrough: 0,
    currentValueIndex: null,
    currentQueryIndex: null,
    currentQuery: null,
    answer: null,
    narration: "Create a prefix array with a leading zero. This base means a query starting at index 0 needs no special case.",
    prompt: `Prediction: what should prefix[1] become after adding ${formatNumber(values[0])}?`
  }));

  for (let valueIndex = 0; valueIndex < values.length; valueIndex += 1) {
    const prefixIndex = valueIndex + 1;
    const next = prefix[valueIndex] + values[valueIndex];
    assertFinitePrefix(next);
    prefix[prefixIndex] = next;

    trace.push(createStep({
      trace,
      phase: "build-prefix",
      codeSteps: ["build-prefix"],
      values,
      prefix,
      answers,
      prefixBuiltThrough: prefixIndex,
      currentValueIndex: valueIndex,
      currentQueryIndex: null,
      currentQuery: null,
      answer: null,
      narration: `prefix[${prefixIndex}] = prefix[${valueIndex}] + values[${valueIndex}] = ${formatNumber(prefix[valueIndex])} + ${formatNumber(values[valueIndex])} = ${formatNumber(next)}.`,
      prompt: valueIndex + 1 < values.length
        ? `Which previous prefix sum will the next value extend?`
        : "The prefix array is ready. Which two prefix positions answer the first query?"
    }));
  }

  for (let queryIndex = 0; queryIndex < queries.length; queryIndex += 1) {
    const [start, end] = queries[queryIndex];
    const answer = prefix[end + 1] - prefix[start];
    assertFiniteAnswer(answer);
    answers.push(answer);

    trace.push(createStep({
      trace,
      phase: "answer-query",
      codeSteps: ["answer-query"],
      values,
      prefix,
      answers,
      prefixBuiltThrough: values.length,
      currentValueIndex: null,
      currentQueryIndex: queryIndex,
      currentQuery: [start, end],
      answer,
      narration: `Query ${queryIndex + 1} covers indices ${start}-${end}: prefix[${end + 1}] - prefix[${start}] = ${formatNumber(prefix[end + 1])} - ${formatNumber(prefix[start])} = ${formatNumber(answer)}.`,
      prompt: queryIndex + 1 < queries.length
        ? "Can the next query reuse this same prefix array?"
        : "Why does subtracting the earlier prefix remove everything before the query?"
    }));
  }

  trace.push({
    ...createStep({
      trace,
      phase: "complete",
      codeSteps: ["return-result"],
      values,
      prefix,
      answers,
      prefixBuiltThrough: values.length,
      currentValueIndex: null,
      currentQueryIndex: null,
      currentQuery: null,
      answer: null,
      narration: `Preprocessing is complete, and all ${queries.length} queries were answered in constant time each.`,
      prompt: "When do prefix sums save more work than answering each range by scanning it?"
    }),
    result: {
      prefix: [...prefix],
      answers: [...answers]
    }
  });

  return trace;
}

function createStep({
  trace,
  phase,
  codeSteps,
  values,
  prefix,
  answers,
  prefixBuiltThrough,
  currentValueIndex,
  currentQueryIndex,
  currentQuery,
  answer,
  narration,
  prompt
}) {
  const queryStart = currentQuery?.[0] ?? null;
  const queryEnd = currentQuery?.[1] ?? null;
  return {
    step: trace.length,
    phase,
    codeSteps: [...codeSteps],
    prefixBuiltThrough,
    currentValueIndex,
    currentValue: currentValueIndex === null ? null : values[currentValueIndex],
    currentQueryIndex,
    currentQuery: currentQuery === null ? null : [...currentQuery],
    queryStart,
    queryEnd,
    leftPrefixIndex: queryStart,
    rightPrefixIndex: queryEnd === null ? null : queryEnd + 1,
    answer,
    answers: [...answers],
    views: {
      values: buildValuesView(values, phase, currentValueIndex, currentQuery),
      prefix: buildPrefixView(prefix, phase, prefixBuiltThrough, currentValueIndex, currentQuery, answer)
    },
    narration,
    prompt
  };
}

function buildValuesView(values, phase, currentValueIndex, currentQuery) {
  const isBuilding = phase === "build-prefix";
  const isQuery = phase === "answer-query";
  const [queryStart, queryEnd] = currentQuery ?? [null, null];
  const markers = [];
  const annotations = [];

  if (isBuilding) {
    markers.push({ index: currentValueIndex, kind: "source", label: "add this value" });
    annotations.push({
      index: currentValueIndex,
      label: `add ${formatNumber(values[currentValueIndex])}`
    });
  }
  if (isQuery) {
    markers.push({ index: queryStart, kind: "query-start", label: "query start" });
    markers.push({ index: queryEnd, kind: "query-end", label: "query end" });
    annotations.push({ index: queryStart, label: "inclusive start" });
    if (queryEnd !== queryStart) {
      annotations.push({ index: queryEnd, label: "inclusive end" });
    }
  }

  return {
    values: [...values],
    activeIndices: isBuilding
      ? [currentValueIndex]
      : isQuery
        ? [...new Set([queryStart, queryEnd])]
        : [],
    ranges: isBuilding
      ? [{ start: 0, end: currentValueIndex, kind: "processed", label: "processed values" }]
      : isQuery
        ? [{ start: queryStart, end: queryEnd, kind: "query", label: "requested range" }]
        : [],
    markers,
    annotations,
    changedIndices: []
  };
}

function buildPrefixView(prefix, phase, builtThrough, currentValueIndex, currentQuery, answer) {
  const isBuilding = phase === "build-prefix";
  const isQuery = phase === "answer-query";
  const [queryStart, queryEnd] = currentQuery ?? [null, null];
  const rightPrefixIndex = isQuery ? queryEnd + 1 : null;
  const markers = [];
  const annotations = [];

  if (phase === "initialize") {
    markers.push({ index: 0, kind: "base", label: "leading zero" });
    annotations.push({ index: 0, label: "empty-prefix sum" });
  }
  if (isBuilding) {
    markers.push({ index: currentValueIndex, kind: "previous", label: "previous prefix" });
    markers.push({ index: currentValueIndex + 1, kind: "next", label: "new prefix" });
    annotations.push({
      index: currentValueIndex + 1,
      label: `built as ${formatNumber(prefix[currentValueIndex + 1])}`
    });
  }
  if (isQuery) {
    markers.push({ index: queryStart, kind: "subtract", label: "subtract" });
    markers.push({ index: rightPrefixIndex, kind: "add", label: "range end prefix" });
    annotations.push({
      index: rightPrefixIndex,
      label: `difference is ${formatNumber(answer)}`
    });
  }
  for (let index = builtThrough + 1; index < prefix.length; index += 1) {
    annotations.push({ index, label: "pending" });
  }

  return {
    values: [...prefix],
    activeIndices: isBuilding
      ? [currentValueIndex, currentValueIndex + 1]
      : isQuery
        ? [queryStart, rightPrefixIndex]
        : [],
    ranges: [{ start: 0, end: builtThrough, kind: "built", label: "built prefix" }],
    markers,
    annotations,
    changedIndices: isBuilding ? [currentValueIndex + 1] : []
  };
}
