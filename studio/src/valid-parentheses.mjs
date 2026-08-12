import {
  expectedOpeningBracket,
  isOpeningBracket,
  isValidParentheses,
  validateParenthesesInput
} from "../../stacks/valid-parentheses.mjs";

export { isValidParentheses };

export function buildValidParenthesesTrace(text) {
  validateParenthesesInput(text);
  const characters = Array.from(text);
  const stack = [];
  const processed = new Set();
  const ignored = new Set();
  const trace = [];
  let valid = true;
  let pairs = 0;

  trace.push(createStep({
    trace,
    phase: "initialize",
    codeSteps: ["initialize"],
    characters,
    stack,
    processed,
    ignored,
    currentIndex: null,
    pairs,
    valid,
    narration: "Start with an empty stack. It will remember opening brackets that still need a matching closer.",
    prompt: "Which opening bracket should be closest to the top after the first few characters?"
  }));

  for (let index = 0; index < characters.length; index += 1) {
    const character = characters[index];
    if (/^\s$/u.test(character)) {
      ignored.add(index);
      trace.push(createStep({
        trace,
        phase: "skip",
        codeSteps: ["scan", "skip-space"],
        characters,
        stack,
        processed,
        ignored,
        currentIndex: index,
        pairs,
        valid,
        narration: `Ignore whitespace at position ${index}; it cannot change bracket balance.`,
        prompt: "What remains on top of the stack?"
      }));
      continue;
    }

    if (isOpeningBracket(character)) {
      stack.push({ id: `item-${index}`, value: character, sourceIndex: index, state: "waiting" });
      processed.add(index);
      trace.push(createStep({
        trace,
        phase: "push",
        codeSteps: ["scan", "push-opener"],
        characters,
        stack,
        processed,
        ignored,
        currentIndex: index,
        pairs,
        valid,
        activeItemIds: [`item-${index}`],
        changedItemIds: [`item-${index}`],
        stackAnnotations: [{ itemId: `item-${index}`, label: `from position ${index}` }],
        narration: `Push ${character}. It is now the most recent unmatched opener.`,
        prompt: "Which closing bracket would match the current top?"
      }));
      continue;
    }

    const expected = expectedOpeningBracket(character);
    const top = stack.at(-1) ?? null;
    if (!top || top.value !== expected) {
      valid = false;
      processed.add(index);
      trace.push(createStep({
        trace,
        phase: "mismatch",
        codeSteps: ["scan", "check-closer", "return-false"],
        characters,
        stack: stack.map((item, itemIndex) => itemIndex === stack.length - 1 ? { ...item, state: "mismatch" } : item),
        processed,
        ignored,
        currentIndex: index,
        pairs,
        valid,
        activeItemIds: top ? [top.id] : [],
        stackAnnotations: top ? [{ itemId: top.id, label: `expected ${expected}` }] : [],
        narration: top
          ? `${character} needs ${expected}, but ${top.value} is on top. The nesting order is invalid.`
          : `${character} needs ${expected}, but the stack is empty. The sequence is invalid.`,
        prompt: "Why can no later character repair this mismatch?"
      }));
      break;
    }

    trace.push(createStep({
      trace,
      phase: "match",
      codeSteps: ["scan", "check-closer"],
      characters,
      stack: stack.map((item, itemIndex) => itemIndex === stack.length - 1 ? { ...item, state: "matched" } : item),
      processed,
      ignored,
      currentIndex: index,
      pairs,
      valid,
      activeItemIds: [top.id],
      stackAnnotations: [{ itemId: top.id, label: `matches ${character}` }],
      narration: `${character} matches the top opener ${top.value}.`,
      prompt: "What should happen to this matched opener now?"
    }));
    stack.pop();
    processed.add(index);
    pairs += 1;
    trace.push(createStep({
      trace,
      phase: "pop",
      codeSteps: ["pop-match"],
      characters,
      stack,
      processed,
      ignored,
      currentIndex: index,
      pairs,
      valid,
      narration: `Pop the matched opener. ${stack.length === 0 ? "The stack is empty again." : `${stack.at(-1).value} is exposed on top.`}`,
      prompt: "Does the remaining stack still preserve the nesting order?"
    }));
  }

  if (valid && stack.length > 0) valid = false;
  trace.push({
    ...createStep({
      trace,
      phase: "complete",
      codeSteps: valid ? ["return-empty"] : ["return-false"],
      characters,
      stack,
      processed,
      ignored,
      currentIndex: null,
      pairs,
      valid,
      narration: valid
        ? "Every closer matched the most recent opener, and the stack finished empty."
        : stack.length > 0
          ? "Input ended with unmatched opening brackets still on the stack."
          : "A closing bracket broke the required nesting order.",
      prompt: "Why are both conditions—no mismatch and an empty final stack—necessary?"
    }),
    result: valid
  });
  return trace;
}

function createStep({
  trace,
  phase,
  codeSteps,
  characters,
  stack,
  processed,
  ignored,
  currentIndex,
  pairs,
  valid,
  narration,
  prompt,
  activeItemIds = [],
  changedItemIds = [],
  stackAnnotations = []
}) {
  const items = stack.map(({ id, value, state }) => ({ id, value, state }));
  return {
    step: trace.length,
    phase,
    codeSteps,
    currentIndex,
    stackSize: items.length,
    pairs,
    valid,
    views: {
      characters: {
        values: [...characters],
        activeIndices: currentIndex === null ? [] : [currentIndex],
        ranges: [],
        markers: currentIndex === null ? [] : [{ index: currentIndex, kind: valid ? "current" : "mismatch", label: valid ? "current" : "mismatch" }],
        annotations: [
          ...[...processed].map((index) => ({ index, label: "processed" })),
          ...[...ignored].filter((index) => !processed.has(index)).map((index) => ({ index, label: "ignored" }))
        ],
        changedIndices: []
      },
      stack: {
        structure: "stack",
        items,
        topItemId: items.at(-1)?.id ?? null,
        activeItemIds: [...activeItemIds],
        changedItemIds: [...changedItemIds],
        annotations: stackAnnotations.map((annotation) => ({ ...annotation }))
      }
    },
    narration,
    prompt
  };
}
