// Runnable entry point for the shared First Non-Repeating Character implementation.

const text = "aA, b! cC";

(async () => {
  const { findFirstNonRepeatingCharacter } = await import("./first-non-repeating.mjs");
  console.log(findFirstNonRepeatingCharacter(text));
})();

// Time complexity: O(n)
// Space complexity: O(k), where k is the number of normalized characters.
