import { validateAcyclicLinkedList } from "./model.mjs";

export function traverseLinkedList(head) {
  validateAcyclicLinkedList(head);
  const values = [];
  let current = head;

  while (current !== null) {
    values.push(current.value);
    current = current.next;
  }

  return values;
}
