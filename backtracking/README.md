# Backtracking

## What Is Backtracking?

Backtracking explores possible choices and retreats when a path fails.

## Why It Matters

It is used for constraint satisfaction, permutations, combinations, and puzzle solving.

## Example

```javascript
function backtrack(state) {
  if (isSolution(state)) return;
  for (const choice of choices(state)) {
    makeChoice(choice);
    backtrack(state);
    undoChoice(choice);
  }
}
```

## Practice Exercises

- Generate permutations
- Solve Sudoku-style puzzles
- N-Queens

## Interactive Lessons

- [Generate Permutations](permutations.mjs) traces choose, recurse, record, and undo.
- [N-Queens](n-queens.mjs) prunes attacked squares and backtracks from dead ends.
