# Disjoint Sets

## What Are Disjoint Sets?

Disjoint sets, also known as union-find, track connected components and support efficient union and find operations.

## Why They Matter

They are commonly used for cycle detection and grouping connected items.

## Example

```javascript
class UnionFind {
  constructor(n) {
    this.parent = Array.from({ length: n }, (_, i) => i);
  }
}
```

The Count Components studio lesson uses the shared graph grammar: declare
comma-separated nodes, then write edges with a colon between endpoint labels,
such as `north-hub:east-2`. Hyphens remain valid inside labels.

## Practice Exercises

- Union two sets
- Detect whether two nodes are connected
- Count connected components

## Interactive Lessons

- [Union-Find Fundamentals](union-find.mjs) combines path compression with union by size.
- [Connectivity Queries](connectivity-queries.mjs) answers pair queries while improving later finds.
- [Count Components](count-components.mjs) reduces the count only when an edge joins distinct roots.
