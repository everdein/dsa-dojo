# Recursion

## What Is Recursion?

Recursion solves a problem by breaking it into smaller versions of the same problem.

## Why Recursion Matters

It is a natural fit for tree traversal, backtracking, divide-and-conquer, and many interview problems.

## Example

```javascript
function factorial(n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}
```

## Practice Exercises

- Factorial
- Fibonacci
- Sum of a list

## Interactive Lessons

- [Factorial](factorial.mjs) shows base-case descent and return-value unwinding.
- [Recursive Fibonacci](fibonacci.mjs) exposes overlapping subproblems and repeated call-tree work.
