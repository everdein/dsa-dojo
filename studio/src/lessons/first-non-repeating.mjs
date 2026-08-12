import {
  findFirstNonRepeatingCharacter,
  maximumFirstNonRepeatingCharacters,
  validateFirstNonRepeatingInput
} from "../../../strings/first-non-repeating.mjs";
import { buildFirstNonRepeatingTrace } from "../first-non-repeating.mjs";
import { formatCharacter } from "../valid-palindrome.mjs";

export const firstNonRepeatingLesson = {
  id: "strings/first-non-repeating",
  order: 11,
  topic: "Strings",
  prerequisites: ["strings/valid-palindrome"],
  patterns: ["strings", "frequency-map", "two-pass"],
  catalogLabel: "First Non-Repeating",
  catalogDescription: "Count normalized characters, then preserve raw order to choose the first unique one.",
  title: "Find the first non-repeating character",
  summary: "Build complete normalized frequencies in one pass. Then scan the original character positions again and stop at the first count of one.",
  views: [
    { id: "characters", renderer: "sequence", heading: "Original text" },
    { id: "counts", renderer: "lookup", heading: "Normalized character → count" }
  ],
  input: {
    fields: [{
      id: "text",
      label: `Enter 1–${maximumFirstNonRepeatingCharacters} characters`,
      type: "text",
      inputMode: "text",
      placeholder: "aA, b! cC"
    }],
    help: "Raw positions stay visible. Punctuation and whitespace are ignored, and letters share a case-insensitive normalized key.",
    defaultValue: { text: "aA, b! cC" },
    sampleValue: { text: "aA!!bB" },
    parse: (fields) => ({ text: parseFirstNonRepeatingText(fields.text) }),
    serialize: ({ text }) => ({ text })
  },
  solve: ({ text }) => findFirstNonRepeatingCharacter(text),
  buildTrace: ({ text }) => buildFirstNonRepeatingTrace(text),
  code: {
    title: "Count first, preserve order second",
    filename: "first-non-repeating.mjs",
    sourcePath: "strings/first-non-repeating.mjs",
    lines: [
      { number: 15, text: "export function findFirstNonRepeatingCharacter(text) {", steps: ["function"] },
      { number: 16, text: "  validateFirstNonRepeatingInput(text);", steps: ["initialize-counts"] },
      { number: 17, text: "", steps: ["initialize-counts"] },
      { number: 18, text: "  const characters = Array.from(text);", steps: ["initialize-counts"] },
      { number: 19, text: "  const counts = new Map();", steps: ["initialize-counts"] },
      { number: 20, text: "", steps: ["count-loop"] },
      { number: 21, text: "  for (const character of characters) {", steps: ["count-loop"] },
      { number: 22, text: "    if (!isPalindromeCharacter(character)) continue;", steps: ["skip-character"] },
      { number: 23, text: "    const normalized = normalizePalindromeCharacter(character);", steps: ["normalize-character"] },
      { number: 24, text: "    counts.set(normalized, (counts.get(normalized) ?? 0) + 1);", steps: ["increment-count"] },
      { number: 25, text: "  }", steps: ["count-loop"] },
      { number: 26, text: "", steps: ["selection-loop"] },
      { number: 27, text: "  for (let index = 0; index < characters.length; index += 1) {", steps: ["selection-loop"] },
      { number: 28, text: "    const character = characters[index];", steps: ["selection-loop"] },
      { number: 29, text: "    if (!isPalindromeCharacter(character)) continue;", steps: ["skip-character"] },
      { number: 30, text: "    const normalized = normalizePalindromeCharacter(character);", steps: ["normalize-character"] },
      { number: 31, text: "    if (counts.get(normalized) === 1) {", steps: ["check-count"] },
      { number: 32, text: "      return { index, character, normalized };", steps: ["return-result"] },
      { number: 33, text: "    }", steps: ["check-count"] },
      { number: 34, text: "  }", steps: ["selection-loop"] },
      { number: 35, text: "", steps: ["return-none"] },
      { number: 36, text: "  return null;", steps: ["return-none"] },
      { number: 37, text: "}", steps: ["function"] }
    ]
  },
  stats: [
    {
      label: "Pass",
      value: (step) => step.phase === "complete" ? "done" : step.pass === 1 ? "count" : "select",
      detail: (step) => step.pass === 1 ? "build every frequency" : "preserve raw order"
    },
    {
      label: "Raw index",
      value: (step) => step.currentIndex === null ? "—" : String(step.currentIndex),
      detail: (step) => step.currentCharacter === null ? "no active character" : formatCharacter(step.currentCharacter)
    },
    {
      label: "Normalized count",
      value: (step) => step.currentCount === null ? "—" : String(step.currentCount),
      detail: (step) => step.normalizedCharacter === null
        ? `${step.distinctCount} distinct keys`
        : `key ${formatCharacter(step.normalizedCharacter)}`
    },
    {
      label: "Result",
      accent: true,
      value: (step) => step.result ? formatCharacter(step.result.character) : step.phase === "complete" ? "none" : "searching",
      detail: (step) => step.result ? `raw index ${step.result.index}` : `${step.selectionChecks} meaningful positions checked`
    }
  ],
  complexity: {
    chip: "COUNT, THEN SELECT",
    time: "O(n)",
    space: "O(n)",
    spaceLabel: "total space",
    explanation: "Both passes are linear. Array.from preserves Unicode code-point positions in O(n) space, while the frequency map stores O(k) normalized keys, where k is at most n. The studio's reversible snapshots are separate visualization history."
  },
  guide: {
    heading: "Finish the counts before choosing."
  },
  legend: [
    { kind: "counting", label: "counting now" },
    { kind: "checking", label: "checking in raw order" },
    { kind: "updated", label: "updated frequency" },
    { kind: "candidate", label: "candidate frequency" },
    { kind: "result", label: "first non-repeating" }
  ],
  reflection: {
    eyebrow: "BEFORE YOU MOVE ON",
    title: "Why can’t the first pass choose the answer?",
    body: "A character that is unique so far may repeat later. Try mixed case, leading punctuation, one meaningful character, and text where every key repeats. Explain why the second pass needs completed counts and original raw order."
  }
};

export function parseFirstNonRepeatingText(raw) {
  const text = String(raw ?? "");
  validateFirstNonRepeatingInput(text);
  return text;
}
