import {
  findFirstNonRepeatingCharacter,
  validateFirstNonRepeatingInput
} from "../../strings/first-non-repeating.mjs";
import {
  isPalindromeCharacter,
  normalizePalindromeCharacter
} from "../../strings/valid-palindrome.mjs";
import { formatCharacter } from "./valid-palindrome.mjs";

export { findFirstNonRepeatingCharacter };

export function buildFirstNonRepeatingTrace(text) {
  validateFirstNonRepeatingInput(text);

  const characters = Array.from(text);
  const counts = new Map();
  const ignoredIndices = new Set();
  const checkedIndices = new Set();
  const trace = [];
  let countedCharacters = 0;
  let selectionChecks = 0;
  let result = null;

  trace.push(createStep({
    trace,
    phase: "initialize",
    codeSteps: ["initialize-counts"],
    pass: 1,
    characters,
    counts,
    ignoredIndices,
    checkedIndices,
    countedCharacters,
    selectionChecks,
    result,
    narration: "Start with an empty frequency map. The first pass will count normalized letters and numbers without removing characters from the original text.",
    prompt: "Prediction: which raw characters will share the same normalized key?"
  }));

  for (let index = 0; index < characters.length; index += 1) {
    const character = characters[index];
    if (!isPalindromeCharacter(character)) {
      ignoredIndices.add(index);
      trace.push(createStep({
        trace,
        phase: "ignore-count",
        codeSteps: ["count-loop", "skip-character"],
        pass: 1,
        characters,
        counts,
        ignoredIndices,
        checkedIndices,
        countedCharacters,
        selectionChecks,
        result,
        currentIndex: index,
        narration: `${formatCharacter(character)} at index ${index} is not a letter or number, so it does not receive a frequency key.`,
        prompt: "The raw position remains visible. Why should this character not affect a frequency?"
      }));
      continue;
    }

    const normalized = normalizePalindromeCharacter(character);
    const count = (counts.get(normalized) ?? 0) + 1;
    counts.set(normalized, count);
    countedCharacters += 1;
    trace.push(createStep({
      trace,
      phase: "count",
      codeSteps: ["count-loop", "normalize-character", "increment-count"],
      pass: 1,
      characters,
      counts,
      ignoredIndices,
      checkedIndices,
      countedCharacters,
      selectionChecks,
      result,
      currentIndex: index,
      normalized,
      currentCount: count,
      activeKey: normalized,
      lookupAnnotations: [{ key: normalized, label: `count ${count}` }],
      narration: `${formatCharacter(character)} normalizes to ${formatCharacter(normalized)}. Its count is now ${count}.`,
      prompt: count === 1
        ? "This key is unique so far. Can a later character change that?"
        : "This key can no longer be the answer, even if another case variant appears."
    }));
  }

  trace.push(createStep({
    trace,
    phase: "begin-selection",
    codeSteps: ["selection-loop"],
    pass: 2,
    characters,
    counts,
    ignoredIndices,
    checkedIndices,
    countedCharacters,
    selectionChecks,
    result,
    narration: "The frequency map is complete. Return to raw index 0 and scan in original order for the first normalized count of one.",
    prompt: "Why can the completed counts be reused without changing during this pass?"
  }));

  for (let index = 0; index < characters.length; index += 1) {
    const character = characters[index];
    if (!isPalindromeCharacter(character)) {
      trace.push(createStep({
        trace,
        phase: "ignore-selection",
        codeSteps: ["selection-loop", "skip-character"],
        pass: 2,
        characters,
        counts,
        ignoredIndices,
        checkedIndices,
        countedCharacters,
        selectionChecks,
        result,
        currentIndex: index,
        narration: `${formatCharacter(character)} at index ${index} was excluded from the map, so the second pass skips it too.`,
        prompt: "Which raw position comes next?"
      }));
      continue;
    }

    const normalized = normalizePalindromeCharacter(character);
    const count = counts.get(normalized);
    selectionChecks += 1;
    checkedIndices.add(index);
    const found = count === 1;
    if (found) result = { index, character, normalized };

    trace.push(createStep({
      trace,
      phase: found ? "found" : "repeated",
      codeSteps: found
        ? ["selection-loop", "normalize-character", "check-count", "return-result"]
        : ["selection-loop", "normalize-character", "check-count"],
      pass: 2,
      characters,
      counts,
      ignoredIndices,
      checkedIndices,
      countedCharacters,
      selectionChecks,
      result,
      currentIndex: index,
      normalized,
      currentCount: count,
      activeKey: normalized,
      lookupAnnotations: [{
        key: normalized,
        label: found ? "first count of 1" : `count ${count}`
      }],
      resultKeys: found ? [normalized] : [],
      narration: found
        ? `${formatCharacter(character)} at raw index ${index} has normalized count 1. It is the first non-repeating character.`
        : `${formatCharacter(character)} at raw index ${index} has normalized count ${count}, so it repeats and cannot be the answer.`,
      prompt: found
        ? "Why can the search stop at this raw position?"
        : "Continue in raw order. Which meaningful character is next?"
    }));

    if (found) break;
  }

  trace.push({
    ...createStep({
      trace,
      phase: "complete",
      codeSteps: [result ? "return-result" : "return-none"],
      pass: 2,
      characters,
      counts,
      ignoredIndices,
      checkedIndices,
      countedCharacters,
      selectionChecks,
      result,
      currentIndex: result?.index ?? null,
      normalized: result?.normalized ?? null,
      currentCount: result ? 1 : null,
      activeKey: result?.normalized ?? null,
      lookupAnnotations: result ? [{ key: result.normalized, label: "first non-repeating" }] : [],
      resultKeys: result ? [result.normalized] : [],
      complete: true,
      narration: result
        ? `${formatCharacter(result.character)} at raw index ${result.index} is the first non-repeating character.`
        : "Every meaningful normalized character repeats, so there is no non-repeating result.",
      prompt: result
        ? "Explain why a later unique character cannot replace this result."
        : "How do the completed counts prove that no answer exists?"
    }),
    result: cloneResult(result)
  });

  return trace;
}

function createStep({
  trace,
  phase,
  codeSteps,
  pass,
  characters,
  counts,
  ignoredIndices,
  checkedIndices,
  countedCharacters,
  selectionChecks,
  result,
  narration,
  prompt,
  currentIndex = null,
  normalized = null,
  currentCount = null,
  activeKey = null,
  lookupAnnotations = [],
  resultKeys = [],
  complete = false
}) {
  return {
    step: trace.length,
    phase,
    codeSteps,
    pass,
    currentIndex,
    currentCharacter: characterAt(characters, currentIndex),
    normalizedCharacter: normalized,
    currentCount,
    distinctCount: counts.size,
    countedCharacters,
    selectionChecks,
    ignoredCount: ignoredIndices.size,
    result: cloneResult(result),
    views: {
      characters: buildSequenceView({
        characters,
        pass,
        currentIndex,
        normalized,
        currentCount,
        ignoredIndices,
        checkedIndices,
        result,
        complete
      }),
      counts: buildLookupView({
        counts,
        pass,
        activeKey,
        annotations: lookupAnnotations,
        resultKeys
      })
    },
    narration,
    prompt
  };
}

function buildSequenceView({
  characters,
  pass,
  currentIndex,
  normalized,
  currentCount,
  ignoredIndices,
  checkedIndices,
  result,
  complete
}) {
  const activeIndices = complete
    ? result ? [result.index] : []
    : currentIndex === null ? [] : [currentIndex];
  const markers = activeIndices.map((index) => ({
    index,
    kind: result?.index === index ? "result" : pass === 1 ? "counting" : "checking",
    label: result?.index === index ? "first unique" : pass === 1 ? "count" : "check"
  }));
  const ranges = currentIndex === null || complete
    ? []
    : [{
        start: 0,
        end: currentIndex,
        kind: pass === 1 ? "counted" : "searched",
        label: pass === 1 ? "counted prefix" : "searched prefix"
      }];
  const annotations = [
    ...[...ignoredIndices].sort((left, right) => left - right).map((index) => ({
      index,
      label: "ignored"
    })),
    ...[...checkedIndices]
      .filter((index) => index !== result?.index)
      .sort((left, right) => left - right)
      .map((index) => ({ index, label: "repeats" }))
  ];

  if (result) {
    annotations.push({ index: result.index, label: "first unique" });
  } else if (pass === 1 && currentIndex !== null && normalized !== null) {
    annotations.push({
      index: currentIndex,
      label: `${normalized} → ${currentCount}`
    });
  }

  return {
    values: [...characters],
    activeIndices,
    ranges,
    markers,
    annotations,
    changedIndices: []
  };
}

function buildLookupView({ counts, pass, activeKey, annotations, resultKeys }) {
  return {
    entries: [...counts].map(([key, value]) => ({
      key,
      value,
      state: resultKeys.includes(key)
        ? "result"
        : key === activeKey
          ? pass === 1 ? "updated" : "candidate"
          : "counted"
    })),
    activeKeys: activeKey === null ? [] : [activeKey],
    annotations: annotations.map((annotation) => ({ ...annotation })),
    resultKeys: [...resultKeys]
  };
}

function characterAt(characters, index) {
  return Number.isInteger(index) && index >= 0 && index < characters.length
    ? characters[index]
    : null;
}

function cloneResult(result) {
  return result === null ? null : { ...result };
}
