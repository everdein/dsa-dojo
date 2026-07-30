// Exercise: Detect whether a linked list contains a cycle.
// Goal: Let fast catch slow inside a loop without storing visited nodes.

async function main() {
  const { createLinkedList } = await import("./model.mjs");
  const { hasCycle } = await import("./detect-cycle.mjs");
  const head = createLinkedList([3, 2, 0, -4], { cycleEntryIndex: 1 });

  console.log(hasCycle(head));
}

main();

// Time complexity: O(n)
// Space complexity: O(1) auxiliary space.
