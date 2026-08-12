import {
  maximumTrieTotalCharacters,
  maximumTrieWordCharacters,
  maximumTrieWords,
  searchTrie,
  validateTrieInput
} from "../../../tries/trie-insert-search.mjs";
import { buildTrieInsertSearchTrace } from "../trie-insert-search.mjs";

export const trieInsertSearchLesson = {
  id: "tries/trie-insert-search",
  order: 28,
  topic: "Tries",
  prerequisites: ["strings/valid-palindrome", "trees/inorder-traversal"],
  patterns: ["trie", "prefix-search"],
  catalogLabel: "Trie Insert and Search",
  catalogDescription: "Share character paths while keeping word endings explicit.",
  title: "Insert and search words in a trie",
  summary: "Create one edge per normalized character, reuse shared prefixes, and distinguish reaching a path from reaching a stored word ending.",
  renderer: "branching",
  input: {
    heading: "Your word collection",
    fields: [
      {
        id: "words",
        label: `Enter 1-${maximumTrieWords} comma-separated words`,
        type: "text",
        inputMode: "text",
        placeholder: "do, dog, dot"
      },
      {
        id: "query",
        label: "Search word or prefix",
        type: "text",
        inputMode: "text",
        placeholder: "dog"
      }
    ],
    help: `Use Unicode letters only, at most ${maximumTrieWordCharacters} per word and ${maximumTrieTotalCharacters} across inserted words. Matching is case-insensitive.`,
    defaultValue: { words: ["do", "dog", "dot"], query: "dog" },
    sampleValue: { words: ["car", "card", "care"], query: "ca" },
    parse: ({ words, query }) => {
      const parsedWords = parseTrieWords(words);
      const parsedQuery = String(query ?? "").trim();
      validateTrieInput(parsedWords, parsedQuery);
      return { words: parsedWords, query: parsedQuery };
    },
    serialize: ({ words, query }) => ({ words: words.join(", "), query })
  },
  solve: ({ words, query }) => searchTrie(words, query),
  buildTrace: buildTrieInsertSearchTrace,
  code: {
    title: "Reuse one edge per character",
    filename: "trie-insert-search.mjs",
    sourcePath: "tries/trie-insert-search.mjs",
    lines: [
      { number: 26, text: "export function createTrie(words) {", steps: ["initialize"] },
      { number: 28, text: "  const root = createTrieNode(\"node-0\", \"root\", \"\");", steps: ["initialize"] },
      { number: 30, text: "  for (const rawWord of words) {", steps: ["insert-word"] },
      { number: 33, text: "    let node = root;", steps: ["insert-word"] },
      { number: 34, text: "    for (const character of Array.from(normalizeTrieWord(rawWord))) {", steps: ["insert-word"] },
      { number: 35, text: "      if (!node.children.has(character)) {", steps: ["follow-or-create"] },
      { number: 36, text: "        node.children.set(character, createTrieNode(...));", steps: ["follow-or-create"] },
      { number: 38, text: "      }", steps: ["follow-or-create"] },
      { number: 39, text: "      node = node.children.get(character);", steps: ["follow-or-create"] },
      { number: 41, text: "    }", steps: ["insert-word"] },
      { number: 42, text: "    node.terminal = true;", steps: ["mark-terminal"] },
      { number: 13, text: "  }", steps: ["insert-word"] },
      { number: 44, text: "  return root;", steps: ["initialize"] },
      { number: 47, text: "export function searchTrie(words, query) {", steps: ["search-query"] },
      { number: 47, text: "  let node = createTrie(words);", steps: ["search-query"] },
      { number: 48, text: "  for (const character of Array.from(normalizeTrieWord(query))) {", steps: ["search-query"] },
      { number: 53, text: "    const next = node.children.get(character);", steps: ["follow-edge"] },
      { number: 50, text: "    if (!next) return { found: false, isPrefix: false };", steps: ["return-missing"] },
      { number: 55, text: "    node = next;", steps: ["follow-edge"] },
      { number: 13, text: "  }", steps: ["search-query"] },
      { number: 53, text: "  return { found: node.terminal, isPrefix: node.children.size > 0 || node.terminal };", steps: ["return-found", "return-prefix"] },
      { number: 8, text: "}", steps: ["search-query"] }
    ]
  },
  stats: [
    {
      label: "Words inserted",
      value: (step) => String(step.insertedWords),
      detail: () => "terminal endings marked"
    },
    {
      label: "Characters inserted",
      value: (step) => String(step.charactersProcessed),
      detail: () => "reused edges still count"
    },
    {
      label: "Query position",
      value: (step) => step.queryIndex === null ? "-" : String(step.queryIndex),
      detail: () => "normalized code-point index"
    },
    {
      label: "Result",
      accent: true,
      value: (step) => step.found === null ? "building" : step.found ? "word" : step.isPrefix ? "prefix only" : "missing",
      detail: () => "terminal marker decides word"
    }
  ],
  complexity: {
    chip: "SHARED PREFIX PATHS",
    time: "O(c + q)",
    space: "O(c)",
    explanation: "Insertion visits c normalized characters across all words, and search follows q query characters. Distinct prefixes determine the stored node count."
  },
  guide: {
    heading: "A path is not automatically a word."
  },
  legend: [
    { kind: "current", label: "current node" },
    { kind: "terminal", label: "stored word ending" },
    { kind: "visited", label: "matched query path" },
    { kind: "result", label: "query result" }
  ],
  reflection: {
    eyebrow: "BEFORE YOU MOVE ON",
    title: "Why must a trie store terminal markers?",
    body: "If dog is stored, the path for do exists too. Explain why the path alone cannot tell whether do was inserted as its own word."
  }
};

export function parseTrieWords(value) {
  const source = String(value ?? "").trim();
  if (source === "") throw new Error("Enter at least one word.");
  const words = source.split(",").map((word) => word.trim());
  if (words.some((word) => word === "")) throw new Error("Enter a word between each comma.");
  return words;
}
