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
