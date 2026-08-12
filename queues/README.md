# Queues

## What Is a Queue?

A queue is a linear structure that follows FIFO order: first in, first out.

## Why Queues Matter

Queues are used for scheduling, buffering, and breadth-first search.

## Common Operations

| Operation | Time Complexity |
|---|---:|
| Enqueue | O(1) |
| Dequeue | O(1) |
| Peek | O(1) |

## Example

```javascript
const queue = [];
queue.push(1);
queue.push(2);
console.log(queue.shift());
```

## Practice Exercises

- Implement a queue
- Sliding window maximum
- Binary tree level order traversal

## Interactive Lessons

- [Queue Operations](queue-operations.mjs) makes FIFO endpoints explicit.
- [Sliding Window Maximum](sliding-window-maximum.mjs) maintains a decreasing deque of candidates.
