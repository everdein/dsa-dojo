# DSA Dojo Interactive Studio

- **Status:** Product direction
- **Starting point:** Arrays
- **Core promise:** See the algorithm think.

## Vision

DSA Dojo will grow from a collection of field guides and runnable JavaScript exercises into an interactive algorithm-learning studio.

The studio should help learners understand what changes during an algorithm, why it changes, and how that behavior connects to the code. It complements the existing study material rather than replacing it.

The product will evolve alongside the learning journey. Arrays establish the interaction model first. Each later data structure, algorithm, or pattern should add only the visualization capabilities it genuinely needs.

## Who It Is For

The initial audience is a learner who understands JavaScript syntax but still finds it difficult to visualize changing state, recognize reusable patterns, or explain complexity confidently.

The experience should make it easier to answer:

- What is the algorithm doing right now?
- Which values or nodes matter at this step?
- What line of code caused the change?
- Why was this decision made?
- What is the time and space cost?
- When would this approach stop being a good choice?

## Learning Loop

Every interactive lesson should follow the same basic loop:

1. Read the goal and starting state.
2. Predict what the algorithm will do next.
3. Step through the execution or play it continuously.
4. Connect the visual state to the highlighted source-code line.
5. Explain the pattern, complexity, and tradeoffs.
6. Change the input and test the explanation again.

The learner should remain an active participant. The studio should not immediately reveal every answer.

## The Guide Companion

- **Working name:** Pip
- **Concept:** A small, friendly data-node companion derived from the shapes of array cells, cursors, and connected nodes.

Pip gives the studio warmth and continuity without becoming the product itself. The character can evolve visually as new structures introduce links, branches, queues, and graphs.

Pip's persistent base silhouette is a rounded data cell with one small orbiting index marker. Expressions, colors, and topic-specific accessories can change, but the recognizable cell-and-marker shape remains consistent.

### Responsibilities

Pip should:

- introduce the lesson goal in plain language
- ask short prediction questions before important steps
- explain meaningful state transitions
- offer optional, graduated hints
- reinforce useful vocabulary and patterns
- celebrate understanding rather than speed
- direct attention without covering the visualization

### Behavior Boundaries

Pip should never:

- give away the complete solution before the learner engages
- interrupt every step or repeat what is already obvious
- block controls, code, or visual state
- rely on animation to communicate essential information
- shame mistakes or reward speed over reasoning

Pip must be dismissible or minimizable. Guide messages should also be available to screen readers.

### Originality Guardrails

The inspiration is the friendliness of a simple product companion, not another brand's mascot. Pip should have an original silhouette, palette, expression system, voice, and motion language. It should not use a ghost shape, Phantom's lavender identity, matching facial treatment, or copied animations.

## Experience Principles

1. **Learning before spectacle.** Motion and visual polish must clarify state.
2. **One primary concept per lesson.** Additional ideas should use progressive disclosure.
3. **One source of truth.** Code, visualization, narration, and complexity must agree.
4. **State must be inspectable.** Learners can pause, step backward, and replay deterministically.
5. **Accessibility is foundational.** Keyboard use, semantic structure, useful announcements, contrast, and reduced motion are required.
6. **Mobile is a real learning surface.** The lesson must remain usable, not merely fit on a small screen.
7. **Progress follows understanding.** New topics are added when the current model works, not according to artificial deadlines.

## Visual Direction

The studio can use an expressive product-storytelling style while developing its own identity:

- spacious sections with one clear idea at a time
- large, approachable typography
- rounded visualization stages
- layered cards that reveal related state or concepts
- alternating soft color fields to separate topics
- restrained scroll reveals and meaningful microinteractions
- a distinct DSA Dojo palette rather than borrowed brand colors

Long empty scroll sequences, decorative motion, and oversized type should not delay the lesson or reduce usability.

## Arrays-First Vertical Slice

The first complete lesson will visualize `arrays/find-largest.js`.

### Why Find Largest Comes First

Finding the largest value is small enough to understand without extra domain knowledge, but it still exercises the core product model:

- sequential traversal
- current position
- comparison
- accumulated best value
- a deterministic execution history
- time and space complexity

If this lesson feels clear, reversible, accessible, and useful, the same player can support more complex array lessons.

### Learner Experience

The lesson should provide:

- an editable array with useful presets and validation
- visible array cells and indices
- the current index and value
- the best value and index found so far
- the relevant source-code line highlighted for each step
- a concise Pip prompt or explanation tied to the current state
- Previous, Next, Play/Pause, Reset, and speed controls
- a plain-language explanation of `O(n)` time and `O(1)` auxiliary space
- a final reflection prompt that asks the learner to explain why the result is correct

The first input contract accepts between 1 and 12 finite numeric values. It supports negative values and duplicates, rejects empty or nonnumeric input, and explains how the learner can correct invalid input.

Pip appears at four required learning moments: the lesson introduction, the first prediction prompt, an explanation when a new largest value is found, and the final reflection. If the learner minimizes Pip, that preference persists for the rest of the lesson.

### Example Trace Step

The visualization should consume deterministic trace data rather than embedding animation instructions inside the algorithm:

```javascript
{
  step: 5,
  phase: "compare",
  activeIndex: 4,
  comparedValue: 5,
  previousBestValue: 4,
  bestValue: 5,
  bestIndex: 4,
  codeSteps: ["compare", "update-largest"],
  view: {
    values: [1, 2, 3, 4, 5],
    activeIndices: [4],
    ranges: [],
    markers: [{ index: 4, kind: "best", label: "best" }]
  },
  narration: "5 becomes the new largest value because it is greater than 4."
}
```

This separation allows the same execution history to drive visuals, code highlighting, guide narration, keyboard navigation, tests, and accessible announcements.

The complexity panel describes the algorithm without studio instrumentation: `O(n)` time and `O(1)` auxiliary space. Retaining a reversible execution trace adds visualization memory proportional to the number and size of recorded steps, and the interface should explain that distinction.

### Vertical-Slice Acceptance Criteria

The first lesson is complete when:

- trace generation is deterministic and unit tested
- every step identifies the active elements, relevant values, code line, and explanation
- Previous reconstructs the exact prior state
- Play, Pause, Next, Previous, Reset, and speed controls behave consistently
- custom array input is validated with useful feedback
- keyboard users can complete the entire lesson
- screen readers receive meaningful state-change announcements
- reduced-motion mode communicates every change without movement
- the experience works on mobile and desktop
- Pip appears at the four defined learning moments and its minimized state persists for the current lesson
- the existing Node.js exercise continues to run independently

### Arrays Expansion Order

After Find Largest establishes scalar state and a linear scan:

1. **Sliding Window** validates the shared player with a moving range and aggregate state.
2. **Reverse Array** or **Move Zeros** adds mutation and multiple pointers.
3. **Pair Sum** introduces lookup or two-pointer decisions.
4. **Frequency Count** introduces derived state.
5. The remaining array exercises become lessons only when they add learning value rather than duplicate an existing interaction.

## Reusable Product Model

Each lesson should be composed from four separable parts:

1. **Algorithm definition** produces a deterministic execution trace.
2. **Player state** handles forward, backward, play, pause, speed, and reset.
3. **Renderer** translates trace state into an array, string, tree, graph, or other semantic view.
4. **Lesson content** supplies the goal, code, explanations, complexity, prompts, and Pip dialogue.

The existing topic folders remain useful as standalone study material. The interactive layer should consume or reference that knowledge without making the simple Node.js exercises harder to run.

The first implementation begins by extracting `findLargest(values)` into a pure reusable module. The existing Node.js exercise becomes a thin runnable entry point, while a separate trace adapter records comparisons and updates for the studio. Tests must verify that the pure function and the final trace state always produce the same result.

## Iterative Roadmap

Expansion follows actual study progress:

1. Arrays vertical slice with the minimum lesson player
2. Extract and harden the reusable player, then add more array lessons
3. Strings, matrices, hash maps, sets, and common array/string patterns
4. Linked lists, stacks, and queues
5. Trees, tries, heaps, and priority queues
6. Graphs and disjoint sets
7. Searching, sorting, recursion, backtracking, greedy algorithms, dynamic programming, and bit manipulation

Each topic should introduce the smallest reusable visual capability needed for that topic. For example, linked lists add connections, trees add branching, and graphs add traversal across non-hierarchical relationships.

## Definition of Done for a Topic

A topic is considered part of the interactive studio only when it has:

- a clear learning objective
- at least one runnable implementation
- deterministic trace generation
- an interactive lesson using the shared player
- code, narration, and complexity that agree
- keyboard and screen-reader support
- reduced-motion behavior
- automated tests for the algorithm and trace
- responsive verification
- documentation of what the lesson teaches and what it intentionally omits

## Non-Goals for the First Release

The arrays vertical slice does not need:

- accounts or saved progress
- leaderboards, streaks, or social features
- a large lesson catalog
- an AI tutor
- complex Canvas rendering when semantic HTML and CSS are sufficient
- a polished marketing page before the learning interaction works
- a recreation of Phantom's visual identity

The first release exists to prove that one algorithm can be made genuinely easier to understand. Everything else builds from that evidence.

## Foundation checkpoint

The studio now has a framework-free player state machine, a validated lesson
registry, deterministic trace contracts, an array view model, and automated
tests for algorithms, traces, input rules, rendering state, and player
transitions. Find Largest remains the reference scalar-state lesson. Sliding
Window is the second lesson and validates range highlighting, entering and
leaving markers, aggregate state, and catalog switching.

The next checkpoint is evaluation rather than immediate catalog expansion.
After the two-lesson foundation is exercised, Reverse Linked List can become
the first deliberate renderer stress test. This sequence gives us evidence
before adding tree, graph, or dynamic-programming-specific infrastructure.
