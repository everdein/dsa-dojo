export const maximumTrieWords = 8;
export const maximumTrieWordCharacters = 12;
export const maximumTrieTotalCharacters = 30;
const unicodeLetter = /^\p{L}$/u;

export function normalizeTrieWord(word) {
  return Array.from(word).map((character) => character.toLocaleLowerCase("en-US")).join("");
}

export function validateTrieInput(words, query) {
  if (!Array.isArray(words) || words.length === 0 || words.length > maximumTrieWords) {
    throw new Error(`Trie Insert and Search requires 1-${maximumTrieWords} words.`);
  }
  for (let index = 0; index < words.length; index += 1) {
    if (!Object.hasOwn(words, index)) throw new Error("Trie words must form a dense list.");
    validateTrieWord(words[index], `Word ${index + 1}`);
  }
  const totalCharacters = words.reduce((total, word) => total + Array.from(normalizeTrieWord(word)).length, 0);
  if (totalCharacters > maximumTrieTotalCharacters) {
    throw new Error(`Keep inserted words to ${maximumTrieTotalCharacters} total characters or fewer.`);
  }
  validateTrieWord(query, "Query");
  return { words, query };
}

export function createTrie(words) {
  if (!Array.isArray(words)) throw new Error("Trie words must be an array.");
  const root = createTrieNode("node-0", "root", "");
  let nextId = 1;
  for (const rawWord of words) {
    validateTrieWord(rawWord, "Trie word");
    const normalized = normalizeTrieWord(rawWord);
    let node = root;
    for (const character of Array.from(normalized)) {
      if (!node.children.has(character)) {
        node.children.set(character, createTrieNode(`node-${nextId}`, character, character));
        nextId += 1;
      }
      node = node.children.get(character);
      node.passCount += 1;
    }
    node.terminal = true;
  }
  return root;
}

export function searchTrie(words, query) {
  validateTrieInput(words, query);
  const root = createTrie(words);
  const normalizedQuery = normalizeTrieWord(query);
  let node = root;
  for (const character of Array.from(normalizedQuery)) {
    const next = node.children.get(character);
    if (!next) return { found: false, isPrefix: false, normalizedQuery };
    node = next;
  }
  return {
    found: node.terminal,
    isPrefix: node.children.size > 0 || node.terminal,
    normalizedQuery
  };
}

export function validateTrieWord(word, label = "Word") {
  if (typeof word !== "string") throw new Error(`${label} must be text.`);
  const characters = Array.from(word);
  if (characters.length === 0 || characters.length > maximumTrieWordCharacters) {
    throw new Error(`${label} must contain 1-${maximumTrieWordCharacters} letters.`);
  }
  if (characters.some((character) => !unicodeLetter.test(character))) {
    throw new Error(`${label} may contain Unicode letters only.`);
  }
  return word;
}

function createTrieNode(id, value, edgeCharacter) {
  return {
    id,
    value,
    edgeCharacter,
    children: new Map(),
    terminal: false,
    passCount: 0
  };
}
