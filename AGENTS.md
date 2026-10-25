# DSA Dojo Agent Guide

## Scope And Invariants

DSA Dojo is a framework-free JavaScript learning product and static site.
Read `README.md` and the affected implementation before changing behavior.
Preserve pure algorithms, deterministic reversible traces, validated lesson
contracts, and the separation between domain state, projection, and browser
effects. `studio/src/curriculum-manifest.mjs` owns the curriculum catalog;
derive lesson counts and capability claims from executable sources.

Preserve keyboard and focus behavior, screen-reader announcements, reduced
motion, responsive containment, and device-local progress. Shareable states
must remain bounded and validated and must not expose private progress or
challenge answers. Keep Pip as the product identity; MC identifies authorship.
Distinguish live-product artwork and links from source-repository variants.

## Documentation And Verification

Use `docs/studio-architecture.md` for boundaries, `docs/curriculum-roadmap.md`
for lessons, `docs/product-vision.md` for product intent, and
`docs/portfolio-case-study.md` for qualified engineering evidence. Visual rules
live in `docs/visual-system.md`; diagrams and sources live in `docs/diagrams/`.
Update the canonical owner when behavior changes; do not invent measured
learning outcomes or rewrite unrelated documentation.

Use the declared runtime in `.node-version` and `package.json`. Run from root:

```bash
npm run check:release
npm run coverage
```

`check:release` checks syntax, unit tests, static build, browser behavior, and
accessibility. Install Chromium with `npx playwright install chromium` on a new
machine. CI also audits dependencies and checks the supported Node matrix.
Do not weaken coverage or accessibility gates to accommodate a regression.
Pages deployment follows browser-gated `main` verification in
`.github/workflows/ci.yml`; PR success alone is not deployment evidence.

## Delegation

Use subagents for independent, bounded work when doing so would materially
improve speed or quality. Keep small or tightly dependent tasks in the main
agent. Use clear file ownership, avoid duplicate work, and have the main agent
integrate and verify the results. Follow the project's usage budget and
stopping rules. Start with at most two helpers; avoid recursive delegation.

Give each helper a question, scope, evidence requirement, and stopping condition.
Parallel writers need disjoint files or isolated worktrees. The parent owns
integration, verification, and publication; do not concurrently switch branches.

## Completion And Publication

For implementation tasks, verify the intended change, commit only its files,
push, and open a ready pull request. Merge after required checks pass, verify
the actual merge SHA's main CI and applicable Pages deployment, and check the
affected live routes or artifacts. Synchronize local `main` and delete the
completed task's local and remote branches after confirming its merged PR and
head. Preserve unrelated work and active branches; never bypass required checks.
Use configured `GH_TOKEN` first and never print or persist its value.

Read-only reviews, planning, and explicit local-only or draft-only requests
retain their requested scope. LinkedIn, Goodreads, Drive, and other social
updates require user intent for that destination. Report passed, failed,
skipped, or blocked checks and the exact remaining obstacle.
