# Interactive Studio Architecture

## Purpose

The DSA Dojo studio turns an algorithm execution into a reversible learning
experience. A learner can change the input, move one decision at a time, replay
the execution, compare state with executable code, and use Pip's prompts to
explain what changed.

The implementation is intentionally dependency-free. It uses browser-native
ES modules, semantic HTML, CSS, and a small Node.js static server. This keeps
the learning code visible while the product model is still being proven.

## Running the Studio

From the repository root:

```bash
npm install
npm run studio
```

Open `http://127.0.0.1:4173`.

The repository requires Node.js 18 or newer.

Run the complete automated suite with:

```bash
npm test
```

The server also accepts an optional port for local verification:

```bash
node studio/server.mjs 4180
```

## Project Map

```text
arrays/
  find-largest.mjs          Pure Find Largest implementation
  sliding-window.mjs        Pure fixed-size Sliding Window implementation

studio/
  home.html                 Scroll-driven introductory story
  home.css                  Landing-page visual system and responsive story layout
  index.html                Semantic lesson-studio shell
  styles.css                Responsive lesson-studio visual system
  pip.css                   Shared Pip silhouette, expressions, and motion states
  server.mjs                Local static-file server
  src/
    app.mjs                 Browser adapter and event wiring
    array-renderer.mjs      Pure trace-view to array-cell projection
    home.mjs                Scroll reveals and compact landing demonstrations
    input.mjs               Shared input parsing and formatting
    lesson-contract.mjs     Lesson and deterministic trace validation
    navigation.mjs          Safe lesson-hash parsing and serialization
    pip.mjs                 Shared Pip component and player-state mapping
    player.mjs              Framework-free player state machine
    find-largest.mjs        Find Largest trace builder
    sliding-window.mjs      Sliding Window trace builder
    lessons/
      index.mjs             Validated lesson registry
      find-largest.mjs      Find Largest lesson definition
      sliding-window.mjs    Sliding Window lesson definition

test/
  studio.test.mjs           Algorithms, contracts, traces, renderer, and player tests
```

## Runtime Data Flow

```text
lesson registry
  -> selected lesson definition
  -> parsed learner input
  -> pure algorithm + deterministic trace builder
  -> validated trace
  -> player state machine
  -> array view model
  -> semantic DOM, code highlighting, Pip narration, and live announcements
```

The browser controller does not contain algorithm-specific branches. It reads
the selected lesson definition and renders its inputs, source mapping,
complexity, statistics, guide content, trace, and reflection.

The local server keeps the two product surfaces explicit:

- `/` serves the introductory story
- `/studio` serves the interactive lesson application

Shared CSS and browser modules are allowlisted without exposing the rest of the
repository. Malformed URLs and directory traversal attempts resolve to no file.

## Introductory Story

The landing page explains the learning model before asking a visitor to operate
the full studio. Its Find Largest and Sliding Window demonstrations are small,
representative visual sequences rather than alternate algorithm
implementations. They communicate the core ideas while direct lesson links hand
off to the validated trace system.

Normal document scrolling remains in control. `IntersectionObserver` activates
one-time content reveals, updates Pip's current story note, and starts a compact
demonstration only while it is visible. Each demonstration runs one finite pass
in under five seconds and then stops; a visible Replay control restarts it on
request. If browser scripting or the observer is unavailable, the content
remains visible and the page still links directly to the studio.

## Pip Motion System

Pip is a shared, code-native companion with six states:

- `idle`
- `curious`
- `thinking`
- `guiding`
- `celebrating`
- `caution`

The studio maps player behavior to those states: ready is curious, paused is
thinking, playing is guiding, complete is celebrating, and an input error is
caution. Pip remains decorative; narration, prompts, and player status are
always available as semantic text. An observer pauses Pip whenever it leaves
the viewport. Reduced-motion preferences remove travel, bouncing, and
continuous motion while preserving each visible state.

## Separation of Responsibilities

### Pure algorithm

The implementation in `arrays/*.mjs` owns the actual result and complexity.
It must not know about animation, the browser, Pip, or playback history.
Runnable `.js` files remain thin Node.js entry points for independent study.

### Lesson definition

A registered lesson supplies:

- stable id, topic, order, title, summary, and catalog copy
- input fields, parser, serializer, default input, and sample input
- pure solver and deterministic trace builder
- executable source lines and semantic code-step mappings
- statistic selectors, complexity explanation, legend, Pip heading, and reflection
- renderer type

The registry validates every lesson when it loads. Duplicate ids, incomplete
metadata, invalid default traces, nondeterministic traces, or solver/trace
disagreement fail immediately.

### Trace

Every trace is an ordered array of self-contained snapshots. A trace step
contains:

```javascript
{
  step: 1,
  phase: "compare",
  codeSteps: ["compare", "update-largest"],
  narration: "5 becomes the new largest value.",
  prompt: "What changed and why?",
  view: {
    values: [3, 5, 2],
    activeIndices: [1],
    ranges: [],
    markers: [{ index: 1, kind: "best", label: "best" }]
  }
}
```

The final step must use the `complete` phase and provide a `result` that
matches the pure solver. Values are copied into each view so future mutating
lessons can still rewind deterministically.

### Player

The player reducer is the single source of truth for:

- active lesson and input
- trace index
- `ready`, `playing`, `paused`, `complete`, and `error` status
- playback speed
- Pip's minimized preference
- validation errors

Browser timers dispatch player actions; they do not maintain a second playback
state. Switching lessons stops the current timer before loading the new trace.

### Array renderer

The pure array projection supports:

- one or more active indices
- inclusive highlighted ranges
- labeled markers such as best, entering, and leaving
- optional per-index annotations
- complete value snapshots for future mutation

The browser renders these models as semantic list items with text alternatives.
Long arrays stay on one logical row and scroll inside the visualization instead
of widening the document.

## Adding a Lesson

1. Implement and export a pure algorithm in the appropriate topic folder.
2. Add focused algorithm tests, including invalid and boundary inputs.
3. Build a deterministic trace adapter with an explicit completion result.
4. Create a lesson definition containing the complete lesson contract.
5. Register it in `studio/src/lessons/index.mjs`.
6. Add trace tests for every meaningful decision branch and renderer state.
7. Run `npm test`.
8. Verify keyboard use, reduced motion, desktop layout, and mobile layout.

A new lesson should introduce learning value or a reusable visual capability.
It should not be added only to increase the catalog count.

## Current Lessons

### Find Largest

Introduces a linear scan, active index, best-value marker, conditional update,
and `O(n)` time with `O(1)` auxiliary space.

### Fixed-Size Sliding Window

Introduces a contiguous range, entering and leaving values, a reusable running
sum, and result ownership across multiple candidate windows. It demonstrates
why reusing previous work keeps the algorithm at `O(n)` time.

## Verification Standard

The current automated suite checks:

- registry uniqueness and complete lesson contracts
- default and sample trace determinism
- solver/trace result agreement
- input parsing and validation
- algorithm correctness and input immutability
- trace decision branches and range invariants
- array view-model projection and accessible descriptions
- player loading, stepping, playback, reset, speed, guide, and error transitions

Before publishing user-interface changes, also verify:

- lesson switching stops active playback
- invalid input preserves the last valid visualization
- code highlighting agrees with the executed transition
- no document-level horizontal overflow at desktop or mobile widths
- long array rows scroll only inside the array stage
- browser console contains no warnings or errors
- `/` and `/studio` both load without document-level horizontal overflow
- Pip reacts to ready, playing, paused, complete, and error states
- reduced-motion users receive the same content without reveal travel or looping motion

## Deliberate Boundaries

The local server is a development tool, not a production application server.
The studio currently has no accounts, saved progress, backend, analytics, or
framework dependency. Those concerns should only be introduced when a proven
learning requirement needs them.

The next product checkpoint is evaluation of the two-lesson foundation and its
new introductory story. A connection-based lesson such as Reverse Linked List
is the likely first test of a second renderer, but it should follow evidence
from using the current array experience.
