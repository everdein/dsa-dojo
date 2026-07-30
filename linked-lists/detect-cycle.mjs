import { validateLinkedListNode } from "./model.mjs";

/**
 * Detects whether a linked list contains a cycle without changing any links.
 *
 * Slow advances one node per round while fast advances two. If the list ends,
 * fast reaches null. If the list loops, fast eventually catches slow.
 */
export function hasCycle(head) {
  validateLinkedListNode(head);
  let slow = head;
  let fast = head;

  while (fast !== null && fast.next !== null) {
    validateLinkedListNode(fast.next);

    slow = slow.next;
    fast = fast.next.next;
    validateLinkedListNode(slow);
    validateLinkedListNode(fast);

    if (slow === fast) {
      return true;
    }
  }

  return false;
}
