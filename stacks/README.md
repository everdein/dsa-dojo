# Stacks

## What Is a Stack?

A stack is a linear structure that follows LIFO order: last in, first out.

## Why Stacks Matter

Stacks are used for undo functionality, expression evaluation, and recursive call tracking.

## Common Operations

| Operation | Time Complexity |
|---|---:|
| Push | O(1) |
| Pop | O(1) |
| Peek | O(1) |

## Example

```javascript
const stack = [];
stack.push(1);
stack.push(2);
console.log(stack.pop());
```

## Practice Exercises

- Valid parentheses
- Min stack
- Evaluate postfix expression

## Interactive Lessons

- [Valid Parentheses](valid-parentheses.mjs) matches each closer to the latest opener.
- [Min Stack](min-stack.mjs) stores a running minimum at every depth.
- [Evaluate Postfix](evaluate-postfix.mjs) preserves operand order during reductions.
