# World Liquor 0.1.170

Adopt NeoForge1.1.12 / Forge1.1.13 pendant lamps, dye recipes, cabinet models/textures, Dassai custom Luck+, Explosion power, underwater CaptainGift exclusion and air-jump velocity. Luck currently rerolls emitted native mob-death loot, adding only previously absent types and preserving full ItemStack metadata; mining/chest/fishing/global Java context and TreasureSense outlines remain open. Requires BDS1.26.60, server2.12.0-beta and Beta APIs experiment. Actual native drops pass in isolated QA; full-family admission and human rendering/audio/gameplay acceptance remain separate.

The source review owns exact adopted domains and remaining gaps: [current review](../data/current-author-review-20261028.json). [Isolated native evidence](evidence/current-java-content-20261028.json) records actual native drops and lore, including 10 deaths, 20 original/bonus stacks and an unchanged unrelated seven-item stack. Chance gates were forced in QA; native loot draws stayed random.

The native QA source is [luck-loot-probe.js](../tests/native/luck-loot-probe.js), with its entity and loot fixtures beside it. Stage the production luck-loot.js and combat-source.js beside that script in an isolated experimental BP on BDS1.26.60.6; use a clean flat world and enable Beta APIs. Never run this probe on a survival save.

Client acceptance and production readiness remain pending.

Submerged-eye detection includes the native waterlogged flag, including water above the queried surface. Existing underwater/crouch/sneak behavior remains source scoped.
