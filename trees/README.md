# Trees

## What Is a Tree?

A tree is a hierarchical data structure made of nodes connected by edges.

## Why Trees Matter

Trees model parent-child relationships and are used in file systems, DOM structures, and decision-making problems.

## Common Operations

- DFS traversal
- BFS traversal
- Insert/delete nodes
- Find min/max values

## Example

```javascript
class TreeNode {
  constructor(value) {
    this.value = value;
    this.left = null;
    this.right = null;
  }
}
```

## Practice Exercises

- Inorder traversal
- Level order traversal
- Validate a binary search tree

## Interactive Lessons

- [Inorder Traversal](inorder-traversal.mjs) uses an explicit stack to visit left, node, then right.
- [Level-Order Traversal](level-order-traversal.mjs) composes a binary tree with FIFO level boundaries.
- [Validate a BST](validate-bst.mjs) carries exclusive ancestor bounds to every node.
