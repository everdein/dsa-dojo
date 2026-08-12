import {
  formatPermutationValues,
  generatePermutations,
  maximumPermutationValues,
  parsePermutationValues
} from "../../../backtracking/permutations.mjs";
import { formatNumber } from "../input.mjs";
import { buildPermutationsTrace } from "../permutations.mjs";

export const permutationsLesson = {
  id: "backtracking/permutations",
  order: 46,
  topic: "Backtracking",
  prerequisites: ["recursion/factorial"],
  patterns: ["backtracking", "choose-recurse-undo"],
  catalogLabel: "Generate Permutations",
  catalogDescription: "Choose, recurse, record, and undo without losing state.",
  title: "Generate every permutation with backtracking",
  summary: "At each depth, choose one unused value, recurse until the path is complete, record a copy, then undo the choice before exploring its siblings.",
  views: [
    { id: "choices", renderer: "array", heading: "Input choices" },
    { id: "path", renderer: "array", heading: "Current path" },
    { id: "tree", renderer: "branching", heading: "Choice tree" }
  ],
  input: {
    heading: "Your distinct values",
    fields: [{
      id: "values",
      label: `Enter 1-${maximumPermutationValues} distinct finite numbers`,
      type: "text",
      inputMode: "decimal",
      placeholder: "1, 2, 3"
    }],
    help: "Input order determines DFS result order. The three-value bound keeps the complete choice tree readable while still exposing every backtracking phase.",
    defaultValue: { values: [1, 2, 3] },
    sampleValue: { values: [-2, 0, 4] },
    parse: ({ values }) => ({ values: parsePermutationValues(values) }),
    serialize: ({ values }) => ({ values: formatPermutationValues(values) })
  },
  solve: ({ values }) => generatePermutations(values),
  buildTrace: ({ values }) => buildPermutationsTrace(values),
  code: {
    title: "Choose, recurse, record, undo",
    filename: "permutations.mjs",
    sourcePath: "backtracking/permutations.mjs",
    lines: [
      { number: 46, text: "export function generatePermutations(values) {", steps: ["function"] },
      { number: 47, text: "  validatePermutationValues(values);", steps: ["initialize"] },
      { number: 48, text: "  const used = Array(values.length).fill(false);", steps: ["initialize"] },
      { number: 49, text: "  const path = [];", steps: ["initialize"] },
      { number: 50, text: "  const permutations = [];", steps: ["initialize"] },
      { number: 52, text: "  function visit() {", steps: ["recurse"] },
      { number: 53, text: "    if (path.length === values.length) {", steps: ["check-complete"] },
      { number: 54, text: "      permutations.push([...path]);", steps: ["record"] },
      { number: 57, text: "    for (let index = 0; index < values.length; index += 1) {", steps: ["scan-choices"] },
      { number: 58, text: "      if (used[index]) continue;", steps: ["scan-choices"] },
      { number: 59, text: "      used[index] = true;", steps: ["choose"] },
      { number: 60, text: "      path.push(values[index]);", steps: ["choose"] },
      { number: 61, text: "      visit();", steps: ["recurse"] },
      { number: 62, text: "      path.pop();", steps: ["undo"] },
      { number: 63, text: "      used[index] = false;", steps: ["undo"] },
      { number: 67, text: "  visit();", steps: ["recurse"] },
      { number: 68, text: "  return permutations;", steps: ["return-results"] },
      { number: 69, text: "}", steps: ["function"] }
    ]
  },
  stats: [
    {
      label: "Depth",
      value: (step) => `${step.depth}/${step.views.choices.values.length}`,
      detail: () => "chosen values"
    },
    {
      label: "Current value",
      value: (step) => step.currentValue === null ? "-" : formatNumber(step.currentValue),
      detail: (step) => step.valueIndex === null ? "no active choice" : `source index ${step.valueIndex}`
    },
    {
      label: "Decisions",
      value: (step) => String(step.decisionCount),
      detail: () => "choice-tree nodes"
    },
    {
      label: "Permutations",
      accent: true,
      value: (step) => String(step.permutationCount),
      detail: (step) => step.phase === "complete" ? "all results" : "recorded so far"
    }
  ],
  complexity: {
    chip: "CHOOSE → RECURSE → UNDO",
    time: "O(n · n!)",
    space: "O(n · n!)",
    spaceLabel: "total space",
    explanation: "There are n! complete paths and copying each result costs O(n). The mutable DFS path and used flags need O(n) auxiliary space; the returned results dominate total space."
  },
  guide: {
    heading: "Undo exactly what the matching choice changed."
  },
  legend: [
    { kind: "available", label: "unused choice" },
    { kind: "used", label: "in current path" },
    { kind: "chosen", label: "chosen depth" },
    { kind: "recorded", label: "complete permutation" },
    { kind: "current", label: "current recursion node" },
    { kind: "undo", label: "backtracking" },
    { kind: "backtrack", label: "return to parent" }
  ],
  reflection: {
    eyebrow: "BEFORE YOU MOVE ON",
    title: "Why must undo mirror choose?",
    body: "Choosing changes both the current path and the used flag. Explain how failing to reverse either change would corrupt the sibling branches that DFS explores next."
  }
};
