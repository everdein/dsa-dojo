import {
  climbStairs,
  validateClimbingStairsInput
} from "../../dynamic-programming/climbing-stairs.mjs";
import { formatNumber } from "./input.mjs";

export { climbStairs };

export function buildClimbingStairsTrace(steps) {
  validateClimbingStairsInput(steps);
  const trace = [];
  const table = Array(steps + 1).fill(0);
  table[0] = 1;
  let builtThrough = 0;
  let transitions = 0;
  let twoBack = 1;
  let oneBack = 1;

  const addStep = ({ phase, codeSteps, current, dependencies = [], changedTable = [], changedState = [], narration, prompt, result }) => {
    const step = {
      step: trace.length,
      phase,
      codeSteps,
      current,
      builtThrough,
      transitions,
      twoBack,
      oneBack,
      views: {
        table: {
          values: [...table],
          activeIndices: current === null ? [] : [current],
          ranges: [{ start: 0, end: builtThrough, kind: "settled", label: "computed states" }],
          markers: dependencies.map((index, dependencyIndex) => ({ index, kind: dependencyIndex === 0 ? "left" : "right", label: dependencyIndex === 0 ? "ways(i - 2)" : "ways(i - 1)" })),
          annotations: table.map((value, index) => ({ index, label: index <= builtThrough ? `ways(${index}) = ${formatNumber(value)}` : "pending" })),
          changedIndices: [...changedTable]
        },
        state: {
          values: [twoBack, oneBack],
          activeIndices: current === null ? [] : [0, 1],
          ranges: [],
          markers: [
            { index: 0, kind: "left", label: "two back" },
            { index: 1, kind: "right", label: "one back" }
          ],
          annotations: [
            { index: 0, label: "compressed older state" },
            { index: 1, label: "compressed latest state" }
          ],
          changedIndices: [...changedState]
        }
      },
      narration,
      prompt
    };
    if (result !== undefined) step.result = result;
    trace.push(step);
  };

  addStep({
    phase: "base-zero",
    codeSteps: ["initialize", "base-zero"],
    current: 0,
    changedTable: [0],
    narration: "There is one way to reach step 0: take no moves. This empty path is the first base state.",
    prompt: steps === 0 ? "Is the target already solved?" : "What second base state starts the recurrence?"
  });

  if (steps >= 1) {
    table[1] = 1;
    builtThrough = 1;
    addStep({
      phase: "base-one",
      codeSteps: ["base-one"],
      current: 1,
      changedTable: [1],
      narration: "There is one way to reach step 1: take one single-step move.",
      prompt: "Which two previous states lead into step 2?"
    });
  }

  for (let current = 2; current <= steps; current += 1) {
    transitions += 1;
    const next = twoBack + oneBack;
    table[current] = next;
    addStep({
      phase: "transition",
      codeSteps: ["loop", "add-dependencies"],
      current,
      dependencies: [current - 2, current - 1],
      changedTable: [current],
      narration: `Every path to step ${current} comes from step ${current - 2} or ${current - 1}: ${formatNumber(twoBack)} + ${formatNumber(oneBack)} = ${formatNumber(next)}.`,
      prompt: "Why are these two predecessor sets disjoint and complete?"
    });
    [twoBack, oneBack] = [oneBack, next];
    builtThrough = current;
    addStep({
      phase: "compress",
      codeSteps: ["compress-state"],
      current,
      changedState: [0, 1],
      narration: `Shift the two rolling states forward. Earlier table entries are no longer needed for the next transition.`,
      prompt: "Which two values will the next state depend on?"
    });
  }

  const result = climbStairs(steps);
  addStep({
    phase: "complete",
    codeSteps: ["return"],
    current: steps,
    narration: `There are ${formatNumber(result)} distinct ways to reach step ${steps}.`,
    prompt: "Why does state compression change space but not the recurrence?",
    result
  });
  return trace;
}
