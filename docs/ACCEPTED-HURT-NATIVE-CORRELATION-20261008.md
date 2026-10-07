# Same-tick accepted-hurt correlation observation

Seven real Native mob scenes on BDS 1.26.51.1 / stable Server API 2.7.0 did not reproduce the suspected orphan-before-event correlation bug. The production adapter is unchanged. This is evidence about callback correlation, not a completed Elbow Strike implementation or Java/client parity.

For `entityAttack` requests 4/4/8, 6/6/12 and 4/8/8/12, and `magic` requests 4/4/8, the cooldown-rejected repeat returns `true` from `applyDamage` but emits neither the observed before-hurt nor after-hurt event. The stronger request emits only its incremental damage: 8 after 4 reports 4. Callback delivery consequently belongs to the first and stronger requests, without an orphan row for the rejected repeat. The absorption scene likewise correlates the first and stronger request; it does not establish source-equivalent absorption timing or amounts.

`override` requests bypass this cooldown in both observed sequences: all requests emit events and receive their own callback. Before and after objects differ. Even repeated reads of a before event's `damageSource` produce different wrappers, so object identity is not a valid shared correlation key.

The observers ran in two disposable worlds with no players. Their base family was Tavern 0.6.121 / Grilling 2.8.101 / World Liquor 0.1.88 / private integration 1.0.20. A test-only observer copied the current canonical accepted-feedback adapter from commit `2d33dc944c4ff2eb5093e51ac0cd70c25c4edf17`; this must not be described as a full-family test of today's live 0.6.122 / 0.1.89 candidate. Sanitized public traces preserve the exact event order, health reads and callback results. Raw engine/world evidence remains outside the repository.

`tests/accepted-hurt-native-trace.test.mjs` replays those observed event sequences through that exact production adapter. CI replay is a regression check against previously observed Native facts; it is not a fresh Native run. Existing cancellation and source-identity regressions remain separate.

No exported runtime changes, version bump or live restart are required. Actual Player attacks, custom addon cancellation/reentry, arbitrary damage modifiers, exact audio/particle rendering and the complete Elbow Strike attribute/charge/velocity lifecycle remain unresolved.
