# Interactive Studio Architecture

## Purpose

The DSA Dojo studio turns an algorithm execution into a reversible learning
experience. A learner can change the input, move one decision at a time, replay
the execution, compare state with executable code, and use Pip's prompts to
explain what changed.

The implementation is intentionally dependency-free. It uses browser-native
ES modules, semantic HTML, CSS, and a small Node.js static server. This keeps
the learning code visible across the complete 55-lesson curriculum.

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
hundreds of focused Node.js unit and integration tests. The release suite also
checks syntax, builds the static site, and then uses `scripts/run-e2e.mjs` to
start the artifact preview, exercise desktop and mobile Chromium with
Playwright and axe-core, and stop the preview cleanly.

The server also accepts an optional port for local verification:

```bash
node studio/server.mjs 4180
```

## Project Map

```text
<topic>/
  *.mjs                     Pure algorithms and shared domain models
  *.js                      Thin runnable Node.js examples
  README.md                 Topic field guide

studio/
  home.html                 Scroll-driven introductory story
  index.html                Semantic lesson-studio shell
  server.mjs                Manifest-aware local static-file server
  src/
    app.mjs                 Browser adapter and event wiring
    curriculum-manifest.mjs Authoritative catalog and runtime-module data
    renderer-registry.mjs   Adapters and composite-panel resolution
    *-renderer.mjs          Validation, ownership, and accessible projection
    lesson-contract.mjs     Lesson and deterministic trace validation
    player.mjs              Framework-free player state machine
    *.mjs                   Lesson-specific deterministic trace builders
    lessons/
      index.mjs             Validated lesson registry
      *.mjs                 L01-L55 lesson definitions

test/
  build.test.mjs            Static artifact completeness tests
  server.test.mjs           HTTP boundary and allowlist tests
  *-renderer.test.mjs       Focused adapter contract/projection tests
  <lesson>.test.mjs         Focused algorithm and trace tests

e2e/
  studio.spec.mjs           Desktop/mobile flows and accessibility checks

scripts/
  build-static.mjs          Manifest-aware static release builder
  check-syntax.mjs          Cross-platform JavaScript syntax check
  preview-static.mjs        Exportable build-artifact preview server
  run-e2e.mjs               Preview lifecycle and Playwright orchestrator
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
complexity, statistics, guide content, trace, and reflection. Visual state is
projected through the renderer registry. A lesson declares either one legacy
`renderer` or an ordered `views` panel list; composite trace steps provide one
keyed snapshot for every declared panel. The built-in adapters are `array`,
`sequence`, `lookup`, `grid`, `stack`, `queue`, `branching`, `graph`, and
`linked-list`.

The local server keeps the two product surfaces explicit, serves only GET and
HEAD requests, and applies a restrictive set of browser security headers:

- `/` serves the introductory story
- `/studio` serves the interactive lesson application

Shared CSS and browser modules are allowlisted without exposing the rest of the
repository. The curriculum manifest supplies lesson definitions and transitive
domain-module paths to both the server and static builder. Malformed URLs and
directory traversal attempts resolve to no file.

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

The implementation in the relevant topic folder owns the actual result and
complexity. It must not know about animation, the browser, Pip, or playback
history. Runnable `.js` files remain thin Node.js entry points for independent
study.

### Lesson definition

A registered lesson supplies:

- stable id, topic, order, title, summary, and catalog copy
- instructional prerequisites and reusable pattern tags
- input fields, parser, serializer, default input, and sample input
- pure solver and deterministic trace builder
- executable source lines and semantic code-step mappings
- statistic selectors, complexity explanation, legend, Pip heading, and reflection
- exactly one renderer id or an ordered list of keyed view panels

`studio/src/curriculum-manifest.mjs` is the lightweight authority for ordering,
catalog metadata, prerequisites, patterns, lesson-module paths, and transitive
domain modules. The lesson registry overlays that metadata onto definitions and
tests require exact manifest/registry agreement. Duplicate ids, incomplete
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
can still rewind deterministically. Each renderer adapter validates its own
shape, references, bounds, nested objects, and snapshot ownership. Composite
steps must provide exactly the declared panel keys. Dangling topology, unknown
references, non-finite derived numbers, and shared snapshots fail before the
browser renders them.

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

### Additional renderer adapters

- **Sequence** preserves Unicode-aware character identity and raw-text position.
- **Lookup** projects deterministic key/value entries, active keys, annotations,
  and result keys for maps, sets, memo tables, and parent tables.
- **Grid** validates bounded rectangular numeric cells for matrices, intervals,
  dynamic-programming tables, and boards.
- **Stack** and **queue** preserve stable item identity while exposing their
  different accessible order and endpoint semantics.
- **Branching** validates bounded rooted forests for trees, tries, heaps,
  recursion, and backtracking choices.
- **Graph** validates directed or undirected general topology, including
  self-edges, traversal states, and stable semantic node ids.

Composite lessons synchronize any compatible subset of these adapters while
the player still advances one shared trace index.

## Adding a Lesson

1. Implement and export a pure algorithm in the appropriate topic folder.
2. Add focused algorithm tests, including invalid and boundary inputs.
3. Build a deterministic trace adapter with an explicit completion result.
4. Create a lesson definition containing the complete lesson contract.
5. Add its catalog and transitive runtime modules to
   `studio/src/curriculum-manifest.mjs`, then register its definition in
   `studio/src/lessons/index.mjs`.
6. Add trace tests for every meaningful decision branch and renderer state.
7. Run `npm run check:release`.
8. Perform a focused visual pass for any new renderer or layout behavior.

A new lesson should introduce learning value or a reusable visual capability.
It should not be added only to increase the catalog count.

## Current Curriculum

The registry contains 55 ordered lessons across 20 topics:

| Progression | Lessons |
| --- | ---: |
| Arrays, Linked Lists, Strings, Matrices, Hash Maps and Sets | 16 |
| Stacks, Queues, Patterns, Searching, Trees, and Tries | 13 |
| Heaps and Priority Queues, Graphs, and Disjoint Sets | 10 |
| Sorting, Recursion, Backtracking, Greedy, Dynamic Programming, and Bit Manipulation | 16 |

The sequence starts with inspectable scalar and pointer state, composes multiple
views for derived structures and traversals, and ends with alternative-strategy
comparisons and optimization. The complete lecture list, prerequisites, module
paths, and deliberate practice-only exclusions live in
[`curriculum-roadmap.md`](curriculum-roadmap.md).

## Verification Standard

The current automated suite checks:

- manifest ordering, immutability, transitive runtime-module coverage, and
  registry agreement
- registry uniqueness and complete lesson contracts
- default and sample trace determinism
- solver/trace result agreement
- input parsing and validation
- algorithm correctness and input immutability
- trace decision branches, invariants, stable identity, and phase-specific state
- all nine renderer adapters, composite panel keys, projection, accessible
  descriptions, and deep snapshot ownership
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
- long rows, grids, branching layouts, graphs, and composite panels stay inside
  the visualization stage at supported widths
- browser console contains no warnings or errors
- `/` and `/studio` both load without document-level horizontal overflow
- Pip reacts to ready, playing, paused, complete, and error states
- reduced-motion users receive the same content without reveal travel or looping motion

## Deliberate Boundaries

The local server is a development tool, not a production application server.
`npm run build` creates a dependency-free `dist/` directory whose relative
asset links work from a domain root or project subpath. `npm run preview` serves
a fresh build through the `/dsa-dojo/` URL shape used by the browser suite and
GitHub Pages. The Pages workflow independently runs the fast syntax, unit, and
build checks before uploading its freshly built `dist/`; it does not yet depend
on the separate browser-smoke job.
The studio currently has no accounts, saved progress, backend, analytics, or
framework dependency. Those concerns should only be introduced when a proven
learning requirement needs them.

The 55-lesson core curriculum now spans 20 topics and nine renderer families.
Every lesson shares the validated registry, deterministic traces, player, code
mapping, Pip guidance, and accessibility model. The next checkpoint is the
post-curriculum verification phase: consolidate fixtures, measure and fill
coverage gaps, broaden per-renderer browser assertions, and gate Pages on the
fully verified artifact. That work is tracked in
[`curriculum-roadmap.md`](curriculum-roadmap.md).
