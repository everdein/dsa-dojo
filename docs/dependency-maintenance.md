# Dependency and runtime maintenance

Checked against the npm registry and official release metadata on October 24, 2026.

Use Node.js **24.22.1 LTS** (selected by `.node-version`) with its bundled npm 11.19.1. Node 26.12.1 is also supported. CI reads the version file; algorithm projects additionally verify Node 26.12.1. These are patched releases; older 24.x/26.x versions are outside the declared engine range.

## Declared dependency baseline

| Package              | Version |
| -------------------- | ------- |
| @axe-core/playwright | 4.14.0  |
| @playwright/test     | 1.64.1  |

Dependencies, where present, are on the latest stable published versions. Use npm audit and the complete project checks after each lockfile update.

## Update procedure

Check current stable releases and peer/runtime requirements, update manifests and lockfiles together, run a clean install, audit dependencies, and run the project verification gate plus applicable browser checks. Keep historical ADRs unchanged and update current requirements when the runtime baseline changes. Record any intentional version constraint here rather than reporting an incompatible major as installed.

DSA additionally supports Node 22.23.4 (maintenance LTS). Its existing protected checks retain the stable names Node 22.x and Node 24.x; they execute the exact patched versions, while the added Node 26.x job covers 26.12.1. Branch-protection rules are unchanged.

## GitHub Action pins

The CI workflow pins GitHub-owned Actions to full commit SHAs with release
comments. On October 25, 2026, 21:13:47–53 UTC, each official major tag matched
its stable release tag and the following commit. The API reported commit
objects for all observed tags; no annotated-tag object was mistaken for a
commit. No Action major, job, runtime matrix, trigger or permission changed.

| Official Action | Selected release | Commit SHA |
| --- | --- | --- |
| actions/checkout | [v7.0.1](https://github.com/actions/checkout/releases/tag/v7.0.1) | `3d3c42e5aac5ba805825da76410c181273ba90b1` |
| actions/setup-node | [v7.1.0](https://github.com/actions/setup-node/releases/tag/v7.1.0) | `949feb2413d6458794dcd2491c4babbbce0c15c1` |
| actions/configure-pages | [v6.0.0](https://github.com/actions/configure-pages/releases/tag/v6.0.0) | `45bfe0192ca1faeb007ade9deae92b16b8254a0d` |
| actions/upload-pages-artifact | [v5.0.0](https://github.com/actions/upload-pages-artifact/releases/tag/v5.0.0) | `fc324d3547104276b827a68afc52ff2a11cc49c9` |
| actions/deploy-pages | [v5.0.1](https://github.com/actions/deploy-pages/releases/tag/v5.0.1) | `368f82528645a54fb793d4d04e342629a3f51346` |

For updates, use the official Action repository's release and Git ref APIs.
Resolve a tag object through its referenced object until it identifies a
commit; verify the release tag and selected major point to the reviewed commit.
Keep the release comment accurate and update every repeated use consistently.
Do not select a different major merely to obtain a pin. Existing weekly
GitHub Actions Dependabot discovery remains enabled and can propose pin
updates; a proposal still needs the repository's required verification.

After a pin change, parse the workflow and confirm that non-reference fields
are unchanged unless deliberately in scope. Run the local release and coverage
gates, then verify the exact PR head, merged main and browser-gated Pages
release. Provider protection or Node 26 required-context changes are separate
scope; pinning must not silently change those settings or the deployment chain.
