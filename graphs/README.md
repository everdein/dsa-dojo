# Graphs

## What Is a Graph?

A graph is a collection of nodes connected by edges. Graphs model networks, relationships, and state transitions.

## Why Graphs Matter

Graphs appear in routing, dependency mapping, social networks, and search problems.

## Common Operations

- DFS
- BFS
- Shortest path
- Cycle detection

## Example

```javascript
const graph = {
  A: ['B', 'C'],
  B: ['D'],
  C: ['D']
};
```

## Studio Input Format

Declare node labels as a comma-separated list. Labels start with a letter and
may contain letters, numbers, or hyphens. Declare each edge with a colon between
its endpoints, such as `north-hub:east-2`, and separate edges with commas. The
colon is reserved as the separator, so hyphenated labels round-trip without
ambiguity. In undirected lessons, `A:B` and `B:A` are the same edge.

## Practice Exercises

- Number of connected components
- Shortest path in an unweighted graph
- Detect cycles

## Interactive Lessons

- [Connected Components](connected-components.mjs) restarts BFS for each unvisited region.
- [Unweighted Shortest Path](shortest-path.mjs) records parents at first BFS discovery and reconstructs a route.
- [Detect a Graph Cycle](detect-cycle.mjs) distinguishes parent edges from undirected back edges.
