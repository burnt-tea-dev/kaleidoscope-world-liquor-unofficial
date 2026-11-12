# Baseline maintenance

Use the [pstack agent workflow](https://github.com/burnt-tea-dev/kaleidoscope-tavern-unofficial/blob/5bc82d3d60e1837306eeb3f0ae4da64c7df4b392/family/UPDATE-WORKFLOW.md#pstack-代理入口) for development. The steps below apply when preparing a runtime release.

1. Implement gameplay, rendering, guide and native/API fixes in canonical runtime. Prefer the simplest suitable documented capability, including experimental APIs; declare and verify its engine/experiment requirements. Do not patch them during packaging or installation.
2. Bump the release version whenever any exported file changes. Update paired manifests, module versions, guide/payload version and dependencies together.
3. Update `baseline.json` dependencies from verified upstream file metadata. Never infer UUIDs from a version label.
4. Reuse valid results and run the affected functional regressions. Stage reviewed source files, then run `python tools/baseline_gate.py freeze`. An existing version cannot be assigned new content.
5. Review and commit the lock/history. `python tools/baseline_gate.py check --release` and the real packager must pass from a clean commit.
6. Build a family candidate with pinned upstream archives and order. Reuse valid source CI; pass targeted BDS behavior and the same saved-world copy's first-load/restart. The owner authorizes complete-family deployment after those checks and canonical PR/merge. Human/client acceptance is optional; report unverified visuals/audio honestly.
7. Back up the consistently stopped world, retain the latest complete rollback, pass canonical family_guard, deploy the exact tested complete family, then compare installed files with its receipt. Do not register deferred client acceptance or make human testing a completion prerequisite. No repeated deployment permission; no LIVE restart for documentation-only changes. Subsequent drift fails closed.
8. Third-party defects require a clean latest-version reproduction and an author feedback record. Temporary fixes need reviewed hashes and a removal condition. Translation must not hide runtime replacements.

Historical artifacts and branches are evidence, not release input. A PR being closed or merged does not prove its content survives in the resulting tree. Reconcile by behaviour and verify the resulting source/export.

Family operations and integration tooling: `burnt-tea-dev/kaleidoscope-tavern-unofficial/family/MAINTENANCE.md`.

Release freeze now claims the version and exact runtime trees in Git’s shared common directory before changing locks. All local worktrees and known remote-tracking histories are checked for collisions. A conflicting or incomplete claim must be preserved for review; choose a new release version instead of deleting or rewriting it. This coordination guard does not replace PR checks or fresh family deployment evidence.

Latest Java author releases per maintained branch drive adaptation. Repairs must reach canonical remote Git before deployment; shared adapters and data migrations follow the current author package. Reuse unchanged validated evidence and retain integrity checks at source/release and deployment state boundaries. Version/hash equality does not prove complete Java parity.

The reviewed 2026-10-19 transfer keeps the repository numeric ID and all runtime release identities. `.repo-target.json` pins the current organization, owner ID and public visibility; baseline CI verifies its Actions repository/event identity. `baseline.json`, release-history and source receipts retain their original logical repository name so unchanged runtime is not relabeled.
