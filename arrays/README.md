# Arrays

## What Is an Array?

An array is an ordered collection of values stored in contiguous memory. Each value can be accessed by its index.

## Why Arrays Matter

Arrays are one of the most fundamental data structures in DSA. They are used for sequential data, iteration, searching, sorting, and as the basis for many other structures.

## Common Operations

| Operation | Time Complexity |
|---|---:|
| Access by index | O(1) |
| Update by index | O(1) |
| Search | O(n) |
| Append | O(1) amortized |
| Insert/remove at beginning | O(n) |

## When to Use Arrays

Use arrays when order matters and you need fast index-based access.

## When Not to Use Arrays

Avoid arrays when you need frequent insertions or deletions at the beginning or middle.

## Example

```javascript
const numbers = [10, 20, 30];
console.log(numbers[0]);
numbers.push(40);
```

## Practice Exercises

- Find the largest value
- Reverse an array
- Move zeros to the end while preserving non-zero order
- Find the maximum sum in a fixed-size window
- Remove duplicates
- Find two numbers that sum to a target

## Interactive Lessons

The DSA Dojo studio currently uses four array lessons to establish reusable
visual patterns:

1. **Find Largest** - linear scan and scalar best-so-far state
2. **Sliding Window** - moving range and reusable aggregate state
3. **Reverse Array** - mirrored swaps and converging pointers
4. **Move Zeros** - stable compaction with read and write pointers

Each lesson keeps the public algorithm input immutable, records deterministic
array snapshots for exact rewind, and explains the difference between the
algorithm's working space and the studio's visualization history.
