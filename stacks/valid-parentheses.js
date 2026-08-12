// Runnable entry point for the shared Valid Parentheses implementation.

const text = "({[]})";

(async () => {
  const { isValidParentheses } = await import("./valid-parentheses.mjs");
  console.log(isValidParentheses(text));
})();

// Time complexity: O(n)
// Space complexity: O(n)
