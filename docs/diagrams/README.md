# DSA Dojo diagrams

Implementation-backed views, checked against the local checkout on October 24, 2026.
These explain the existing system; they do not propose new runtime behavior.

## Reading order

1. [Release and runtime topology](01-release-and-runtime-topology.svg) - the
   publication path and the separate learner-device runtime.
2. [Execution architecture](02-execution-architecture.svg) - lesson loading,
   trace construction, playback, presentation, and verification boundaries.
3. [Learner interaction sequence](03-learner-interaction-sequence.svg) - input,
   prediction, reveal, forward movement, rewind, and guided playback.

Each view also has an editable `.mmd` source and a `.png` export with the same
filename. Open a source in VS Code and run **Mermaid Preview: Preview Diagram**.
Use SVG for zooming or publishing. The full interaction sequence is a detailed
technical artifact, not a social thumbnail.

## What these views establish

- GitHub Pages serves static assets. Algorithms and player state execute in
  the browser. There is no application API, account service, or server-side
  learner database in the depicted architecture.
- Publication follows the workflow's verification and browser gates on main;
  the topology describes configured release behavior, not a fresh live audit.
- The curriculum manifest supports on-demand lesson imports. Lessons supply
  parsing, trace building, and semantic source anchors.
- Runtime `buildTrace` performs structural validation. The stronger
  `buildVerifiedTrace` path checks repeatability, input immutability, and
  agreement with an independent solver in tests and builds.
- Previous selects a stored trace step. It does not reverse the algorithm or
  mutate a remote system. The renderer and source pane project the selected
  execution state through different adapters.
- Challenge Mode resets playback and gates Next until an answer or skip.
  Feedback reveals the transition before Next advances the player. Disabling
  Challenge Mode resets playback again before guided autoplay resumes.
- Storage is device-local and can be unavailable. Shareable URLs encode a
  selected state; they do not synchronize progress between accounts.

Solid flowchart arrows indicate the labeled dependency or flow. The dotted
verification edge separates test/build work from browser execution. Sharing remains an application behavior described in the notes, rather than a
separate infrastructure service.
See the [studio architecture](../studio-architecture.md) for the complete model.

## Implementation evidence

- [Release gates and deployment](../../.github/workflows/ci.yml)
- [Static artifact builder](../../scripts/build-static.mjs)
- [Composition root and learner events](../../studio/src/app.mjs)
- [Curriculum manifest](../../studio/src/curriculum-manifest.mjs)
- [Cached lesson loader](../../studio/src/lesson-loader.mjs)
- [Trace contracts and verification](../../studio/src/lesson-contract.mjs)
- [Pure player reducer](../../studio/src/player.mjs)
- [Playback clock and storage boundary](../../studio/src/browser-runtime.mjs)
- [Renderer registry](../../studio/src/renderer-registry.mjs)
- [Physical source mapping](../../studio/src/source-pane.mjs)
- [Challenge questions and scoring](../../studio/src/challenge-mode.mjs)
- [Lesson restore and persistence](../../studio/src/lesson-session.mjs)
- [Share payload validation](../../studio/src/shareable-state.mjs)

## Maintenance

Update the source and regenerate both exports when a represented boundary or
workflow changes. These are static implementation explanations, not evidence
of educational effectiveness, adoption, or a new runtime verification result.
