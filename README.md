# DSA Dojo

This repository is a personal study space for building strong foundations in data structures and algorithms with JavaScript.

## Interactive Studio

**Status: Working visual learning experience with an introductory story and two interactive array lessons.**

DSA Dojo includes a dependency-free browser experience where learners can see state change step by step, connect each visual transition to the code that caused it, and learn alongside Pip, an original guide companion.

The landing story introduces the learning model with small, synchronized Find Largest and Sliding Window demonstrations. The studio then gives the learner full control over the real execution trace: editable input, Previous, Next, Play/Pause, Reset, speed, source highlighting, explanations, and complexity.

The current catalog includes:

- **Find Largest** for scalar state and a linear scan
- **Sliding Window** for a moving range and reusable aggregate state

The written field guides and runnable JavaScript exercises remain the foundation. Interactive lessons expand alongside the learning process, one proven visual capability at a time.

Read the [product vision](docs/product-vision.md) for the learning model and roadmap, and the [studio architecture guide](docs/studio-architecture.md) for the implementation, lesson contract, and extension workflow.

## What This Repo Is

The goal of this dojo is to turn abstract concepts into practical experience. Each topic folder includes:

- a field guide in the form of a README
- exercises and practice prompts
- notes about when to use a structure or algorithm

Implementation files are added as the study progresses.

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

The studio currently includes Find Largest and fixed-size Sliding Window lessons in an arrays catalog. Direct lesson links use the URL hash, such as `/studio#lesson=arrays%2Fsliding-window`. The existing Node.js exercises remain runnable independently.

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
