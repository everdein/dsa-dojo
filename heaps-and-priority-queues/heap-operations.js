// Runnable entry point for the shared Min-Heap Operations implementation.

const program = "insert 5, insert 2, remove, insert 7";

(async () => {
  const {
    parseHeapProgram,
    runHeapOperations
  } = await import("./heap-operations.mjs");
  console.log(runHeapOperations(parseHeapProgram(program)));
})();

// Time complexity: O(log n) per insert or remove; O(m log m) for the program.
// Space complexity: O(m), including heap storage and removal records.
