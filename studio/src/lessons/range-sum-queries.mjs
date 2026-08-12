import {
  parseRangeQueries,
  rangeSumQueries
} from "../../../patterns/prefix-sums/range-sum-queries.mjs";
import { buildRangeSumQueriesTrace } from "../range-sum-queries.mjs";
import { formatNumber, parseNumberList } from "../input.mjs";

export const rangeSumQueriesLesson = {
  id: "patterns/prefix-sum-range-queries",
  order: 22,
  topic: "Patterns",
  prerequisites: ["arrays/sliding-window"],
  patterns: ["prefix-sum", "preprocessing", "range-query"],
  catalogLabel: "Prefix Sum Range Queries",
  catalogDescription: "Precompute cumulative totals so every later range query uses one subtraction.",
  title: "Answer range sums with a prefix array",
  summary: "Build cumulative sums once with a leading zero, then answer each inclusive range from two prefix positions.",
  views: [
    { id: "values", renderer: "array", heading: "Source values" },
    { id: "prefix", renderer: "array", heading: "Prefix sums (leading zero)" }
  ],
  input: {
    fields: [
      {
        id: "values",
        label: "Enter 1-10 finite numbers",
        type: "text",
        inputMode: "decimal",
        placeholder: "3, -1, 4, 2, 5"
      },
      {
        id: "queries",
        label: "Enter 1-8 inclusive ranges",
        type: "text",
        inputMode: "numeric",
        placeholder: "0-2, 1-4"
      }
    ],
    help: "Write each query as start-end. Both indices are included and must be inside the array.",
    defaultValue: {
      values: [3, -1, 4, 2, 5],
      queries: [[0, 2], [1, 4], [3, 3]]
    },
    sampleValue: {
      values: [-4, 6, -2, 7],
      queries: [[0, 3], [1, 1], [1, 3]]
    },
    parse: (fields) => {
      const values = parseNumberList(fields.values, { maximumLength: 10 });
      return {
        values,
        queries: parseRangeQueries(fields.queries, values.length)
      };
    },
    serialize: ({ values, queries }) => ({
      values: values.map(formatNumber).join(", "),
      queries: queries.map(([start, end]) => `${start}-${end}`).join(", ")
    })
  },
  solve: ({ values, queries }) => rangeSumQueries(values, queries),
  buildTrace: buildRangeSumQueriesTrace,
  code: {
    title: "Preprocess once, subtract for every query",
    filename: "range-sum-queries.mjs",
    sourcePath: "patterns/prefix-sums/range-sum-queries.mjs",
    lines: [
      { number: 38, text: "export function rangeSumQueries(values, queries) {", steps: ["function"] },
      { number: 39, text: "  validateRangeSumInput(values, queries);", steps: ["initialize-prefix"] },
      { number: 41, text: "  const prefix = [0];", steps: ["initialize-prefix"] },
      { number: 42, text: "  for (const value of values) {", steps: ["build-prefix"] },
      { number: 43, text: "    const next = prefix.at(-1) + value;", steps: ["build-prefix"] },
      { number: 44, text: "    assertFinitePrefix(next);", steps: ["build-prefix"] },
      { number: 45, text: "    prefix.push(next);", steps: ["build-prefix"] },
      { number: 46, text: "  }", steps: ["build-prefix"] },
      { number: 48, text: "  const answers = queries.map(([start, end]) => {", steps: ["answer-query"] },
      { number: 49, text: "    const answer = prefix[end + 1] - prefix[start];", steps: ["answer-query"] },
      { number: 50, text: "    assertFiniteAnswer(answer);", steps: ["answer-query"] },
      { number: 51, text: "    return answer;", steps: ["answer-query"] },
      { number: 52, text: "  });", steps: ["answer-query"] },
      { number: 54, text: "  return { prefix, answers };", steps: ["return-result"] },
      { number: 55, text: "}", steps: ["function"] }
    ]
  },
  stats: [
    {
      label: "Phase",
      value: (step) => phaseLabel(step.phase),
      detail: (step) => step.phase === "build-prefix"
        ? `prefix built through index ${step.prefixBuiltThrough}`
        : `${step.answers.length} of the queries answered`
    },
    {
      label: "Active item",
      value: (step) => activeItem(step),
      detail: (step) => activeDetail(step)
    },
    {
      label: "Latest answer",
      accent: true,
      value: (step) => step.answer === null ? "-" : formatNumber(step.answer),
      detail: (step) => step.currentQuery === null
        ? "no query active"
        : `inclusive range ${step.queryStart}-${step.queryEnd}`
    }
  ],
  complexity: {
    chip: "PREPROCESS ONCE",
    time: "O(n + q)",
    space: "O(n + q)",
    explanation: "Building n + 1 prefix sums costs O(n). Each of q queries then takes O(1), and the returned prefix and answer arrays use O(n + q) space."
  },
  guide: {
    heading: "Shift the right boundary by one."
  },
  legend: [
    { kind: "processed", label: "values already accumulated" },
    { kind: "built", label: "prefix cells already built" },
    { kind: "query", label: "requested inclusive range" },
    { kind: "subtract", label: "prefix value to subtract" },
    { kind: "add", label: "prefix value at end + 1" }
  ],
  reflection: {
    eyebrow: "BEFORE YOU MOVE ON",
    title: "Why is the leading zero useful?",
    body: "Try a query that starts at 0, a singleton query, and repeated queries. Explain why end + 1 and start identify exactly the values inside an inclusive range."
  }
};

function phaseLabel(phase) {
  if (phase === "build-prefix") return "Build prefix";
  if (phase === "answer-query") return "Answer query";
  if (phase === "complete") return "Complete";
  return "Initialize";
}

function activeItem(step) {
  if (step.currentValueIndex !== null) return `value ${step.currentValueIndex}`;
  if (step.currentQueryIndex !== null) return `query ${step.currentQueryIndex + 1}`;
  return "-";
}

function activeDetail(step) {
  if (step.currentValueIndex !== null) {
    return `add ${formatNumber(step.currentValue)} into prefix[${step.currentValueIndex + 1}]`;
  }
  if (step.currentQuery !== null) return `indices ${step.queryStart}-${step.queryEnd}`;
  return "waiting for the next phase";
}
