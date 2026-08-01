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

The repository requires Node.js 22 or newer.

Run the complete release suite with:

```bash
npx playwright install chromium
npm run check:release
```

The Playwright install is a one-time setup on a new machine. `npm test` runs
the fast Node.js unit and integration suite. The release suite also checks
syntax, builds the static site, and exercises desktop and mobile Chromium with
Playwright and axe-core.

The server also accepts an optional port for local verification:

```bash
node studio/server.mjs 4180
```

## Project Map

```text
arrays/
  find-largest.mjs          Pure Find Largest implementation
  move-zeros.mjs            Pure stable Move Zeros implementation
  reverse-array.mjs         Pure two-pointer Reverse Array implementation
  sliding-window.mjs        Pure fixed-size Sliding Window implementation

linked-lists/
  model.mjs                 Shared node creation, validation, and cloning
  traverse-linked-list.mjs  Pure traversal implementation
  reverse-linked-list.mjs   Pure in-place reversal implementation
  detect-cycle.mjs          Pure Floyd cycle-detection implementation

studio/
  home.html                 Scroll-driven introductory story
  home.css                  Landing-page visual system and responsive story layout
  index.html                Semantic lesson-studio shell
  styles.css                Responsive lesson-studio visual system
  pip.css                   Shared Pip silhouette, expressions, and motion states
  favicon.svg               Product favicon
  social-preview.jpg        Repository and social sharing preview
  server.mjs                Local static-file server
  src/
    app.mjs                 Browser adapter and event wiring
    array-renderer.mjs      Pure trace-view to array-cell projection
    linked-list-renderer.mjs Pure trace-view to node/link projection
    linked-list-view.mjs    Stable linked-list snapshot helpers
    home.mjs                Scroll reveals and compact landing demonstrations
    input.mjs               Shared input parsing and formatting
    lesson-contract.mjs     Lesson and deterministic trace validation
    navigation.mjs          Safe lesson-hash parsing and serialization
    pip.mjs                 Shared Pip component and player-state mapping
    player.mjs              Framework-free player state machine
    find-largest.mjs        Find Largest trace builder
    move-zeros.mjs          Move Zeros trace builder
    reverse-array.mjs       Reverse Array trace builder
    sliding-window.mjs      Sliding Window trace builder
    traverse-linked-list.mjs Linked List Traversal trace builder
    reverse-linked-list.mjs Linked List Reversal trace builder
    detect-cycle.mjs        Detect Cycle trace builder
    lessons/
      index.mjs             Validated lesson registry
      find-largest.mjs      Find Largest lesson definition
      move-zeros.mjs        Move Zeros lesson definition
      reverse-array.mjs     Reverse Array lesson definition
      sliding-window.mjs    Sliding Window lesson definition
      traverse-linked-list.mjs Linked List Traversal lesson definition
      reverse-linked-list.mjs Linked List Reversal lesson definition
      detect-cycle.mjs      Detect Cycle lesson definition

test/
  studio.test.mjs           Algorithms, contracts, traces, renderer, and player tests
  server.test.mjs           HTTP boundary, routing, and security-header tests

e2e/
  studio.spec.mjs           Desktop/mobile flows and accessibility checks

scripts/
  build-static.mjs          Dependency-free static release builder
  check-syntax.mjs          Cross-platform JavaScript syntax check
  preview-static.mjs        Build-artifact preview server used by Playwright
```

## Runtime Data Flow

```text
lesson registry
  -> selected lesson definition
  -> parsed learner input
  -> pure algorithm + deterministic trace builder
  -> validated trace
  -> player state machine
  -> renderer-specific view model
  -> semantic DOM, code highlighting, Pip narration, and live announcements
```

The browser controller does not contain algorithm-specific branches. It reads
the selected lesson definition and renders its inputs, source mapping,
complexity, statistics, guide content, trace, and reflection. Its only visual
dispatch is by renderer type, currently `array` or `linked-list`.

The local server keeps the two product surfaces explicit, serves only GET and
HEAD requests, and applies a restrictive set of browser security headers:

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

Every instance mounts the same body, eyes, two arms, orbit marker, and sparks.
Placement poses give the landing hero, story guide, finale, studio intro, and
lesson guide different arm rhythms; player state then layers on curious,
thinking, guiding, celebrating, or caution behavior. The arms remain visible
in every state.

The studio maps player behavior to those states: ready is curious, paused is
thinking, playing is guiding, complete is celebrating, and an input error is
caution. Pip remains decorative; narration, prompts, and player status are
always available as semantic text. An observer pauses Pip whenever it leaves
the viewport. Reduced-motion preferences remove travel, bouncing, and
continuous motion while preserving each visible state.

## Separation of Responsibilities

### Pure algorithm

The implementation in `arrays/*.mjs` or `linked-lists/*.mjs` owns the actual result and complexity.
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
    markers: [{ index: 1, kind: "best", label: "best" }],
    annotations: [],
    changedIndices: []
  }
}
```

The final step must use the `complete` phase and provide a `result` that
matches the pure solver. Every view owns a fresh snapshot so mutating lessons
can still rewind deterministically. Array views validate values, ranges,
markers, annotations, and changed indices. Linked-list views validate stable
node ids, next references, pointers, states, annotations, and changed nodes.
Dangling topology and shared snapshots fail before the browser renders them.

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
- one or more labeled markers per cell, including overlapping pointers
- optional per-index annotations
- explicit changed indices for mutation feedback
- complete value snapshots for deterministic mutation and rewind

The browser renders these models as semantic list items with text alternatives.
Long arrays stay on one logical row and scroll inside the visualization instead
of widening the document.

### Linked-list renderer

The pure linked-list projection supports:

- stable node positions while connections change
- forward, backward, return, jump, and self-loop connections
- one or more labeled pointers per node, including overlapping fast and slow pointers
- explicit null pointers and null-ending links
- semantic node states, annotations, and changed-link feedback
- accessible descriptions of each value, next target, pointer, and state

The browser keeps the node track on one logical row and scrolls it inside the
visualization. Connection shape is derived from stable node indices, so reverse
and cycle lessons can change topology without moving the nodes themselves.

## Adding a Lesson

1. Implement and export a pure algorithm in the appropriate topic folder.
2. Add focused algorithm tests, including invalid and boundary inputs.
3. Build a deterministic trace adapter with an explicit completion result.
4. Create a lesson definition containing the complete lesson contract.
5. Register it in `studio/src/lessons/index.mjs`.
6. Add trace tests for every meaningful decision branch and renderer state.
7. Run `npm run check:release`.
8. Perform a focused visual pass for any new renderer or layout behavior.

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

### Reverse Array

Introduces two inward-moving pointers, mirrored swaps, changed cells, settled
regions, and the pointer-meeting stopping rule. Its immutable public API makes
the returned copy's `O(n)` space explicit while separating the swap technique's
`O(1)` working space.

### Move Zeros

Introduces coordinated read and write pointers, stable compaction, overlapping
markers, and a growing invariant: every value before write is a correctly
ordered non-zero value. The visual trace distinguishes a skipped zero, a value
already in place, and a value moved into the stable prefix.

### Traverse a Linked List

Introduces node identity, next references, null termination, and a growing
visited set. It makes the difference between following a reference and
incrementing an array index explicit.

### Reverse a Linked List

Introduces three-pointer reasoning: save next, redirect current, then advance
previous and current. Nodes remain in stable visual positions while their links
change, so rewind restores the exact earlier topology. The executable core is
the canonical in-place `O(n)` time, `O(1)` auxiliary-space algorithm; the
studio supplies disposable nodes and records snapshots outside that core. A
constant-space Floyd preflight rejects cyclic inputs before mutation begins.

### Detect a Cycle

Introduces Floyd's fast-and-slow pointer technique, overlapping pointers,
cycle-entry versus meeting-node identity, return links, and self-loops. It
demonstrates that repeated values do not imply a cycle; node identity does.

## Verification Standard

The current automated suite checks:

- registry uniqueness and complete lesson contracts
- default and sample trace determinism
- solver/trace result agreement
- input parsing and validation
- algorithm correctness and input immutability
- trace decision branches and range invariants
- mutation snapshots, changed indices, pointer convergence, and stable order
- array view-model projection and accessible descriptions
- linked-list topology validation, snapshot ownership, and accessible projection
- traversal, reversal, null termination, return connections, and cycle meetings
- player loading, stepping, playback, reset, speed, guide, and error transitions
- server routes, methods, status codes, static assets, and security headers
- desktop and mobile lesson deep links, input validation, keyboard controls,
  prediction/reveal, document overflow, console errors, and serious WCAG issues

Before publishing a substantial visual change, also perform a short human pass
to confirm:

- lesson switching stops active playback
- invalid input preserves the last valid visualization
- code highlighting agrees with the executed transition
- no document-level horizontal overflow at desktop or mobile widths
- long array and linked-list rows scroll only inside the visualization stage
- browser console contains no warnings or errors
- `/` and `/studio` both load without document-level horizontal overflow
- Pip reacts to ready, playing, paused, complete, and error states
- reduced-motion users receive the same content without reveal travel or looping motion

## Deliberate Boundaries

The local server is a development tool, not a production application server.
`npm run build` creates a dependency-free `dist/` directory for deployment from
a static web root. `npm run preview` serves a fresh build through the same URL
shape used by the browser suite. The studio currently has no accounts, saved
progress, backend, analytics, or framework dependency. Those concerns should
only be introduced when a proven learning requirement needs them.

The seven-lesson foundation now covers four array patterns and a complete
three-lesson linked-list progression. Two renderer families share the same
validated lesson registry, deterministic traces, player, code mapping, Pip
guidance, and accessibility model. The next checkpoint should emphasize
showcase readiness: public delivery, concise architecture evidence, and only
then a third category whose visual needs genuinely extend the renderer system.
