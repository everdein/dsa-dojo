# Bit Manipulation

## What Is Bit Manipulation?

Bit manipulation works directly with binary representations of numbers.

## Why It Matters

It is useful for performance-sensitive problems, flags, and compact state representations.

## Example

```javascript
const x = 5; // 0101
console.log(x & 1);
```

## Practice Exercises

- Bitwise parity
- Count set bits
- Find the unique value with XOR

## Interactive Lessons

- [Bitwise Parity](parity.mjs) reads the least-significant bit with a fixed mask.
- [Count Set Bits](count-set-bits.mjs) clears one lowest set bit per iteration.
- [Find the Unique Value with XOR](single-number.mjs) uses cancellation and identity.
