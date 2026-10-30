## 0.1.179 — 2026-10-30

Pair both packs with Tavern 0.6.193 for its guide and extension startup fixes. World Liquor gameplay and translated content remain unchanged. Full-family native and client acceptance remain separate.

## 0.1.178 — 2026-10-30

Pair both packs with Tavern 0.6.192, which avoids repeated transmission of unchanged guide chapters. World Liquor gameplay and translations are retained. Family deployment and client evidence remain separate.

## 0.1.177

- Pair both packs with Tavern 0.6.191 for the T191 family catalog dependency.
- No World Liquor gameplay or translation changes.
- BDS, saved-world migration, deployment, and client acceptance remain unverified for this candidate.

## 0.1.176 — 2026-10-29

Restore English, Simplified Chinese and Traditional Chinese tooltip names for the guaranteed Crazy, Explosion, Respawn and Level Boost cocktail effects. Preserve the author's original names, including flavor text. The existing mixology check now exercises the actual shared Tavern tooltip and verifies every emitted World Liquor effect key in all three locales. No effect mechanics, recipes, item identities or dependencies change; full-family deployment and rendered-client acceptance remain pending.

## 0.1.175

Dependency-only pairing with Tavern 0.6.190; gameplay unchanged from 0.1.174.

## 0.1.174 — 2026-10-29

Treasure Guide mob drops follow Java `onLivingDrops`: the damage source's owner (the shooter, not the arrow) with the effect rolls once per death against 0.15 + 0.05 × amplifier, and on success every entry of the native `entityItemDrop` list is copied at that item's position from a snapshot of the list. This replaces the one-tick nearby-item scan that could duplicate unrelated drops or thrown items. No other gameplay, recipes, resources or identities change.

## 0.1.173 — 2026-10-29

Beheading follows Java `EventHandlers.onLivingIncomingDamage` / `onLivingDropsBeheading` more closely: the beheaded marker is a persistent entity property instead of a per-session map, a blocked kill falls back to set-1 / hurt-2 / set-0 with the attacker attributed and re-entry suppressed, the head is deduplicated against the native death-drop list (an entity without drops gets it two ticks later), and a player head carries its owner as name and lore. The hit itself is unchanged (attacker-attributed 10000 on the direct hit, bosses tag, chance 0.04 + 0.03 × amplifier). No other gameplay, recipes, resources or identities change.

## 0.1.172 — 2026-10-29

Pudding remainder follows Java `CompatFoodItem.finishUsingItem`: after the effects and the native debit, an emptied used slot receives the new bowl in hand, while remaining servings or Creative spawn one bowl at the player instead of inserting it into the inventory. The branch is read from the used slot one tick after completion, so it does not depend on the native debit/callback order; a slot the player changed in that tick goes through Java `Inventory.add`. No other gameplay, recipes, resources or identities change. Native debit order and real-player acceptance remain open.

## 0.1.170 — 2026-10-28

Complete the current Java content adoption with native waterlogged-eye detection. Preserve the frozen W169 identity as an unpublished predecessor; all adopted lamps, cabinets, Luck+ and current effects carry forward. See [the final release scope](docs/RELEASE-NOTES-0.1.170.md).

## 0.1.169 — 2026-10-28

Adopt NeoForge1.1.12 / Forge1.1.13 pendant lamps, dye recipes, cabinet models/textures, Dassai custom Luck+, Explosion power, underwater CaptainGift exclusion and air-jump velocity. Luck currently rerolls emitted native mob-death loot, adding only previously absent types and preserving full ItemStack metadata; mining/chest/fishing/global Java context and TreasureSense outlines remain open. Requires BDS1.26.60, server2.12.0-beta and Beta APIs experiment. Actual native drops pass in isolated QA; full-family admission and human rendering/audio/gameplay acceptance remain separate.

## 0.1.168 — 2026-10-27

Replace the finite 32-alias jukebox audio bank and global stop commands with individual engine SoundInstance handles. Preserve original audio, legacy/current saved discs and wall-record ownership; expire playback against the selected Java song duration. Declare Script API 2.10.0 and retain canonical T187/G181 pairing. An isolated BDS 1.26.52.3 first load/restart verifies 40 handles and three saved-disc rows. Native custom records still fail the tested engine's parser with Beta APIs and remain a separate reproducible diagnostic. Full native redstone/hopper semantics, actual client sound and complete-family admission remain open. See [the release scope](docs/RELEASE-NOTES-0.1.168.md).

## 0.1.167 — 2026-10-27

Adopt the Maotai effect table shared by NeoForge1.1.12 CF9217896 and Forge1.1.13 CF9217901 for direct drinks and signature cocktails. All other current source repairs and save identities remain intact. New pendant lamps, custom Luck/global loot, changed cabinet assets and remaining branch changes are reviewed but not implemented in this scoped release.

## 0.1.166

Dependency-only pairing with Tavern 0.6.186. Advance World Liquor's paired BP/RP identity, guide payload version and exact Tavern dependencies; preserve all other gameplay, recipes, resources and creative membership. Existing W165 evidence is not transferred to this candidate. Canonical CI and complete-family initialization, saved-world and rendered-client acceptance remain pending.

# Change history

## 0.1.165

Skip native personal-spawn queries for players without confirmed World Liquor respawn metadata. Confirmed records keep their one-tick check, late declarations become active immediately, and a changed native point still retires stale metadata before that point can be reused. A direct four-player, twenty-callback comparison of the real old/new modules records 80→0 native queries without records and 80→20 with one record. This measures source API work only; CPU, TPS, FPS and rendered-client improvement remain unmeasured. The P70 complete-family update subsequently passed static admission, consistent stopped-world backup, first load/restart of the same saved-world copy, installation and exact readback; see the [dated deployment observation](docs/evidence/family-w165-deployment-20261027.json). Its sample had no custom container inventory or native freezer input container and does not establish container UI, arbitrary ItemStack or human acceptance. Startup warnings remain. W165 was subsequently published through the [verified manual workflow](https://github.com/burnt-tea-dev/kaleidoscope-world-liquor-unofficial/actions/runs/40451637457); the [current download](README.md#current-maintained-source) contains only owned BP/RP and does not include separate private family author repairs.

## 0.1.164

Restore the original freezer renderer's position/slot-seeded ingredient placement, independent yaw and dry/wet ordinary-item heights for the existing snowball, blue-dye and slime-ball sprites. Preserve sparse native slot identity, authoritative item storage, result/fluid surfaces and no-repeat movement refresh. Retire this display owner's historical source projections; current behavior is checked against recorded execution of the original Java method. Generic full-stack rendering, block-item models, absolute UV orientation and rendered-client acceptance remain open. Pair with canonical Tavern 0.6.185 and Grilling 2.8.157.

## 0.1.163

Pair both packs with Tavern 0.6.185 after its Java Mead success-feedback correction. Only paired release/module/dependency and generated guide payload version identities change; World Liquor gameplay, recipes, effects, resources, UUIDs and saved data retain W161/W162 bytes. The W162 source and release-history entry remain preserved. Grilling 2.8.157 is the target optional source-check peer. Final canonical peer pins, complete-family fresh-world first-load/restart and client acceptance remain pending.

## 0.1.162

Pair both packs with Tavern 0.6.184 for the fresh-world family source, with Grilling 2.8.157 as the target optional source-check peer. Only paired release/module/dependency and generated guide payload version identities change; all World Liquor gameplay, recipes, effects, resources, UUIDs and saved data retain W161 bytes. The runtime anchor was frozen before Tavern's canonical merge to avoid a source-pin cycle. The metadata follow-up now pins canonical T184 `79ac1fb82e06ddd07993cf7b9140dfbf1cfd09fc` and G157 `2e3ef63839e38f84b4a0109957077ac00a140697`, preserving the frozen W162 runtime, baseline, release history and archive digest. Current canonical CI, complete-family fresh-world first-load/restart, saved-world admission and client acceptance remain pending. The later W163/T185 source branch is separate and is not promoted by this pairing.

## 0.1.161

Pair both packs with Tavern 0.6.183 for consolidated placed-bottle facing and owner reads. Only release/module/dependency and guide payload version identities change in World Liquor; recipes, effects, resources, UUIDs and saved data retain W160 behavior. Grilling 2.8.155 remains the optional source-check peer with its reviewed current canonical tools. Complete-family saved-world gates and rendered-client acceptance remain separate and pending.

## 0.1.160

Pair both packs with Tavern 0.6.182 for its shared guide settings navigation and active-language labels. Only release/module/dependency and guide payload version identities change in World Liquor; recipes, effects, resources, UUIDs and saved data retain W159 behavior. Grilling 2.8.155 remains the optional source-check peer. Complete-family saved-world gates and rendered-client acceptance remain separate and pending.

## 0.1.159

Bound foundation retries after NACK/timeouts, replace queued snapshots with current data, deduplicate acknowledged background snapshots and recover the original native owner when it loads. Retain native inventory authority and clear legacy data only after its exact successful ACK. Pair both packs with frozen Tavern 0.6.181; full-family saved-world, LIVE performance and client acceptance remain pending.

## 0.1.158

Pair both packs with Tavern 0.6.180 for its shared potion-bottle liquid tint repair. Retain W157 gameplay, resources, storage identities and the optional Grilling 2.8.155 source-check peer. Only release, module, dependency and guide payload version identities change; complete-family and client acceptance remain pending.

## 0.1.157

Bind deferred furniture interactions to the accepted hand and block context, and move observable potion identity into the shared captured-item comparison used by furniture, freezer storage and drink callbacks. Restore the exact official Minecraft 1.21.1 blue-dye sprite. The affected furniture, captured-item and sprite domains now use current behavior and Java resource contracts; their superseded inverse-source projections are retired. Pair with Tavern 0.6.179 and retain optional Grilling 2.8.155 source checks. Pack/module UUIDs and saved data keys remain unchanged. See [validation, preserved candidate history and limits](docs/PARITY-MATRIX.md) and the [remaining freezer visual plan](docs/audit/FREEZER-VISUAL-REVIEW-20261024.md).

## 0.1.156

Superseded unmerged pairing candidate: preserve W155 functional runtime and change only package/module/dependency and payload identities for Tavern 0.6.179. Its immutable claim and release-history record remain unchanged. W157 consolidates the shared captured-item implementation and affected validation domains; see [current scope](docs/PARITY-MATRIX.md).

## 0.1.155

Superseded unmerged candidate: add deferred furniture continuity guards and correct the freezer blue-dye sprite, paired with Tavern 0.6.178. All four World Liquor source CI jobs passed, but the T178 companion failed effect-track retirement, so the pair was not merged. T179 corrects empty-effect track re-creation. The original claims, history and results retain their scope; see [current validation and limits](docs/PARITY-MATRIX.md).

## 0.1.153

Pair both packs with Tavern0.6.176 and optional Grilling2.8.154 source checks. Change only package/module/dependency and payload-version identities from W152, preserving the W151 gameplay, collision and freezer material repairs. Exact successor peer commits, freeze, canonical CI and publication remain pending. New Java Forge1.20.1 file9217901, NeoForge1.21.1 file9217896 and separate26.1.2 file9087098 remain adaptation pending; this pairing does not change their recipes or effects. Native/saved-world checks and human-client acceptance require their own results. See [scope](docs/RELEASE-NOTES-0.1.153.md).

## 0.1.152

Pair both packs exactly with Tavern 0.6.175 and update their release/module identities plus the payload version. Preserve all functional W151 payload data and every other non-manifest runtime byte. The optional source-check peer is Grilling 2.8.153; final canonical T175/G153 commit pins are recorded in a metadata-only follow-up. The frozen runtime/archive is unchanged. Local exact-peer checks and canonical CI remain distinct from publication readiness. W151 and earlier release histories remain unchanged. Complete-family native/saved-world gates and human client acceptance remain separate and pending. See [pairing scope](docs/RELEASE-NOTES-0.1.152.md).

## 0.1.148

Pair with Tavern 0.6.170 using exact BP/RP dependencies and synchronized release/guide versions. Preserve World Liquor pack/module UUIDs and all gameplay, recipes, storage and presentation. The optional Grilling 2.8.144 source-check peer is unchanged. No Elbow or Treasure gameplay repair is included. Full family and client acceptance remain pending.

## 0.1.147

Move the existing animated freezer material definitions to the standard `materials/entity.material` entry and verify every World Liquor entity/render-controller material alias against its registry and builtin parent. Preserve texture pixels, alpha, UV animation, recipes and storage; pair with Tavern 0.6.169 and retain the optional Grilling 2.8.144 source-check peer. [Source evidence](docs/evidence/freezer-material-registry-20261015.md) records the client failure and source checks; actual restored client rendering remains pending.

## 0.1.146

Visit fresh effect recipients instead of polling all players each tick, avoid velocity reads for passive effects, and skip unchanged freezer-display teleports while preserving repair and result-height updates. Snapshot revocation/expiry, per-tick gameplay, saved progress and item ownership remain intact. Pair with Tavern 0.6.168 and Grilling 2.8.144; see the [focused evidence](docs/evidence/performance-20261015.md). Actual client latency/FPS acceptance remains pending.

## 0.1.144

Pair with Tavern 0.6.166 and Grilling 2.8.142 for ignored-state HUD pruning and bounded shaker preview caching. World Liquor changes only release and paired dependency identities; gameplay, saved ownership and assets remain unchanged. Client latency and performance acceptance remain pending.

## 0.1.143

Pair with Tavern 0.6.165 and Grilling 2.8.141 for source-backed Java shaker coordinates and remaining-use eating HUD synchronization. Only package, module, payload identity and paired dependencies change here. Existing gameplay, saved ownership and assets remain unchanged; rendered-client acceptance remains pending.

## 0.1.142

Pair both packs with Tavern 0.6.164 and Grilling 2.8.140 for the formal family HUD layout, touch and native-token-filter repair. World Liquor gameplay, saved ownership and assets are preserved. Existing beta publication remains supported; this release uses the exact version tag and baseline1 artifacts. Client rendering and full Java parity remain unverified.

## 0.1.131

Filter unrelated script events before foundation payload byte counting/parsing, and mirror the allocation-reduced UTF-8 counter from Tavern. Supported channel validation, transport packets, scheduling and W gameplay remain unchanged; pair with Tavern T154 and Grilling G132. See [release scope](docs/RELEASE-NOTES-0.1.131.md). Native watchdog and human acceptance require this candidate’s own evidence.

## 0.1.126

Prepare complete registration packets in bounded startup batches before BEGIN; preserve protocol bytes, recipes, timing, assets and storage semantics. Pair with Tavern T149 and Grilling G130. See [release scope](docs/RELEASE-NOTES-0.1.126.md). Native performance and human acceptance remain separately tracked.

## 0.1.124

Draft-only exact pairing with Tavern T147 (HUD200). Preserve all W123 gameplay, guide data, recipes and assets; update only package, module, dependency and payload identities with an append-only freeze. See [candidate scope](docs/RELEASE-NOTES-0.1.124.md).

## 0.1.122

Pair both packs with Tavern T145 and keep the current G125 integration peer. Preserve all W121 gameplay, guide data and assets; see [release scope](docs/RELEASE-NOTES-0.1.122.md).

## 0.1.121

Pair both packs with Tavern T144 and pin the current G125 integration peer. Preserve all W120 gameplay, guide data and assets; see [release scope](docs/RELEASE-NOTES-0.1.121.md).

## 0.1.120

Fix direct LivingEntity admission for beheading and elbow feedback while preserving ground-crit filters, all W119 gameplay data and shared guide content. Consolidate current gap and verification indexes; complete beheading phases/head ownership and other native gaps remain open. See [source scope](docs/RELEASE-NOTES-0.1.120.md).

## 0.1.119

保留 canonical W118 魚類 LivingEntity 效果入口、確認重生錨與全部指南，只同步身份及 Tavern T142 相依。 見[本版說明](docs/RELEASE-NOTES-0.1.119.md)。

## 0.1.118

承接已發布 W117 `0ebf77ed7d302f453e75d9c56cc603e709ed226d` 的 67 個三語指南條目與配套四個 AMW 頁面修正，配對 T141／G122。以 84 類 LivingEntity gate 補回魚類效果與 accepted hurt 歸屬；保留來源／API 26 案例與交叉審查 8 案例的原證據。舊 trial 原生 21／22 不改名，新配對原生首次 21／重啟 22 與嚴格 recorder 已通過；見 [本版說明](docs/RELEASE-NOTES-0.1.118.md)。

## 0.1.117

保留 W116 全部 67 個三語指南條目、配方、作者資源及已確認重生錨修補，只同步新身份與 Tavern T140 相依。T140 補齊完整安裝家族四頁指南；公開配對仍為 223 條目。見 [本版說明](docs/RELEASE-NOTES-0.1.117.md)。

## 0.1.116

保留已發布主線 67 個三語指南條目，整合確認下界重生錨修補，配對 Tavern T139／Grilling G122；保存舊 trial 與已發布 W113 的各自來源及歷史。 見 [本版說明](docs/RELEASE-NOTES-0.1.116.md)。

## 0.1.113

Rewrite all 67 product and furniture guide entries with brief uses, complete preparation data and accurate platform limits. Pair with Tavern 0.6.136 while retaining W112 gameplay, data, assets and saved identities; see [release scope](docs/RELEASE-NOTES-0.1.113.md).
## 0.1.115

- Pair exactly with Tavern T138 while preserving the confirmed-anchor implementation and all current author data, assets and gameplay.
- Retain prior and parallel source histories; current native/CI/client/private LIVE scopes remain distinct.

## 0.1.114

- 保留 W113 全部重生錨／作者適配，僅同步 identity 與 Tavern 0.6.137 宿主相依。
- [本版驗證與限制](docs/RELEASE-NOTES-0.1.114.md)。


## 0.1.113

- 確認原生下界重生錨的新出生點 metadata，保留 repeat／取消／重生／離線邊界，配對 T136 與已審查 G120 helper。
- 詳細範圍及驗收限制見 [本版說明](docs/RELEASE-NOTES-0.1.113.md)。

## 0.1.112

Update the exact Tavern dependency to 0.6.135 with a fresh package identity. All W111 World Liquor gameplay, data and artwork remain unchanged, and W111/W110 histories are preserved. The reviewed T135 peer is pinned; new paired CI and native/client acceptance remain pending; see [release scope](docs/RELEASE-NOTES-0.1.112.md).

## 0.1.111

Pair both packs with Tavern 0.6.134 while preserving the current-author Dassai correction, four cocktail models and source-art checks from W110. The reviewed T134 source is pinned; final paired CI and native/client acceptance remain pending; see [release scope](docs/RELEASE-NOTES-0.1.111.md).

## 0.1.110

Restore current-author Dassai Q3–Q6 Luck amplifiers1/3/5/7 and four coupled cocktail models/atlases plus two authored inventory sprites. Retain reviewed T132/G119 pairing and original W109 histories; see [release scope](docs/RELEASE-NOTES-0.1.110.md).

## 0.1.109

Pair both packs with Tavern 0.6.132 for its shared splash dispatch, shaker input/rollback, living-recipient and presentation repairs. World Liquor gameplay, recipes and guide data retain their existing content; [release scope](docs/RELEASE-NOTES-0.1.109.md) separates exact pairing from native/client/live acceptance.

## 0.1.108 candidate

Prepare both packs for Tavern 0.6.131 and recognize Grilling 2.8.118's two additional zero-collision displays in shared Respawn checks. Unknown helpers remain rejected. Release freeze and native/client/live verification are pending; see [candidate scope](docs/RELEASE-NOTES-0.1.108.md).

## 0.1.107

Pair both packs with Tavern 0.6.130 for its native-label routing and storage-display maintenance repairs. World Liquor gameplay and the shared seven-section guide data remain unchanged; see [release scope](docs/RELEASE-NOTES-0.1.107.md).

## 0.1.106

Pair both packs with Tavern 0.6.129 for its cocktail interaction, placed shaker preservation, presentation and supported-effect repairs. World Liquor recipes and the shared guide projection remain on the existing API; see [release scope](docs/RELEASE-NOTES-0.1.106.md).

The maintained version is declared in [baseline.json](baseline.json). Append-only package identities are recorded in [release-history.json](release-history.json); source changes and their scoped verification are in the matching `docs/RELEASE-NOTES-<version>.md` and [GitHub Releases](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/releases).

The mixed historical installation, build and regression descriptions formerly on the homepage are preserved in [the archived README](docs/archive/README-before-current-build-20261008.md). Its 0.1.16/0.1.37, Tavern 0.6.53 and Cookery 1.0.6 instructions are historical, not the current package contract.
