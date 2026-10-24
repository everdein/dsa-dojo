# DSA Dojo Engineering Case Study

DSA Dojo makes algorithm execution explorable: change an input, predict the next
decision, step forward, rewind, and compare the visible state with executable
JavaScript. The engineering question is how to preserve that connection as the
curriculum grows across different data structures.

## Product walkthrough

1. Open [the live studio](https://everdein.github.io/dsa-dojo/studio).
2. Select Find Largest and enter `-4, 8, 8, 3`. Step forward twice, then rewind.
3. Compare the highlighted code with the current values and Pip's explanation.
4. Open Detect a Cycle to inspect a connected-node algorithm through the same
   player controls.
5. Share a custom execution state and reopen the link to resume that decision.

The product supports exploration and reflection. Improved learning outcomes,
retention, and adoption have not been established through a learner study.

## Engineering decisions

### Represent execution as data

Pure algorithms and deterministic trace builders produce owned snapshots of
each decision. A shared player selects a step rather than reversing mutations
in a running animation. This supports replay and rewind, with the tradeoff of
retaining trace state in memory.

### Verify the explanation as well as the answer

Runtime trace validation checks structure, source references, and renderer
snapshots. The stronger test/build path constructs traces twice, checks input
immutability and deterministic equality, and compares the final result with an
independent solver. These checks cover tested inputs; they are not a proof of
correctness for every possible execution.

### Extend through contracts

Lessons declare their input, solver, trace, code anchors, guide, and renderer
panels. Renderer adapters project domain state into semantic DOM presentation.
This allows array, graph, tree, and composite lessons to share player controls
without putting algorithm-specific branches into the composition root.

Browser-native modules keep the execution path inspectable and the static
release free of runtime package dependencies. The corresponding responsibility
is maintaining explicit browser controllers, state boundaries, and contracts.

### Keep code and visible execution connected

The source pane derives physical code lines from semantic anchors in the domain
module. Unrelated line insertions no longer require manually renumbering each
downstream reference. Focused tests catch missing anchors; authoring still
requires meaningful mappings between a trace decision and its source.

### Let the curriculum grow without loading every lesson

A lightweight manifest supplies the catalog. The browser dynamically imports
the selected lesson and caches its promise; comparison mode loads its selected
pair. CI uses an eager registry to verify the whole curriculum. This separates
interactive startup work from comprehensive verification without claiming an
unmeasured performance improvement.

## Result and evidence

The current curriculum contains 55 lessons using nine renderer families, with
shared playback, comparison, challenges, and shareable state. The deployed
static product demonstrates a reusable interactive system across several
algorithm families. Lesson count describes scope, not educational effectiveness.

Run `npm run check:release` after installing dependencies and Playwright Chromium.
The release suite exercises algorithms, contracts, static artifacts, and browser
flows, including automated accessibility checks. The main deployment workflow
requires the browser job to pass before publishing GitHub Pages. Automated
accessibility checks do not establish a complete manual assistive-technology audit.

Supporting sources:

- [Studio architecture and extension workflow](studio-architecture.md)
- [Lesson and trace validation](../studio/src/lesson-contract.mjs)
- [Player state machine](../studio/src/player.mjs)
- [Curriculum manifest](../studio/src/curriculum-manifest.mjs)
- [Source-pane mapping](../studio/src/source-pane.mjs)
- [Release workflow](../.github/workflows/ci.yml)
- [Browser verification](../e2e/studio.spec.mjs)
