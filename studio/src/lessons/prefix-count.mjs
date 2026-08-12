import {
  maximumTrieTotalCharacters,
  maximumTrieWordCharacters,
  maximumTrieWords,
  validateTrieInput
} from "../../../tries/trie-insert-search.mjs";
import { countTriePrefix } from "../../../tries/prefix-count.mjs";
import { buildPrefixCountTrace } from "../prefix-count.mjs";

export const prefixCountLesson = {
  id: "tries/prefix-count",
  order: 29,
  topic: "Tries",
  prerequisites: ["tries/trie-insert-search"],
  patterns: ["trie", "prefix-count", "aggregation"],
  catalogLabel: "Trie Prefix Count",
  catalogDescription: "Read a stored path aggregate after following one normalized prefix.",
  title: "Count words beneath a trie prefix",
  summary: "Build pass counts while inserting, follow the normalized prefix once, and read how many word insertions pass through its final node.",
  renderer: "branching",
  input: {
    heading: "Your word collection and prefix",
    fields: [
      {
        id: "words",
        label: `Enter 1-${maximumTrieWords} comma-separated words`,
        type: "text",
        inputMode: "text",
        placeholder: "do, dog, dot, door"
      },
      {
        id: "prefix",
        label: "Prefix to count",
        type: "text",
        inputMode: "text",
        placeholder: "do"
      }
    ],
    help: `Use Unicode letters only, at most ${maximumTrieWordCharacters} per word and ${maximumTrieTotalCharacters} across inserted words. Counting is case-insensitive and includes duplicate insertions.`,
    defaultValue: { words: ["do", "dog", "dot", "door", "DO"], prefix: "do" },
    sampleValue: { words: ["Caf\u00e9", "car", "CAF\u00c9", "cat"], prefix: "ca" },
    parse: ({ words, prefix }) => {
      const parsedWords = parsePrefixWords(words);
      const parsedPrefix = String(prefix ?? "").trim();
      validateTrieInput(parsedWords, parsedPrefix);
      return { words: parsedWords, prefix: parsedPrefix };
    },
    serialize: ({ words, prefix }) => ({ words: words.join(", "), prefix })
  },
  solve: ({ words, prefix }) => countTriePrefix(words, prefix),
  buildTrace: ({ words, prefix }) => buildPrefixCountTrace({ words, prefix }),
  code: {
    title: "Follow the prefix, then read its aggregate",
    filename: "prefix-count.mjs",
    sourcePath: "tries/prefix-count.mjs",
    lines: [
      { number: 11, text: "export function countTriePrefix(words, prefix) {", steps: ["function"] },
      { number: 12, text: "  validateTrieInput(words, prefix);", steps: ["build-trie"] },
      { number: 13, text: "  const normalizedPrefix = normalizeTrieWord(prefix);", steps: ["build-trie"] },
      { number: 14, text: "  let node = createTrie(words);", steps: ["build-trie"] },
      { number: 16, text: "  for (const character of Array.from(normalizedPrefix)) {", steps: ["follow-prefix"] },
      { number: 17, text: "    const next = node.children.get(character);", steps: ["read-edge"] },
      { number: 18, text: "    if (!next) return { normalizedPrefix, count: 0 };", steps: ["return-zero"] },
      { number: 19, text: "    node = next;", steps: ["follow-prefix"] },
      { number: 20, text: "  }", steps: ["follow-prefix"] },
      { number: 21, text: "  return { normalizedPrefix, count: node.passCount };", steps: ["read-count", "return-count"] },
      { number: 22, text: "}", steps: ["function"] }
    ]
  },
  stats: [
    {
      label: "Normalized prefix",
      value: (step) => step.normalizedPrefix,
      detail: () => "lowercase en-US"
    },
    {
      label: "Characters matched",
      value: (step) => `${step.matchedCharacters}/${step.totalCharacters}`,
      detail: (step) => step.missingCharacter === null ? "path so far" : `missing ${step.missingCharacter}`
    },
    {
      label: "Node aggregate",
      value: (step) => step.currentPassCount === null ? "-" : String(step.currentPassCount),
      detail: () => "insertions passing here"
    },
    {
      label: "Prefix count",
      accent: true,
      value: (step) => step.count === null ? "searching" : String(step.count),
      detail: (step) => step.phase === "complete" ? "final result" : "known early"
    }
  ],
  complexity: {
    chip: "STORED AGGREGATE",
    time: "O(c + p)",
    space: "O(c)",
    explanation: "Building the trie visits c normalized inserted characters. The query follows p prefix characters, then reads one stored pass count in constant time."
  },
  guide: {
    heading: "The final prefix node already summarizes its whole subtree."
  },
  legend: [
    { kind: "current", label: "current prefix node" },
    { kind: "visited", label: "matched prefix path" },
    { kind: "terminal", label: "stored word ending" },
    { kind: "aggregate", label: "count stored here" },
    { kind: "result", label: "prefix result" }
  ],
  reflection: {
    eyebrow: "BEFORE YOU MOVE ON",
    title: "Why does one node answer a whole-subtree question?",
    body: "Explain why every word beginning with the prefix increments passCount at its final prefix node, including duplicate and longer word insertions."
  }
};

export function parsePrefixWords(value) {
  const source = String(value ?? "").trim();
  if (source === "") throw new Error("Enter at least one word.");
  const words = source.split(",").map((word) => word.trim());
  if (words.some((word) => word === "")) throw new Error("Enter a word between each comma.");
  return words;
}
