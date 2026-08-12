# Dynamic Programming

## What Is Dynamic Programming?

Dynamic programming solves problems by breaking them into overlapping subproblems and storing results for reuse.

## Why It Matters

It is essential for optimization problems such as knapsack, longest common subsequence, and path counting.

## Example

```javascript
function fib(n, memo = {}) {
  if (n <= 1) return n;
  if (Object.hasOwn(memo, n)) return memo[n];
  memo[n] = fib(n - 1, memo) + fib(n - 2, memo);
  return memo[n];
}
```

## Practice Exercises

- Fibonacci with memoization
- Climbing stairs
- Coin change

## Interactive Lessons

- [Memoized Fibonacci](memoized-fibonacci.mjs) replaces repeated recursive subtrees with cache hits.
- [Climbing Stairs](climbing-stairs.mjs) derives a one-dimensional transition and compresses its state.
- [Minimum Coins](coin-change.mjs) builds optimal subproblem values and reconstructs one solution.
