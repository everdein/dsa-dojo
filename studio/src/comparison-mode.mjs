import { parseRecursiveFibonacciInput } from "../../recursion/fibonacci.mjs";
import { buildTrace } from "./lesson-contract.mjs";
import { parseNumberList } from "./input.mjs";

export const comparisonFamilies = Object.freeze([
  Object.freeze({
    id: "sorting-strategies",
    label: "Sorting strategies",
    eyebrow: "ONE RESULT · DIFFERENT WORK",
    summary: "Run the same values through iterative and divide-and-conquer sorts, then compare how their state changes and complexity differ.",
    lessonIds: Object.freeze([
      "sorting/bubble-sort",
      "sorting/insertion-sort",
      "sorting/merge-sort",
      "sorting/quick-sort"
    ]),
    defaultPair: Object.freeze(["sorting/bubble-sort", "sorting/merge-sort"]),
    input: Object.freeze({
      fields: Object.freeze([Object.freeze({
        id: "values",
        label: "Shared values (1-8 finite numbers)",
        type: "text",
        inputMode: "decimal",
        placeholder: "5, 1, 4, 2, 8"
      })]),
      help: "Both algorithms receive an independent copy of the exact same array.",
      defaultValue: Object.freeze({ values: Object.freeze([5, 1, 4, 2, 8]) }),
      sampleValue: Object.freeze({ values: Object.freeze([1, 2, 3, 4, 5]) }),
      parse: ({ values }) => ({ values: parseNumberList(values, { maximumLength: 8 }) }),
      serialize: ({ values }) => ({ values: values.join(", ") })
    })
  }),
  Object.freeze({
    id: "fibonacci-strategies",
    label: "Fibonacci recursion",
    eyebrow: "SAME RECURRENCE · DIFFERENT WORK",
    summary: "Watch memoization replace repeated recursive subtrees with cache hits while preserving the same Fibonacci result.",
    lessonIds: Object.freeze([
      "recursion/recursive-fibonacci",
      "dynamic-programming/memoized-fibonacci"
    ]),
    defaultPair: Object.freeze([
      "recursion/recursive-fibonacci",
      "dynamic-programming/memoized-fibonacci"
    ]),
    input: Object.freeze({
      fields: Object.freeze([Object.freeze({
        id: "value",
        label: "Shared Fibonacci input (0-6)",
        type: "number",
        inputMode: "numeric",
        min: "0",
        max: "6",
        step: "1"
      })]),
      help: "Both algorithms compute the same n; the naive call tree is intentionally capped at 6.",
      defaultValue: Object.freeze({ value: 6 }),
      sampleValue: Object.freeze({ value: 5 }),
      parse: ({ value }) => ({ value: parseRecursiveFibonacciInput(value) }),
      serialize: ({ value }) => ({ value: String(value) })
    })
  })
]);

const familyById = new Map(comparisonFamilies.map((family) => [family.id, family]));

export function getComparisonFamily(id) {
  const family = familyById.get(id);
  if (!family) throw new Error(`Unknown comparison family: ${id}`);
  return family;
}

export function comparisonFamilyForLesson(lessonId) {
  return comparisonFamilies.find((family) => family.lessonIds.includes(lessonId)) ?? null;
}

export function createComparisonRun({ family, leftLesson, rightLesson, input, speed = 850 }) {
  assertComparisonPair(family, leftLesson, rightLesson);
  const sharedInput = clone(input);
  const leftInput = clone(sharedInput);
  const rightInput = clone(sharedInput);
  const leftTrace = buildTrace(leftLesson, leftInput);
  const rightTrace = buildTrace(rightLesson, rightInput);
  const leftResult = leftLesson.solve(clone(sharedInput));
  const rightResult = rightLesson.solve(clone(sharedInput));
  if (!deepEqual(leftResult, rightResult)) {
    throw new Error(`${leftLesson.catalogLabel} and ${rightLesson.catalogLabel} did not produce the same result.`);
  }
  return {
    familyId: family.id,
    input: sharedInput,
    left: { lessonId: leftLesson.id, trace: leftTrace, index: 0, result: clone(leftResult) },
    right: { lessonId: rightLesson.id, trace: rightTrace, index: 0, result: clone(rightResult) },
    speed: clampSpeed(speed),
    status: comparisonComplete(leftTrace, 0, rightTrace, 0) ? "complete" : "ready"
  };
}

export function comparisonReducer(run, action) {
  const leftLast = run.left.trace.length - 1;
  const rightLast = run.right.trace.length - 1;
  let leftIndex = run.left.index;
  let rightIndex = run.right.index;
  let status = run.status;

  switch (action.type) {
    case "NEXT":
    case "TICK":
      if (action.type === "TICK" && run.status !== "playing") return run;
      leftIndex = Math.min(leftLast, leftIndex + 1);
      rightIndex = Math.min(rightLast, rightIndex + 1);
      status = comparisonComplete(run.left.trace, leftIndex, run.right.trace, rightIndex)
        ? "complete"
        : action.type === "TICK" ? "playing" : "paused";
      break;
    case "PREVIOUS":
      leftIndex = Math.max(0, leftIndex - 1);
      rightIndex = Math.max(0, rightIndex - 1);
      status = leftIndex === 0 && rightIndex === 0 ? "ready" : "paused";
      break;
    case "STEP_SIDE": {
      if (!Object.hasOwn(run, action.side)) throw new Error(`Unknown comparison side: ${action.side}`);
      const last = action.side === "left" ? leftLast : rightLast;
      const nextIndex = clampInteger(action.index, 0, last);
      if (action.side === "left") leftIndex = nextIndex;
      else rightIndex = nextIndex;
      status = comparisonComplete(run.left.trace, leftIndex, run.right.trace, rightIndex)
        ? "complete"
        : leftIndex === 0 && rightIndex === 0 ? "ready" : "paused";
      break;
    }
    case "PLAY":
      if (run.status === "complete") {
        leftIndex = 0;
        rightIndex = 0;
      }
      status = "playing";
      break;
    case "PAUSE":
      status = comparisonComplete(run.left.trace, leftIndex, run.right.trace, rightIndex)
        ? "complete"
        : leftIndex === 0 && rightIndex === 0 ? "ready" : "paused";
      break;
    case "RESET":
      leftIndex = 0;
      rightIndex = 0;
      status = "ready";
      break;
    case "SET_SPEED":
      return { ...run, speed: clampSpeed(action.speed) };
    default:
      return run;
  }

  return {
    ...run,
    left: { ...run.left, index: leftIndex },
    right: { ...run.right, index: rightIndex },
    status
  };
}

export function comparisonSummary(run) {
  const leftTransitions = run.left.trace.length - 1;
  const rightTransitions = run.right.trace.length - 1;
  return {
    resultsMatch: deepEqual(run.left.result, run.right.result),
    resultText: formatResult(run.left.result),
    leftTransitions,
    rightTransitions,
    transitionDifference: Math.abs(leftTransitions - rightTransitions),
    fewerTransitions: leftTransitions === rightTransitions
      ? "tie"
      : leftTransitions < rightTransitions ? "left" : "right",
    bothComplete: run.left.index === leftTransitions && run.right.index === rightTransitions
  };
}

function assertComparisonPair(family, leftLesson, rightLesson) {
  if (!familyById.has(family?.id)) throw new Error("Comparison requires a registered family.");
  for (const lesson of [leftLesson, rightLesson]) {
    if (!lesson || !family.lessonIds.includes(lesson.id)) {
      throw new Error(`Lesson does not belong to ${family.label}.`);
    }
  }
  if (leftLesson.id === rightLesson.id) throw new Error("Choose two different algorithms to compare.");
}

function comparisonComplete(leftTrace, leftIndex, rightTrace, rightIndex) {
  return leftIndex === leftTrace.length - 1 && rightIndex === rightTrace.length - 1;
}

function clone(value) {
  return structuredClone(value);
}

function deepEqual(left, right) {
  if (Object.is(left, right)) return true;
  if (Array.isArray(left) || Array.isArray(right)) {
    return Array.isArray(left)
      && Array.isArray(right)
      && left.length === right.length
      && left.every((value, index) => deepEqual(value, right[index]));
  }
  if (!left || !right || typeof left !== "object" || typeof right !== "object") return false;
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  return leftKeys.length === rightKeys.length
    && leftKeys.every((key) => Object.hasOwn(right, key) && deepEqual(left[key], right[key]));
}

function formatResult(result) {
  if (Array.isArray(result)) return `[${result.join(", ")}]`;
  if (result && typeof result === "object") return JSON.stringify(result);
  return String(result);
}

function clampSpeed(speed) {
  return Math.max(250, Math.min(Number.isFinite(speed) ? speed : 850, 2000));
}

function clampInteger(value, minimum, maximum) {
  const integer = Number.isInteger(value) ? value : minimum;
  return Math.max(minimum, Math.min(integer, maximum));
}
