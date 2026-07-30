import { validateLinkedListNode } from "./model.mjs";

export function traverseLinkedList(head) {
  validateLinkedListNode(head);
  const values = [];
  let current = head;

  while (current !== null) {
    values.push(current.value);
    current = current.next;
    validateLinkedListNode(current);
  }

  return values;
}
