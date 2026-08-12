import {
  groupAnagrams,
  maximumAnagramWordCharacters,
  maximumAnagramWords,
  validateGroupAnagramsInput
} from "../../../hash-maps-and-sets/group-anagrams.mjs";
import { buildGroupAnagramsTrace } from "../group-anagrams.mjs";

export const groupAnagramsLesson = {
  id: "hash-maps-and-sets/group-anagrams",
  order: 16,
  topic: "Hash Maps and Sets",
  catalogLabel: "Group Anagrams",
  catalogDescription: "Derive one canonical key for every reordered word.",
  title: "Group words that contain the same letters",
  summary: "Normalize each word, sort its Unicode code points into a canonical signature, and preserve discovery order inside the matching group.",
  prerequisites: ["strings/first-non-repeating", "arrays/frequency-count"],
  patterns: ["frequency-map", "canonical-key", "grouping"],
  renderer: "lookup",
  input: {
    fields: [{
      id: "words",
      label: `Enter 1-${maximumAnagramWords} comma-separated words`,
      type: "text",
      inputMode: "text",
      placeholder: "eat, tea, tan, ate, nat, bat"
    }],
    help: `Each word may contain 1-${maximumAnagramWordCharacters} Unicode letters. Case is ignored; punctuation, spaces, and numbers are not part of a word.`,
    defaultValue: { words: ["eat", "tea", "tan", "ate", "nat", "bat"] },
    sampleValue: { words: ["Été", "TÉé", "Tea", "eat", "bat"] },
    parse: (fields) => ({ words: parseGroupAnagramWords(fields.words) }),
    serialize: ({ words }) => ({ words: words.join(", ") })
  },
  solve: ({ words }) => groupAnagrams(words),
  buildTrace: ({ words }) => buildGroupAnagramsTrace(words),
  code: {
    title: "Use sorted letters as the group key",
    filename: "group-anagrams.mjs",
    sourcePath: "hash-maps-and-sets/group-anagrams.mjs",
    lines: [
      { number: 6, text: "export function groupAnagrams(words) {", steps: ["function"] },
      { number: 7, text: "  validateGroupAnagramsInput(words);", steps: ["initialize"] },
      { number: 8, text: "", steps: ["initialize"] },
      { number: 9, text: "  const groups = new Map();", steps: ["initialize"] },
      { number: 10, text: "  for (const word of words) {", steps: ["loop"] },
      { number: 11, text: "    const signature = anagramSignature(word);", steps: ["build-signature"] },
      { number: 12, text: "    if (!groups.has(signature)) groups.set(signature, []);", steps: ["find-group", "create-group"] },
      { number: 13, text: "    groups.get(signature).push(word);", steps: ["append-word"] },
      { number: 14, text: "  }", steps: ["loop"] },
      { number: 15, text: "", steps: ["return"] },
      { number: 16, text: "  return [...groups.values()].map((group) => [...group]);", steps: ["return"] },
      { number: 17, text: "}", steps: ["function"] }
    ]
  },
  stats: [
    {
      label: "Current word",
      value: (step) => step.currentWord ?? "-",
      detail: (step) => step.normalizedWord === null ? "no active word" : `normalized: ${step.normalizedWord}`
    },
    {
      label: "Signature",
      value: (step) => step.signature ?? "-",
      detail: () => "sorted normalized code points"
    },
    {
      label: "Current group",
      value: (step) => step.groupIndex === null ? "-" : String(step.groupIndex + 1),
      detail: (step) => step.groupIndex === null ? "no active group" : `${step.groupSize} ${step.groupSize === 1 ? "word" : "words"}`
    },
    {
      label: "Groups",
      accent: true,
      value: (step) => String(step.groupCount),
      detail: (step) => `${step.processedCount} words classified`
    }
  ],
  complexity: {
    chip: "CANONICAL KEY",
    time: "O(n · m log m)",
    space: "O(n · m)",
    explanation: "For n words of at most m code points, sorting each normalized word costs O(m log m). Signatures and the grouped output retain O(n · m) text. Studio rewind snapshots are separate visualization history."
  },
  guide: {
    heading: "Change order into identity."
  },
  legend: [
    { kind: "grouped", label: "existing group" },
    { kind: "updated", label: "group changed now" },
    { kind: "result", label: "completed group" }
  ],
  reflection: {
    eyebrow: "BEFORE YOU MOVE ON",
    title: "What makes a canonical key reliable?",
    body: "Try case variants, duplicate words, Unicode letters, and groups discovered in a different order. Explain why equal signatures imply equal normalized letter multisets."
  }
};

export function parseGroupAnagramWords(raw) {
  const text = String(raw ?? "").trim();
  if (text === "") {
    throw new Error("Enter at least one word.");
  }
  const words = text.split(",").map((word) => word.trim());
  if (words.some((word) => word === "")) {
    throw new Error("Enter one word between each comma.");
  }
  validateGroupAnagramsInput(words);
  return words;
}
