# DSA Dojo Product Vision

- **Status:** Living product direction
- **Implemented foundation:** 55 lessons across 20 topics
- **Current checkpoint:** Release hardening and browser decomposition delivered; runtime efficiency next
- **Core promise:** See the algorithm think.

## Vision

DSA Dojo combines field guides and runnable JavaScript exercises with an
interactive algorithm-learning studio.

The studio helps learners understand what changes during an algorithm, why it
changes, and how that behavior connects to the code. It complements the
existing study material rather than replacing it.

The product evolves according to learner value, pattern coverage, and proven
renderer needs. Arrays established the interaction model; the completed core
curriculum then added only the visualization capabilities each later structure,
algorithm, or pattern required.

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

## Local Learning Continuity

The studio remembers completed lessons, the most recently visited lesson,
custom input, and the learner's last visible step in browser-local storage. The
landing page and studio both summarize overall and topic progress, while a
continue action restores the saved execution rather than merely reopening the
lesson.

This persistence is deliberately account-free and device-local. The interface
states that boundary plainly, validates stored lesson ids against the current
curriculum manifest, falls back safely when storage is unavailable or stale,
and provides an explicit two-step reset. Completion remains durable when a
learner replays or revisits an earlier step.

## Curriculum Discovery

The 55-lesson catalog remains browsable by topic while also supporting instant
search and composable topic, pattern, and local-progress filters. Search covers
lesson numbers, names, descriptions, topics, and reusable pattern tags. Active
filters produce a live result count, a useful empty state, and URL parameters
that survive reloads without interfering with Studio lesson deep links.

The same manifest powers a second discovery surface: an interactive Learning
Map. Prerequisite depth determines each left-to-right stage, lines show which
lessons unlock later work, and selecting a node isolates its immediate
prerequisites and dependents. Pattern highlighting and local completion state
remain available without turning the graph into a separate curriculum source.

## Challenge Mode

Challenge Mode converts deterministic lesson traces into active-recall rounds
without requiring a second set of hand-authored exercises. Before each state
transition, the learner chooses among three plausible outcomes drawn from the
lesson's own execution. The next state remains gated until the learner checks
an answer or deliberately reveals it.

Scoring rewards accurate reasoning rather than speed: first answers determine
accuracy and streaks, while reveal remains available so a learner is never
trapped. Autoplay is disabled during a challenge, Pip responds to correct and
incorrect predictions, and the standard guided player returns unchanged when
the mode is off. The preference and strongest completed result per lesson are
stored only on the learner's device.

## Algorithm Comparison Mode

Comparison Mode makes tradeoffs visible by running two compatible lessons on
independent copies of one shared input. The first comparison families are the
four sorting strategiesâ€”Bubble, Insertion, Merge, and Quick Sortâ€”and the naive
and memoized Fibonacci recurrences. These are genuine comparisons because each
family shares a problem definition, accepted input, and expected result.

The learner can advance both traces as synchronized beats, inspect either side
independently, or play both until their different trace lengths complete. Each
lane retains its renderer panels, narration, active physical source line, and
time/space complexity. The lab verifies equal results before rendering and
states plainly that recorded teaching transitions are not runtime benchmarks
or raw operation counts.

The mode intentionally excludes algorithms that are merely adjacent in the
curriculum but solve different problems. More comparison families should be
added only when the input and result semantics are honestly compatible.

## Shareable Algorithm States

Every lesson and comparison can produce a portable URL for its current visible
state. A lesson link includes the lesson id, serialized input fields, and trace
index. A comparison link includes its family, algorithm pair, shared fields,
and each lane's independent index. Opening the link rebuilds both algorithm and
trace state through the ordinary validated parsers; trace snapshots themselves
are never embedded or trusted.

The payload is versioned, bounded, Unicode-safe, and URL-safe. Malformed, stale,
unknown, or out-of-range state falls back to a usable lesson with a dismissible
explanation. Native device sharing is used when supported, with clipboard copy
as the desktop fallback. Links intentionally exclude local progress history,
challenge answers, best scores, and preferences.

## The Guide Companion

- **Name:** Sensei Pip
- **Concept:** A small, friendly data-node companion derived from the shapes of array cells, cursors, and connected nodes.

Pip gives the studio warmth and continuity without becoming the product itself.
The character varies subtly across arrays, links, branches, queues, and graphs
while keeping one recognizable identity.

Pip's persistent base silhouette is a rounded data cell with two short,
expressive arms and one small orbiting index marker. Arm poses, expressions,
colors, and topic-specific accessories can change, but the recognizable
cell-and-marker shape remains consistent. A warm gold headband is now the
standard identity marker; its restrained cloth motion reinforces the dojo theme
without implying combat or borrowing a familiar mascot silhouette.

The implemented emotion system gives that silhouette nine readable modes:
ready, curious, thinking, encouraging, guiding, aha, celebrating, caution, and
pattern-spotted cool. Player and prediction state choose the everyday modes;
lesson traces reserve stronger reactions for meaningful discoveries. Each
visual expression is paired with a short visible text label and remains legible
without motion.

Every emotion also has a compact mentor aside: observe before rushing, name the
invariant, test the edge case, reuse a recognized pattern, and value a clear
explanation over speed. These lines complement lesson-authored narration rather
than replacing or paraphrasing it.

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

Long empty scroll sequences, decorative motion, and oversized type should not delay the lesson or reduce usability. The studio entry point remains visible in the landing-page header and first viewport.

## Arrays-First Vertical Slice (Historical Design Record)

The first complete lesson visualizes the reusable implementation in
`arrays/find-largest.mjs`.

### Why Find Largest Comes First

Finding the largest value is small enough to understand without extra domain knowledge, but it still exercises the core product model:

- sequential traversal
- current position
- comparison
- accumulated best value
- a deterministic execution history
- time and space complexity

This lesson proved clear, reversible, accessible, and useful; the same player
now supports the complete 55-lesson curriculum.

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

### Shipped Array Progression

After Find Largest establishes scalar state and a linear scan:

1. **Sliding Window** validates the shared player with a moving range and aggregate state.
2. **Reverse Array** adds mirrored mutation and converging pointers.
3. **Move Zeros** adds stable compaction and coordinated read/write pointers.
4. **Pair Sum** introduces lookup decisions when the catalog returns to arrays.
5. **Frequency Count** introduces derived lookup state.
6. **Longest Consecutive Sequence** uses set membership to start only the runs
   that matter.

Other array exercises remain standalone practice when they repeat an existing
interaction without adding a distinct reasoning pattern.

## Reusable Product Model

Each lesson is composed from five separable parts:

1. **Pure solver** computes the answer without browser or playback concerns.
2. **Trace builder** records a deterministic, solver-aligned execution history.
3. **Player state** handles forward, backward, play, pause, speed, and reset.
4. **Renderer adapters** validate and project one or more semantic views.
5. **Lesson content** supplies the goal, code, explanations, complexity, prompts, and Pip dialogue.

The existing topic folders remain useful as standalone study material. The interactive layer should consume or reference that knowledge without making the simple Node.js exercises harder to run.

The first implementation extracted `findLargest(values)` into a pure reusable
module. Its Node.js exercise became a thin runnable entry point, while a
separate trace adapter recorded comparisons and updates for the studio. Every
shipped lecture now follows the same solver/trace separation, and contract tests
verify that the final trace result agrees with the pure function.

## Delivered Curriculum Sequence

The core curriculum was delivered in this capability order:

1. Arrays vertical slice with the minimum lesson player
2. Extract and harden the reusable player, then add more array lessons
3. Linked lists as the first connected-node renderer and pattern progression
4. Strings, matrices, hash maps, sets, stacks, queues, and common array/string patterns
5. Trees, tries, heaps, and priority queues
6. Graphs and disjoint sets
7. Searching, sorting, recursion, backtracking, greedy algorithms, dynamic programming, and bit manipulation

Each topic introduced the smallest reusable visual capability it needed. Linked
lists added connections, trees added branching, and graphs added traversal
across non-hierarchical relationships. The current catalog uses nine registered
renderer adapters and supports both single-view and ordered composite lessons.

The shipped lecture sequence, prerequisites, renderer increments, and deliberate
practice-only exclusions are recorded in
[`curriculum-roadmap.md`](curriculum-roadmap.md). That document is the delivery
record for L01-L55 and the authority for the current post-curriculum
verification phase.

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
- motion or marketing polish that is disconnected from the learning interaction
- a recreation of Phantom's visual identity

The first release proved that an algorithm can be made easier to understand
through synchronized state, code, narration, and learner-controlled playback.
Everything else builds from that evidence.

## Core Curriculum Checkpoint

The studio now has a framework-free player state machine, a validated lesson
registry, a lightweight curriculum manifest, deterministic trace contracts,
and nine renderer adapters: array, sequence, lookup, grid, stack, queue,
branching, graph, and linked list. A lecture can use one view or synchronize
several ordered panels without adding lesson-specific browser branches.

The shipped curriculum contains 55 lessons across 20 topics, from linear scans
and pointer movement through trees, graphs, union-find, sorting, recursion,
backtracking, greedy reasoning, dynamic programming, and bit manipulation.
Prerequisite metadata connects those topics into a progression, while pattern
tags make repeated ideas such as breadth-first search, memoization, and top-k
selection visible across category boundaries.

The repository includes a dependency-free static build, CI on supported Node.js
versions, hundreds of focused Node unit/integration tests, enforced coverage
floors, desktop/mobile Playwright checks, axe accessibility checks,
prediction-before-reveal, and explicit lesson-completion actions. Pages deploys
from that CI workflow only after browser verification succeeds. Browser
orchestration is now split across focused session, sharing, timing, and
visualization modules. The next phase reduces runtime validation and loading
cost and broadens targeted renderer assertions.

## Introductory story checkpoint

The product now has a dedicated introductory route that demonstrates the
learning model before handing control to the studio. It uses the same visual
language, array concepts, and Pip companion as the lessons instead of creating
a separate marketing identity.

The story proves five ideas in order:

1. state changes one decision at a time
2. patterns such as Sliding Window reuse previous work
3. the learner controls playback and prediction
4. one deterministic trace synchronizes every explanation surface
5. direct lesson links preserve a short path into practice

Sensei Pip now has a reusable motion vocabulary across the landing page and studio.
The states communicate curiosity, thinking, guidance, completion, and caution
without carrying essential information on their own. Ordinary scrolling,
observer fallbacks, reduced-motion behavior, and mobile-specific layout rules
keep the storytelling layer subordinate to learning.

The compact landing demonstrations run one finite pass, stop, and provide a
Replay control. They are previews of the interaction model rather than passive,
continuously looping decoration.
