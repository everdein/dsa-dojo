import {
  factorial,
  validateFactorialInput
} from "../../recursion/factorial.mjs";
import { formatNumber } from "./input.mjs";

export { factorial };

export function buildFactorialTrace(value) {
  validateFactorialInput(value);

  const frames = [];
  const trace = [];
  let callsMade = 0;
  let maximumDepth = 0;
  let multiplications = 0;
  let returnedValue = null;

  trace.push(createStep({
    trace,
    phase: "initialize",
    codeSteps: ["initialize"],
    input: value,
    frames,
    callsMade,
    maximumDepth,
    multiplications,
    returnedValue,
    activeFrameId: null,
    changedFrameId: null,
    annotation: null,
    narration: `Begin factorial(${value}) with an empty call stack.`,
    prompt: "Which condition must eventually stop the recursive calls?"
  }));

  for (let argument = value; ; argument -= 1) {
    const frame = {
      id: factorialFrameId(argument),
      argument,
      returnValue: null
    };
    frames.push(frame);
    callsMade += 1;
    maximumDepth = Math.max(maximumDepth, frames.length);

    trace.push(createStep({
      trace,
      phase: "call",
      codeSteps: ["call-function", "validate"],
      input: value,
      frames,
      callsMade,
      maximumDepth,
      multiplications,
      returnedValue,
      activeFrameId: frame.id,
      changedFrameId: frame.id,
      annotation: {
        frameId: frame.id,
        label: argument <= 1 ? "check the base case" : `received argument ${argument}`
      },
      narration: `Call factorial(${argument}) and push its frame at depth ${frames.length}.`,
      prompt: argument <= 1
        ? "Does this argument satisfy the base case?"
        : `Can factorial(${argument}) return before factorial(${argument - 1}) does?`
    }));

    if (argument <= 1) {
      frame.returnValue = 1;
      returnedValue = 1;
      trace.push(createStep({
        trace,
        phase: "base-case",
        codeSteps: ["check-base", "return-base"],
        input: value,
        frames,
        callsMade,
        maximumDepth,
        multiplications,
        returnedValue,
        activeFrameId: frame.id,
        changedFrameId: frame.id,
        annotation: { frameId: frame.id, label: "returns 1" },
        narration: `${argument} is at most 1, so factorial(${argument}) returns the base value 1 without another call.`,
        prompt: "Which waiting frame receives this returned value?"
      }));
      break;
    }

    trace.push(createStep({
      trace,
      phase: "descend",
      codeSteps: ["check-base", "recursive-call"],
      input: value,
      frames,
      callsMade,
      maximumDepth,
      multiplications,
      returnedValue,
      activeFrameId: null,
      changedFrameId: null,
      annotation: { frameId: frame.id, label: `waiting for factorial(${argument - 1})` },
      narration: `${argument} is not a base case. This frame pauses while factorial(${argument - 1}) is called.`,
      prompt: `What argument will the next frame receive?`
    }));
  }

  while (frames.length > 1) {
    const completedFrame = frames.pop();
    const parentFrame = frames.at(-1);
    const childValue = completedFrame.returnValue;
    returnedValue = parentFrame.argument * childValue;
    parentFrame.returnValue = returnedValue;
    multiplications += 1;

    trace.push(createStep({
      trace,
      phase: "unwind",
      codeSteps: ["multiply-return"],
      input: value,
      frames,
      callsMade,
      maximumDepth,
      multiplications,
      returnedValue,
      activeFrameId: parentFrame.id,
      changedFrameId: parentFrame.id,
      annotation: {
        frameId: parentFrame.id,
        label: `${parentFrame.argument} × ${formatNumber(childValue)} = ${formatNumber(returnedValue)}`
      },
      narration: `factorial(${completedFrame.argument}) returned ${formatNumber(childValue)}. Resume factorial(${parentFrame.argument}) and compute ${parentFrame.argument} × ${formatNumber(childValue)} = ${formatNumber(returnedValue)}.`,
      prompt: frames.length === 1
        ? "Has the original call now received its final value?"
        : "Which earlier frame resumes next?"
    }));
  }

  const result = factorial(value);
  frames.pop();
  trace.push({
    ...createStep({
      trace,
      phase: "complete",
      codeSteps: ["return-result"],
      input: value,
      frames,
      callsMade,
      maximumDepth,
      multiplications,
      returnedValue: result,
      activeFrameId: null,
      changedFrameId: null,
      annotation: null,
      narration: `The original call returns ${formatNumber(result)}. Every frame has left the call stack.`,
      prompt: "How many recursive calls and multiplications did this input require?"
    }),
    result
  });

  return trace;
}

export function factorialFrameId(argument) {
  validateFactorialInput(argument);
  return `frame-${argument}`;
}

function createStep({
  trace,
  phase,
  codeSteps,
  input,
  frames,
  callsMade,
  maximumDepth,
  multiplications,
  returnedValue,
  activeFrameId,
  changedFrameId,
  annotation,
  narration,
  prompt
}) {
  const frameSnapshots = frames.map((frame) => ({ ...frame }));
  return {
    step: trace.length,
    phase,
    codeSteps,
    input,
    currentArgument: frameSnapshots.at(-1)?.argument ?? null,
    callsMade,
    stackDepth: frameSnapshots.length,
    maximumDepth,
    multiplications,
    returnedValue,
    frames: frameSnapshots.map((frame) => ({ ...frame })),
    view: {
      structure: "stack",
      items: frameSnapshots.map((frame) => ({
        id: frame.id,
        value: frame.returnValue === null
          ? `factorial(${frame.argument})`
          : `factorial(${frame.argument}) = ${formatNumber(frame.returnValue)}`,
        state: frame.id === activeFrameId
          ? phase === "base-case" ? "base-case" : frame.returnValue === null ? "active" : "returning"
          : "waiting"
      })),
      topItemId: frameSnapshots.at(-1)?.id ?? null,
      activeItemIds: activeFrameId === null ? [] : [activeFrameId],
      changedItemIds: changedFrameId === null ? [] : [changedFrameId],
      annotations: annotation === null ? [] : [{
        itemId: annotation.frameId,
        label: annotation.label
      }]
    },
    narration,
    prompt
  };
}
