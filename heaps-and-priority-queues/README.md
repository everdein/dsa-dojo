# Heaps and Priority Queues

## What Are They?

A heap is a tree-based structure that keeps the highest or lowest priority element at the top. Priority queues use this property for scheduling and ranking.

## Why They Matter

Heaps are commonly used for top-k problems, median maintenance, and event-driven simulations.

## Example

```javascript
const heap = [3, 1, 2];
```

## Practice Exercises

- K largest elements
- Merge K sorted lists
- Top K frequent elements

## Interactive Lessons

- [Heap Insert and Remove](heap-operations.mjs) restores a min-heap with sift-up and sift-down.
- [K Largest Elements](k-largest.mjs) keeps a bounded min-heap of candidates.
- [Top K Frequent Elements](top-k-frequent.mjs) composes frequency counting with priority selection.
- [Merge K Sorted Lists](merge-k-sorted-lists.mjs) advances one source from a deterministic heap frontier.
