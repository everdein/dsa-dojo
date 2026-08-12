// Runnable entry point for the shared Trie Insert and Search implementation.

const words = ["do", "dog", "dot"];
const query = "dog";

(async () => {
  const { searchTrie } = await import("./trie-insert-search.mjs");
  console.log(searchTrie(words, query));
})();

// Time complexity: O(total inserted characters + query length)
// Space complexity: O(total distinct inserted characters)
