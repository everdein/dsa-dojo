import {
  climbStairs,
  maximumClimbingStairsInput,
  parseClimbingStairsInput
} from "../../../dynamic-programming/climbing-stairs.mjs";
import { buildClimbingStairsTrace } from "../climbing-stairs.mjs";

export const climbingStairsLesson = {
  id: "dynamic-programming/climbing-stairs",
  order: 51,
  topic: "Dynamic Programming",
  prerequisites: ["dynamic-programming/memoized-fibonacci"],
  patterns: ["dynamic-programming", "state-transition", "space-optimization"],
  catalogLabel: "Climbing Stairs",
  catalogDescription: "Define a recurrence, fill its states, then keep only two dependencies.",
  title: "Count stair paths with a DP transition",
  summary: "A path to step i ends with either a one-step move from i - 1 or a two-step move from i - 2. Add those disjoint possibilities, then compress the table to two rolling values.",
  views: [
    { id: "table", renderer: "array", heading: "Full DP table" },
    { id: "state", renderer: "array", heading: "O(1) rolling state" }
  ],
  input: {
    fields: [{ id: "steps", label: `Enter a whole number from 0 to ${maximumClimbingStairsInput}`, type: "number", inputMode: "numeric", min: "0", max: String(maximumClimbingStairsInput), step: "1" }],
    help: "ways(0) = 1 counts the empty path, which lets the recurrence work uniformly.",
    defaultValue: { steps: 6 },
    sampleValue: { steps: 10 },
    parse: ({ steps }) => ({ steps: parseClimbingStairsInput(steps) }),
    serialize: ({ steps }) => ({ steps: String(steps) })
  },
  solve: ({ steps }) => climbStairs(steps),
  buildTrace: ({ steps }) => buildClimbingStairsTrace(steps),
  code: {
    title: "Keep only the states the transition needs",
    filename: "climbing-stairs.mjs",
    sourcePath: "dynamic-programming/climbing-stairs.mjs",
    lines: [
      { number: 10, text: "export function climbStairs(steps) {", steps: ["initialize"] },
      { number: 12, text: "  if (steps <= 1) return 1;", steps: ["base-zero", "base-one"] },
      { number: 13, text: "  let twoBack = 1;", steps: ["initialize"] },
      { number: 14, text: "  let oneBack = 1;", steps: ["base-one"] },
      { number: 15, text: "  for (let current = 2; current <= steps; current += 1) {", steps: ["loop"] },
      { number: 16, text: "    [twoBack, oneBack] = [oneBack, twoBack + oneBack];", steps: ["add-dependencies", "compress-state"] },
      { number: 18, text: "  return oneBack;", steps: ["return"] }
    ]
  },
  stats: [
    { label: "Current step", value: (step) => step.current === null ? "-" : String(step.current) },
    { label: "Built states", value: (step) => String(step.builtThrough + 1), detail: () => "including step 0" },
    { label: "Transitions", value: (step) => String(step.transitions) },
    { label: "Latest ways", accent: true, value: (step) => formatState(step.oneBack) }
  ],
  complexity: {
    chip: "STATE TRANSITION",
    time: "O(n)",
    space: "O(1)",
    spaceLabel: "optimized state",
    explanation: "One transition is evaluated per step. The full teaching table uses O(n), but production code needs only the two predecessor values and therefore O(1) auxiliary space."
  },
  guide: { heading: "Define what one state means before writing its transition." },
  legend: [
    { kind: "settled", label: "computed state" },
    { kind: "left", label: "two-back dependency" },
    { kind: "right", label: "one-back dependency" },
    { kind: "changed", label: "new state" }
  ],
  reflection: {
    eyebrow: "BEFORE YOU MOVE ON",
    title: "Why does ways(0) equal one?",
    body: "Describe the empty path and show how that base value makes ways(2) = ways(0) + ways(1) count the two valid routes without a special case."
  }
};

function formatState(value) {
  return String(value);
}
