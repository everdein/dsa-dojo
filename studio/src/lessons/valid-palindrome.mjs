import {
  isPalindrome,
  maximumPalindromeCharacters,
  validatePalindromeInput
} from "../../../strings/valid-palindrome.mjs";
import {
  buildValidPalindromeTrace,
  formatCharacter
} from "../valid-palindrome.mjs";

export const validPalindromeLesson = {
  id: "strings/valid-palindrome",
  order: 8,
  topic: "Strings",
  catalogLabel: "Valid Palindrome",
  catalogDescription: "Compare normalized characters with two inward-moving pointers.",
  title: "Check whether text is a palindrome",
  summary: "Ignore punctuation, whitespace, and letter case. Compare meaningful characters from both ends until one pair differs or the pointers meet.",
  renderer: "sequence",
  prerequisites: ["arrays/reverse-array"],
  patterns: ["strings", "two-pointers"],
  input: {
    fields: [{
      id: "text",
      label: `Enter 1–${maximumPalindromeCharacters} characters`,
      type: "text",
      inputMode: "text",
      placeholder: "A man, a plan, a canal: Panama!"
    }],
    help: "The lesson keeps the original text visible, ignores non-alphanumeric characters, and compares letters without case sensitivity.",
    defaultValue: { text: "A man, a plan, a canal: Panama!" },
    sampleValue: { text: "Algorithms are great" },
    parse: (fields) => ({ text: parsePalindromeText(fields.text) }),
    serialize: ({ text }) => ({ text })
  },
  solve: ({ text }) => isPalindrome(text),
  buildTrace: ({ text }) => buildValidPalindromeTrace(text),
  code: {
    title: "Compare meaningful characters",
    filename: "valid-palindrome.mjs",
    sourcePath: "strings/valid-palindrome.mjs",
    lines: [
      { number: 10, text: "export function isPalindrome(text) {", steps: ["function"] },
      { number: 11, text: "  validatePalindromeInput(text);", steps: ["initialize"] },
      { number: 12, text: "", steps: ["initialize"] },
      { number: 13, text: "  const characters = Array.from(text);", steps: ["initialize"] },
      { number: 14, text: "  let left = 0;", steps: ["initialize"] },
      { number: 15, text: "  let right = characters.length - 1;", steps: ["initialize"] },
      { number: 16, text: "", steps: ["check-pointers"] },
      { number: 17, text: "  while (left < right) {", steps: ["check-pointers"] },
      { number: 18, text: "    while (left < right && !isPalindromeCharacter(characters[left])) {", steps: ["skip-left"] },
      { number: 19, text: "      left += 1;", steps: ["skip-left"] },
      { number: 20, text: "    }", steps: ["skip-left"] },
      { number: 21, text: "    while (left < right && !isPalindromeCharacter(characters[right])) {", steps: ["skip-right"] },
      { number: 22, text: "      right -= 1;", steps: ["skip-right"] },
      { number: 23, text: "    }", steps: ["skip-right"] },
      { number: 24, text: "    if (left >= right) break;", steps: ["check-pointers"] },
      { number: 25, text: "", steps: ["compare"] },
      { number: 26, text: "    const normalizedLeft = normalizePalindromeCharacter(characters[left]);", steps: ["compare"] },
      { number: 27, text: "    const normalizedRight = normalizePalindromeCharacter(characters[right]);", steps: ["compare"] },
      { number: 28, text: "    if (normalizedLeft !== normalizedRight) {", steps: ["compare"] },
      { number: 29, text: "      return false;", steps: ["return-false"] },
      { number: 30, text: "    }", steps: ["compare"] },
      { number: 31, text: "", steps: ["move-pointers"] },
      { number: 32, text: "    left += 1;", steps: ["move-pointers"] },
      { number: 33, text: "    right -= 1;", steps: ["move-pointers"] },
      { number: 34, text: "  }", steps: ["check-pointers"] },
      { number: 35, text: "", steps: ["return-true"] },
      { number: 36, text: "  return true;", steps: ["return-true"] },
      { number: 37, text: "}", steps: ["function"] }
    ]
  },
  stats: [
    {
      label: "Left pointer",
      value: (step) => pointerValue(step, step.leftIndex),
      detail: (step) => pointerDetail(step, step.leftIndex)
    },
    {
      label: "Right pointer",
      value: (step) => pointerValue(step, step.rightIndex),
      detail: (step) => pointerDetail(step, step.rightIndex)
    },
    {
      label: "Comparisons",
      accent: true,
      value: (step) => String(step.comparisons),
      detail: (step) => `${step.matchedPairs} ${step.matchedPairs === 1 ? "pair" : "pairs"} confirmed`
    },
    {
      label: "Ignored",
      value: (step) => String(step.ignoredCount),
      detail: () => "punctuation, symbols, and whitespace"
    }
  ],
  complexity: {
    chip: "TWO POINTERS",
    time: "O(n)",
    space: "O(n)",
    spaceLabel: "total space",
    explanation: "Array.from creates an O(n) Unicode code-point sequence so the pointers never split a surrogate pair. The scan is O(n) and uses O(1) pointer state beyond that representation. The studio's reversible snapshots are separate visualization history."
  },
  guide: {
    heading: "Compare meaning, not formatting."
  },
  legend: [
    { kind: "left", label: "left pointer" },
    { kind: "right", label: "right pointer" },
    { kind: "candidate", label: "unresolved range" },
    { kind: "active", label: "current pair" }
  ],
  reflection: {
    eyebrow: "BEFORE YOU MOVE ON",
    title: "Which characters actually decide the answer?",
    body: "Try mixed case, punctuation at both ends, an emoji beside a letter, and a phrase with one unequal pair. Explain why each meaningful character is visited at most once."
  }
};

export function parsePalindromeText(raw) {
  const text = String(raw ?? "");
  validatePalindromeInput(text);
  return text;
}

function pointerValue(step, index) {
  if (step.phase === "complete" && step.determined === true) return "done";
  return index === null ? "—" : String(index);
}

function pointerDetail(step, index) {
  if (step.phase === "complete" && step.determined === true) return "all required pairs matched";
  if (index === null) return "outside the sequence";
  return formatCharacter(step.view.values[index]);
}
