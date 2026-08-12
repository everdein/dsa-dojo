# Strings

## What Is a String?

A string is a sequence of characters. In JavaScript, strings are immutable, so many operations create new strings instead of modifying the original one.

## Why Strings Matter

Strings appear in parsing, validation, pattern matching, and text processing problems.

## Common Operations

| Operation | Time Complexity |
|---|---:|
| Access by index | O(1) |
| Concatenation | O(n) |
| Search | O(n) |
| Substring extraction | O(n) |

## When to Use Strings

Use strings for text processing, parsing, and encoding problems.

## Example

```javascript
const word = 'hello';
console.log(word.toUpperCase());
```

## Practice Exercises

- Reverse a string
- Check for palindrome
- Count characters
- Find the first non-repeating character

## Interactive Lessons

1. **Valid Palindrome** keeps the original text visible while two pointers skip
   punctuation and compare Unicode letters and numbers without case sensitivity.
2. **First Non-Repeating Character** composes a normalized frequency pass with
   an order-preserving selection pass.

Run `npm run studio`, then choose Strings from the lesson catalog. The reusable
algorithms live in [`valid-palindrome.mjs`](valid-palindrome.mjs) and
[`first-non-repeating.mjs`](first-non-repeating.mjs); the matching `.js` files
remain thin runnable examples.
