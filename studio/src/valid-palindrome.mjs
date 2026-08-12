import {
  isPalindrome,
  isPalindromeCharacter,
  normalizePalindromeCharacter,
  validatePalindromeInput
} from "../../strings/valid-palindrome.mjs";

export { isPalindrome };

export function buildValidPalindromeTrace(text) {
  validatePalindromeInput(text);

  const characters = Array.from(text);
  const trace = [];
  const ignoredIndices = new Set();
  const confirmedIndices = new Set();
  let left = 0;
  let right = characters.length - 1;
  let comparisons = 0;
  let matchedPairs = 0;
  let result = null;

  trace.push(createStep({
    trace,
    phase: "initialize",
    codeSteps: ["initialize"],
    characters,
    left,
    right,
    comparisons,
    matchedPairs,
    ignoredIndices,
    confirmedIndices,
    result,
    narration: "Place one pointer at each end of the original text. Only letters and numbers need to match.",
    prompt: "Prediction: which characters will the pointers compare first?"
  }));

  while (result === null) {
    const canContinue = left < right;
    trace.push(createStep({
      trace,
      phase: "check",
      codeSteps: ["check-pointers"],
      characters,
      left,
      right,
      comparisons,
      matchedPairs,
      ignoredIndices,
      confirmedIndices,
      result,
      narration: canContinue
        ? "The pointers have not met, so inspect both ends of the remaining candidate range."
        : left === right
          ? "The pointers met. A center character cannot break a palindrome."
          : "The pointers crossed, so every required pair matched.",
      prompt: canContinue
        ? "Should either pointer skip punctuation or whitespace before comparing?"
        : "Why is there no additional pair left to compare?"
    }));

    if (!canContinue) break;

    while (left < right && !isPalindromeCharacter(characters[left])) {
      const skippedIndex = left;
      ignoredIndices.add(skippedIndex);
      left += 1;
      trace.push(createStep({
        trace,
        phase: "skip-left",
        codeSteps: ["skip-left"],
        characters,
        left,
        right,
        comparisons,
        matchedPairs,
        ignoredIndices,
        confirmedIndices,
        result,
        actedIndex: skippedIndex,
        narration: `${formatCharacter(characters[skippedIndex])} at index ${skippedIndex} is not a letter or number, so left moves inward.`,
        prompt: "Punctuation does not affect the normalized phrase. What should left inspect next?"
      }));
    }

    while (left < right && !isPalindromeCharacter(characters[right])) {
      const skippedIndex = right;
      ignoredIndices.add(skippedIndex);
      right -= 1;
      trace.push(createStep({
        trace,
        phase: "skip-right",
        codeSteps: ["skip-right"],
        characters,
        left,
        right,
        comparisons,
        matchedPairs,
        ignoredIndices,
        confirmedIndices,
        result,
        actedIndex: skippedIndex,
        narration: `${formatCharacter(characters[skippedIndex])} at index ${skippedIndex} is not a letter or number, so right moves inward.`,
        prompt: "Keep the raw text in place while the pointer ignores this character."
      }));
    }

    if (left >= right) continue;

    const normalizedLeft = normalizePalindromeCharacter(characters[left]);
    const normalizedRight = normalizePalindromeCharacter(characters[right]);
    const matches = normalizedLeft === normalizedRight;
    comparisons += 1;

    if (matches) {
      confirmedIndices.add(left);
      confirmedIndices.add(right);
      matchedPairs += 1;
    } else {
      result = false;
    }

    trace.push(createStep({
      trace,
      phase: matches ? "match" : "mismatch",
      codeSteps: matches ? ["compare"] : ["compare", "return-false"],
      characters,
      left,
      right,
      comparisons,
      matchedPairs,
      ignoredIndices,
      confirmedIndices,
      result,
      normalizedLeft,
      normalizedRight,
      compared: true,
      matched: matches,
      narration: matches
        ? `${formatCharacter(characters[left])} and ${formatCharacter(characters[right])} both normalize to ${formatCharacter(normalizedLeft)}, so this pair matches.`
        : `${formatCharacter(characters[left])} normalizes to ${formatCharacter(normalizedLeft)}, but ${formatCharacter(characters[right])} normalizes to ${formatCharacter(normalizedRight)}. The text is not a palindrome.`,
      prompt: matches
        ? "This pair is settled. Where should both pointers move?"
        : "One unequal pair is enough to decide the result."
    }));

    if (!matches) break;

    left += 1;
    right -= 1;
    trace.push(createStep({
      trace,
      phase: "advance",
      codeSteps: ["move-pointers"],
      characters,
      left,
      right,
      comparisons,
      matchedPairs,
      ignoredIndices,
      confirmedIndices,
      result,
      narration: "Move both pointers inward. Confirmed outer characters never need to be checked again.",
      prompt: left < right
        ? "What is the next unresolved pair?"
        : "Have the pointers met or crossed?"
    }));
  }

  if (result === null) {
    result = true;
    if (left === right) {
      if (isPalindromeCharacter(characters[left])) confirmedIndices.add(left);
      else ignoredIndices.add(left);
    }
  }

  trace.push({
    ...createStep({
      trace,
      phase: "complete",
      codeSteps: [result ? "return-true" : "return-false"],
      characters,
      left,
      right,
      comparisons,
      matchedPairs,
      ignoredIndices,
      confirmedIndices,
      result,
      complete: true,
      narration: result
        ? `Every required pair matched after ${comparisons} ${comparisons === 1 ? "comparison" : "comparisons"}. The text is a palindrome.`
        : `The first unequal pair ends the scan after ${comparisons} ${comparisons === 1 ? "comparison" : "comparisons"}.`,
      prompt: result
        ? "Can you explain why ignored punctuation and letter case do not change the result?"
        : "Which normalized pair disproved the palindrome?"
    }),
    result
  });

  return trace;
}

function createStep({
  trace,
  phase,
  codeSteps,
  characters,
  left,
  right,
  comparisons,
  matchedPairs,
  ignoredIndices,
  confirmedIndices,
  result,
  narration,
  prompt,
  actedIndex = null,
  normalizedLeft = normalizedAt(characters, left),
  normalizedRight = normalizedAt(characters, right),
  compared = false,
  matched = null,
  complete = false
}) {
  return {
    step: trace.length,
    phase,
    codeSteps,
    leftIndex: isValidIndex(left, characters.length) ? left : null,
    rightIndex: isValidIndex(right, characters.length) ? right : null,
    leftCharacter: characterAt(characters, left),
    rightCharacter: characterAt(characters, right),
    normalizedLeft,
    normalizedRight,
    actedIndex,
    compared,
    matched,
    comparisons,
    matchedPairs,
    ignoredCount: ignoredIndices.size,
    determined: result,
    view: {
      values: [...characters],
      activeIndices: complete ? completionIndices(result, left, right, characters.length) : pointerIndices(left, right, characters.length),
      ranges: complete ? [] : candidateRange(left, right, characters.length),
      markers: complete && result !== false ? [] : pointerMarkers(left, right, characters.length),
      annotations: characterAnnotations(ignoredIndices, confirmedIndices),
      changedIndices: []
    },
    narration,
    prompt
  };
}

function normalizedAt(characters, index) {
  const character = characterAt(characters, index);
  return isPalindromeCharacter(character) ? normalizePalindromeCharacter(character) : null;
}

function characterAt(characters, index) {
  return isValidIndex(index, characters.length) ? characters[index] : null;
}

function pointerIndices(left, right, length) {
  return [...new Set([left, right].filter((index) => isValidIndex(index, length)))];
}

function completionIndices(result, left, right, length) {
  return result === false ? pointerIndices(left, right, length) : [];
}

function pointerMarkers(left, right, length) {
  const markers = [];
  if (isValidIndex(left, length)) markers.push({ index: left, kind: "left", label: "left" });
  if (isValidIndex(right, length)) markers.push({ index: right, kind: "right", label: "right" });
  return markers;
}

function candidateRange(left, right, length) {
  if (!isValidIndex(left, length) || !isValidIndex(right, length) || left > right) return [];
  return [{ start: left, end: right, kind: "candidate", label: "unresolved range" }];
}

function characterAnnotations(ignoredIndices, confirmedIndices) {
  return [
    ...[...ignoredIndices].sort((left, right) => left - right).map((index) => ({
      index,
      label: "ignored"
    })),
    ...[...confirmedIndices].sort((left, right) => left - right).map((index) => ({
      index,
      label: "confirmed"
    }))
  ];
}

function isValidIndex(index, length) {
  return Number.isInteger(index) && index >= 0 && index < length;
}

export function formatCharacter(character) {
  if (character === null) return "none";
  if (character === " ") return "space";
  if (character === "\t") return "tab";
  if (character === "\n") return "line break";
  return `“${character}”`;
}
