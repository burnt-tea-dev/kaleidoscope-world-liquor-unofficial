# Project requirements

- Guide content must use the Tavern host's fixed seven-entrance guide contract (`docs/GUIDE-STANDARD.md` in the Tavern repository). Do not add a parallel guide UI or flatten the host categories.
- Provide product data, localized instructions and actual preparation recipes to the existing Tavern API. Equipment explains use; product entries own preparation recipes.
- Keep the core-first brewing/cocktail groups and dedicated furniture/storage subgroups. Run the paired guide contract check before release.
- Original Java mechanics are authoritative. Do not use simulated players or report static/BDS tests as client acceptance.

# Canonical baseline

- Follow `docs/BASELINE-MAINTENANCE.md`. Own fixes belong to canonical runtime; do not introduce gameplay transforms in a private builder or BSM hook.
- A changed exported file requires a new release identity, lock/history update and functional verification. Never reuse the same version for different content.
- The owner’s 2026-10-03 instruction is standing authorization to update managed-server live after every completed functional repair/development candidate, including the current candidate. Finish canonical PR/checks/merge, full-family static/BDS checks and saved-world rehearsal, then back up, normally stop/restart and deploy the exact candidate for the owner to test. Do not wait for pre-deployment human client acceptance or request the same deployment permission again. Documentation-only changes that do not change exported runtime need no pack bump or live restart.
- Use canonical family_bundle/family_guard and a consistent stopped-world backup with a rollback version. Register this standing instruction, its time and each candidate’s exact receipt SHA256 in deferred_client_acceptance; never reuse a different receipt hash or bypass admission. Keep client=false, production_ready=false and pending_client_acceptance until actual human acceptance. See the family maintenance procedure; deployment is not rendered-client verification.
