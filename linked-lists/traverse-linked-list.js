// Exercise: Traverse a linked list.
// Goal: Follow next references until current reaches null.

async function main() {
  const { createLinkedList } = await import("./model.mjs");
  const { traverseLinkedList } = await import("./traverse-linked-list.mjs");
  const head = createLinkedList([6, 3, 8, 2]);

  console.log(traverseLinkedList(head));
}

main();

// Time complexity: O(n)
// Space complexity: O(n) output space; O(1) auxiliary space beyond the returned values.
