# Hash Maps and Sets

## What Are They?

A hash map stores key-value pairs, while a set stores unique values. Both rely on hashing for fast lookup.

## Why They Matter

They are ideal for frequency counting, deduplication, caching, and membership checks.

## Common Operations

| Structure | Operation | Time Complexity |
|---|---|---:|
| Hash Map | Lookup/insert/delete | O(1) average |
| Set | Add/has/delete | O(1) average |

## Example

```javascript
const counts = new Map();
counts.set('a', 1);
console.log(counts.get('a'));
```

## Practice Exercises

- Count frequency of characters
- Find duplicates
- Group anagrams

## Interactive Lessons

- [Find Duplicates](find-duplicates.mjs) classifies first sightings and repeats with set membership.
- [Group Anagrams](group-anagrams.mjs) derives canonical keys and preserves group discovery order.
