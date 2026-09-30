# Project requirements

- Guide content must use the Tavern host's fixed seven-entrance guide contract (`docs/GUIDE-STANDARD.md` in the Tavern repository). Do not add a parallel guide UI or flatten the host categories.
- Provide product data, localized instructions and actual preparation recipes to the existing Tavern API. Equipment explains use; product entries own preparation recipes.
- Keep the core-first brewing/cocktail groups and dedicated furniture/storage subgroups. Run the paired guide contract check before release.
- Original Java mechanics are authoritative. Do not use simulated players or report static/BDS tests as client acceptance.

# Canonical baseline

- Follow `docs/BASELINE-MAINTENANCE.md`. Own fixes belong to canonical runtime; do not introduce gameplay transforms in a private builder or BSM hook.
- A changed exported file requires a new release identity, lock/history update and functional verification. Never reuse the same version for different content.
- Production deployment requires the family receipt, pinned upstream archives, client acceptance and explicit saved-world migration verification.
