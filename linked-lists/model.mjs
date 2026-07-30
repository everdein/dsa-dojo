export function validateLinkedListValues(values) {
  if (!Array.isArray(values)) {
    throw new Error("Linked-list values must be an array.");
  }

  for (let index = 0; index < values.length; index += 1) {
    if (!Number.isFinite(values[index])) {
      throw new Error("Linked lists only accept finite numbers.");
    }
  }

  return values;
}

export function createLinkedList(values, { cycleEntryIndex = null } = {}) {
  validateLinkedListValues(values);
  validateCycleEntryIndex(cycleEntryIndex, values.length);

  const nodes = values.map((value) => ({ value, next: null }));
  for (let index = 0; index < nodes.length - 1; index += 1) {
    nodes[index].next = nodes[index + 1];
  }
  if (cycleEntryIndex !== null) {
    nodes.at(-1).next = nodes[cycleEntryIndex];
  }

  return nodes[0] ?? null;
}

export function validateAcyclicLinkedList(head) {
  validateLinkedListNode(head);

  let slow = head;
  let fast = head;
  while (fast !== null && fast.next !== null) {
    validateLinkedListNode(slow);
    validateLinkedListNode(fast);
    validateLinkedListNode(fast.next);
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) {
      throw new Error("This operation requires an acyclic linked list.");
    }
  }

  let current = head;
  while (current !== null) {
    validateLinkedListNode(current);
    current = current.next;
  }

  return head;
}

export function validateLinkedListNode(node) {
  if (node !== null && (!isNode(node) || !Number.isFinite(node.value))) {
    throw new Error("A linked-list node requires a finite value and a node-or-null next reference.");
  }
  return node;
}

export function linkedListToValues(head) {
  validateAcyclicLinkedList(head);

  const values = [];
  let current = head;
  while (current !== null) {
    values.push(current.value);
    current = current.next;
  }
  return values;
}

function validateCycleEntryIndex(cycleEntryIndex, length) {
  if (cycleEntryIndex === null) return;
  if (
    !Number.isInteger(cycleEntryIndex)
    || cycleEntryIndex < 0
    || cycleEntryIndex >= length
  ) {
    throw new Error("Cycle entry must identify an existing node.");
  }
}

function isNode(value) {
  return typeof value === "object"
    && value !== null
    && Object.hasOwn(value, "value")
    && Object.hasOwn(value, "next")
    && (value.next === null || typeof value.next === "object");
}
