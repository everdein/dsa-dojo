// Runnable entry point for the shared Queue Operations implementation.

const operations = [
  { type: "enqueue", value: 4 },
  { type: "enqueue", value: 9 },
  { type: "peek" },
  { type: "dequeue" }
];

(async () => {
  const { runQueueOperations } = await import("./queue-operations.mjs");
  console.log(runQueueOperations(operations));
})();

// Time complexity: O(m)
// Space complexity: O(m)
