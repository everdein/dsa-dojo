// Runnable entry point for the shared Group Anagrams implementation.

const words = ["eat", "tea", "tan", "ate", "nat", "bat"];

(async () => {
  const { groupAnagrams } = await import("./group-anagrams.mjs");
  console.log(groupAnagrams(words));
})();

// Time complexity: O(n * m log m), where m is the longest word.
// Space complexity: O(n * m), including the grouped output.
