import {
  createTrie,
  normalizeTrieWord,
  validateTrieInput
} from "./trie-insert-search.mjs";

/**
 * Count inserted words whose normalized path begins with the normalized prefix.
 * Duplicate insertions contribute independently through the trie's passCount.
 */
export function countTriePrefix(words, prefix) {
  validateTrieInput(words, prefix);
  const normalizedPrefix = normalizeTrieWord(prefix);
  let node = createTrie(words);

  for (const character of Array.from(normalizedPrefix)) {
    const next = node.children.get(character);
    if (!next) return { normalizedPrefix, count: 0 };
    node = next;
  }
  return { normalizedPrefix, count: node.passCount };
}

export const prefixCount = countTriePrefix;
