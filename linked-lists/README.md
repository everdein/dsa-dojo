# Linked Lists

## What Is a Linked List?

A linked list is a linear data structure where each node points to the next node.

## Why Linked Lists Matter

Linked lists are useful when insertion and deletion are common and random access is less important.

## Common Operations

- Insert at head or tail
- Delete a node
- Traverse the list
- Reverse the list

## Example

```javascript
class Node {
  constructor(value) {
    this.value = value;
    this.next = null;
  }
}
```

## Practice Exercises

- Traverse a linked list
- Reverse a linked list
- Detect a cycle
- Merge two lists

## Interactive Lessons

The studio now includes a three-lesson linked-list progression:

1. **Traverse a Linked List** establishes nodes, next references, and null as the stopping rule.
2. **Reverse a Linked List** makes pointer mutation inspectable by separating save, redirect, and advance.
3. **Detect a Cycle** introduces fast and slow pointers, overlapping pointer labels, self-loops, and return connections.

Run `npm run studio`, then choose Linked Lists from the lesson catalog. The domain implementations remain independent of the browser in:

- `model.mjs`
- `traverse-linked-list.mjs`
- `reverse-linked-list.mjs`
- `detect-cycle.mjs`
