// Runnable entry point for the shared Valid Palindrome implementation.

const text = "A man, a plan, a canal: Panama!";

(async () => {
  const { isPalindrome } = await import("./valid-palindrome.mjs");
  console.log(isPalindrome(text));
})();

// Time complexity: O(n)
// Space complexity: O(n) for the Unicode code-point array; O(1) pointer state.
