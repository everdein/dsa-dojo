// Runnable entry point for the shared Min Stack implementation.

const program = "push 5, push 2, min, pop, min";

(async () => {
  const {
    parseMinStackProgram,
    runMinStack
  } = await import("./min-stack.mjs");
  console.log(runMinStack(parseMinStackProgram(program)));
})();

// Time complexity: O(1) per operation; O(n) for the complete program.
// Space complexity: O(n).
