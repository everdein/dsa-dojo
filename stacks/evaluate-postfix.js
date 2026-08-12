// Runnable entry point for the shared postfix evaluator.

const program = "5 1 2 + 4 * + 3 -";

(async () => {
  const {
    evaluatePostfix,
    parsePostfixProgram
  } = await import("./evaluate-postfix.mjs");
  console.log(evaluatePostfix(parsePostfixProgram(program)));
})();

// Time complexity: O(n)
// Space complexity: O(n)
