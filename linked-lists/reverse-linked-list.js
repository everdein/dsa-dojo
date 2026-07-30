// Exercise: Reverse a linked list.
// Goal: Protect next, redirect the current link, then advance both pointers.

async function main() {
  const {
    createLinkedList,
    linkedListToValues
  } = await import("./model.mjs");
  const { reverseLinkedList } = await import("./reverse-linked-list.mjs");
  const head = createLinkedList([4, 7, 1, 9]);

  console.log(linkedListToValues(reverseLinkedList(head)));
}

main();

// Time complexity: O(n)
// Space complexity: O(1) auxiliary space.
