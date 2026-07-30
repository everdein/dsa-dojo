# DSA Dojo

DSA Dojo is an interactive learning product for making data structures and algorithms visible, inspectable, and explainable with JavaScript.

## Interactive Studio

**Status: Working visual learning experience with an introductory story and seven interactive lessons across arrays and linked lists.**

DSA Dojo includes a dependency-free browser experience where learners can see state change step by step, connect each visual transition to the code that caused it, and learn alongside Pip, an original guide companion.

The landing story introduces the learning model with small, synchronized Find Largest and Sliding Window demonstrations. The studio then gives the learner full control over the real execution trace: editable input, Previous, Next, Play/Pause, Reset, speed, source highlighting, explanations, and complexity.

The current catalog includes:

- **Find Largest** for scalar state and a linear scan
- **Sliding Window** for a moving range and reusable aggregate state
- **Reverse Array** for mirrored swaps and converging pointers
- **Move Zeros** for stable compaction with coordinated read and write pointers
- **Traverse a Linked List** for following references and recognizing null termination
- **Reverse a Linked List** for protecting, redirecting, and advancing pointers
- **Detect a Cycle** for Floyd's fast-and-slow pointer technique

The written field guides and runnable JavaScript exercises support the product, while each interactive lesson adds a distinct pattern or reusable visual capability.

Read the [product vision](docs/product-vision.md) for the learning model and roadmap, and the [studio architecture guide](docs/studio-architecture.md) for the implementation, lesson contract, and extension workflow.

## What This Repo Is

The goal of this dojo is to turn abstract concepts into practical, guided experiences. Each topic folder can include:

- a field guide in the form of a README
- exercises and practice prompts
- notes about when to use a structure or algorithm

Implementations become lesson sources of truth when they are validated, tested, and connected to deterministic traces.

## How to Use It

Use Node.js 18 or newer.

Run JavaScript files with Node.js:

```bash
node arrays/find-largest.js
```

Run the interactive studio locally:

```bash
npm install
npm run studio
```

Then open:

- `http://127.0.0.1:4173/` for the animated introduction
- `http://127.0.0.1:4173/studio` for the lesson catalog and player

The studio currently includes four array lessons and three linked-list lessons. Direct lesson links use the URL hash, such as `/studio#lesson=arrays%2Fmove-zeros` or `/studio#lesson=linked-lists%2Fdetect-cycle`. The existing Node.js exercises remain runnable independently.

Run the automated checks:

```bash
npm test
```

When you solve a problem, try to answer these questions:

1. What is the core idea?
2. What is the time complexity?
3. What is the space complexity?
4. When would this approach fail or become inefficient?
5. What pattern does this problem follow?

## Curriculum

The repository covers:

- arrays and strings
- matrices
- hash maps and sets
- linked lists
- stacks and queues
- heaps and priority queues
- trees and tries
- graphs and disjoint sets
- searching and sorting
- recursion, backtracking, greedy, and dynamic programming
- bit manipulation and complexity analysis

## Learning Approach

Each topic README explains:

- what the structure or pattern is
- how it works
- why it matters
- common operations and complexity
- common use cases
- interview patterns
- a basic JavaScript example
- exercises to practice

The code files are where the real learning happens. The README files are the guideposts.
