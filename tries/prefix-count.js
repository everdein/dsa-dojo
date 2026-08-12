// Runnable entry point for the shared Trie Prefix Count implementation.

const words = ["do", "dog", "dot", "door"];
const prefix = "do";

(async () => {
  const { countTriePrefix } = await import("./prefix-count.mjs");
  console.log(countTriePrefix(words, prefix));
})();

// Time complexity: O(c + p)
// Space complexity: O(c)
