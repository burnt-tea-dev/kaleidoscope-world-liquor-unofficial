# World Liquor Java／Bedrock 差距矩陣

## W162／T184 canonical source pairing (2026-10-26)

The existing W162 runtime anchor `5f64020d098f99e2da67d241a09991dccbab9bbb` now targets the real canonical Tavern T184 merge `79ac1fb82e06ddd07993cf7b9140dfbf1cfd09fc` (PR428) and optional Grilling G157 `2e3ef63839e38f84b4a0109957077ac00a140697` (PR283). Both World Liquor packs already require Tavern 0.6.184. The former T183/G155 checkout placeholders have been replaced and `peer_pins_final=true`; current canonical paired CI remains required.

The existing paired release checks pass against those exact sources, including 223 guide entries, 31 categories, 216 transport packets, 48 storage poses and 4,992 vertex comparisons. The independent helper-definition check confirms 56 Tavern, 21 World Liquor and 10 Grilling zero-collision helpers. These are source/resource checks; they do not add native, saved-world or rendered-client acceptance. The first local attempt lacked the canonical historical collision commit in a shallow checkout; fetching the preserved public history resolved that missing-input failure without changing the checks or runtime.

This follow-up changes source-check/release metadata and current prose only. Frozen W162 runtime, baseline, append-only release history and archive SHA-256 `383193fd99676d29e506880ff76aeadef3d81501d01a4d4c882d21a4ba661c62` remain unchanged. W162 retains W161 gameplay, recipes, effects, resources, UUIDs and saved data apart from the existing paired release/module/dependency and payload-version identities. The later W163/T185 source branch remains separate. Complete-family native/fresh-world first-load/restart, saved-world migration and rendered-client acceptance remain pending; `publication_request=false`, `bds=false`, `client=false`, `production_ready=false`. Existing Java gameplay and freezer-rendering gaps below remain open.

## W161／T183 bottle display companion (2026-10-25)

W161 pairs both packs with canonical Tavern 0.6.183 source `afae50c054487d131829bacaedd4e0ea749a26c0` (merged PR425) for consolidated placed-bottle facing and owner reads. World Liquor changes only paired release/module/dependency and generated payload version identities; recipes, effects, resources, UUIDs and saved data retain W160 behavior. The optional G155 source-check peer uses its current reviewed canonical tools with unchanged runtime. Source guide/dependency checks, complete-family native/saved-world admission and rendered-client acceptance remain separate; `publication_request=false`, `bds=false`, `client=false`, `production_ready=false`. Existing Java gameplay and freezer-rendering gaps below remain open.

The existing paired guide check passes against the exact T183 source: 223 combined entries, 31 categories and 216 transport packets, including all 67 World Liquor pages. A direct W160 comparison confirms that only the two manifests and generated payload version differ within runtime; the complete prior release history is unchanged. Canonical CI and complete-family gates remain pending.

## W160／T182 guide settings companion (2026-10-25)

W160 pairs both packs with Tavern 0.6.182 for the shared guide's settings navigation and active-language labels. World Liquor changes only release/module/dependency and generated guide payload version identities. All recipes, effects, resources, pack/module UUIDs and saved data keys retain W159 behavior. Existing Java gameplay and freezer-rendering gaps below remain open. Source guide/dependency checks do not establish complete-family native/saved-world admission or rendered-client acceptance; `publication_request=false`, `client=false`, `production_ready=false`.

The paired guide contract passes against frozen T182 source `6040fad3794b227a18cabb9a8d8599a2424e0827`: 223 combined entries, 31 categories and 216 transport packets, including all 67 World Liquor pages. A direct W159 comparison confirms that only the two manifests and the generated payload version differ within runtime; all other exported bytes and the payload's recipe/content/guide data are unchanged. Canonical CI and complete-family gates remain pending.

## W159／T181 foundation 穩定性來源（2026-10-25）

同步 Tavern 唯一 SDK owner 的失敗快照退避、最新 payload 合併、成功 ACK 背景去重與 loaded-owner／entity-load 恢復。相同 NACK 不再立即重排；變更 raw、正常酒櫃及主體明確刷新仍有效。舊資料僅在相符成功 ACK 後清理，原生庫存仍是物品權威。搭配主體當前原生 store 的來源／API 測試涵蓋故障、恢復、不同位置交接與重載，完整 foundation 127 項通過。這不是新的玩法／視覺內容，也不證明 LIVE actor/index、性能或 rendered client 已通過；來源配對固定於 T181 `2f8b9dd5cce653ba03e9da439168f213e1a603fb`；canonical PR／CI、完整家族存檔門檻及部署另行閉合，尚未正式發布。

## W158 dependency companion (2026-10-24)

W158 pairs with Tavern 0.6.180 for Tavern's placed potion-bottle tint repair. World Liquor gameplay, resources and saved data remain as in merged W157; only release/module/dependency and guide payload version identities change. This companion does not resolve arbitrary freezer item rendering, Java seeded placement, component-dependent appearance or the pending Java author upgrades below. Exact T180 and optional G155 source-check pins are finalized; canonical checks remain pending. Complete-family native/saved-world gates and actual client acceptance remain separate; `client=false`, `production_ready=false`.

## W157 source candidate (2026-10-24)

W157 binds all four deferred furniture routes to the accepted hand, dimension, crouch state and target block before inventory mutation. Observable potion effect and delivery identity now belong to the shared captured-item comparison used by furniture, freezer insertion/milk and drink callbacks. This removes the earlier furniture-only rule and also rejects a potion replacement that occurs after native storage insertion but before hand debit. The freezer's Adventure allowance and complete native-item storage remain intact. Pack/module UUIDs and saved data keys are unchanged; both packs require Tavern 0.6.179, with Grilling 2.8.155 as an optional source-check peer.

The freezer blue-dye image is the exact official Minecraft 1.21.1 item sprite; the previous image was lapis lazuli. The current source contract verifies the pinned official image and its client texture, material, geometry and full UV route. Furniture/captured-item inverse-source rows and the old wrong-image projection have been retired; current behavior/resource checks and release-history/save-compatibility checks have separate responsibilities. Other historical projection domains remain outside this bounded change. [Source provenance and the remaining visual plan](audit/FREEZER-VISUAL-REVIEW-20261024.md) retain the arbitrary-input, Java seeded-placement and component-dependent rendering gaps.

Validation of the shared owner covers 133 source/API cases across captured-item, freezer input/milk, drinks, furniture callbacks and wall records. Four new regression cases failed before the shared fix and pass afterward, including effect/delivery replacements after native storage insertion. The existing ten storage projection tests and current storage check pass; the latter checks 48 poses, 4,992 vertices and 90 bindings. Three negative controls reject the wrong lapis image, a wrong texture binding and cropped UV. Independent reviews checked the runtime and validation changes. These are source/API and resource-contract results; full canonical CI, native/saved-world admission and actual rendered-client acceptance remain separate.

W155 and W156 remain preserved, superseded unmerged candidates. W155's four source CI jobs passed, but its T178 companion failed the existing effect-track retirement regression: reading an entity after its effects expired could recreate an empty track. T179 fixes that behavior. W156 changed only paired release identities before the current shared-owner cleanup. Their immutable claims, fingerprints and original results are not relabeled as W157 acceptance. This PR's candidate notes are consolidated here and in [CHANGELOG](../CHANGELOG.md); generated validation reports remain CI artifacts.

Java metadata was refreshed across seven maintained branches on 2026-10-23 UTC. The reviewed gameplay authority remains NeoForge 1.21.1 / World Liquor 1.1.11 / CF9066406. Forge 1.20.1 file9217901, NeoForge 1.21.1 file9217896 and separate 26.1.2 file9087098 still require adaptation; their official download endpoints did not provide archives, so no new binary comparison or adoption is claimed. Opaque item components are not universally comparable through the stable API. External same-type block replacements that emit none of the observed lifecycle callbacks are not claimed detected. Full Java parity, native Player behavior and rendered visuals remain unverified. `publication_request=false`, `bds=false`, `client=false`, `production_ready=false`. Earlier sections retain their original source scope.

## W153 source preparation (2026-10-18)

W153 changes only paired release/dependency and payload-version identities for T176; G154 remains an optional source-check peer. The W151 implementation and remaining gameplay/client gaps below are conserved, not reclassified as accepted. Canonical successor pins, freeze and checks remain pending. Fresh author metadata identifies Forge1.20.1 file9217901, NeoForge1.21.1 file9217896 and separate26.1.2 file9087098 as adaptation pending; W153 does not claim their new mechanics or complete Java parity. See [release scope](RELEASE-NOTES-0.1.153.md).

## 2026-10-17 現行來源

**W151**（[b8692380](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/commit/b86923801febbf23a43f36017ad299b28128b029)）配T173；公開包W148配T170。版本、下載及倉庫部署證據見[家族主索引](https://github.com/casama233/kaleidoscope-tavern-unofficial/blob/main/family/BASELINE-STATUS.md)。W151的34個方塊碰撞／選取修補已合併，原生接觸及同批家族驗收另記。W110四杯mesh／UV、冰紅茶brown匹配、W147冰櫃material registry與唱片來源修補保留，畫面仍按具體場景接受。

目前157份BP item定義＝27家具＋130 sprite routes；缺當前逐項Blockbench全物品FP／側面結果，舊156清單與單一W48 freezer觀察保留原範圍。下表已補布丁餘碗實作差距，並將Treasure Guide生物掉落標為使用者指定保留。詳細回報見[BUGS](BUGS.md)。

現行完整家族 LIVE 版本、部署與保存驗證及精確收據以 [家族索引](https://github.com/casama233/kaleidoscope-tavern-unofficial/blob/main/family/BASELINE-STATUS.md)為準。新來源的啟動精簡與保留 Java 數值行為見 [2026-10-13 來源範圍](JAVA-STARTUP-20261013.md)；不得將先前版本的部署／公開下載一致性當成新來源驗收。`client=false`、`production_ready=false`；完整 Java 一比一、原生 Player 操作和畫面音效不由載入或相同 hash 推定。

W131針對profile所見的傳輸CPU熱點，讓foundation receiver先篩選三個支援ID，再處理byte上限與JSON；共享UTF-8計數改按UTF-16讀取，保留配對及孤立surrogate的原數值。封包、ACK、排程及保存規則不變，詳見[本版範圍](RELEASE-NOTES-0.1.131.md)。此来源修正不能宣稱首輪啟動尖峰或整體watchdog已解決。

W146只訪問fresh effect recipients、保留20tick TTL與空snapshot立即撤銷，並略過被動效果的velocity讀取及冰櫃未變transform的teleport。每tick玩法、存檔倒數、native物品保全與原作聲畫資料保留；[定向操作數與邊界案例](evidence/performance-20261015.md)不冒充實際高延遲／FPS驗收。

玩法 authority 為 NeoForge 1.21.1／World Liquor 1.1.11／CF9066406，Forge 1.20.1／1.1.12／CF9066402 的差異分開核對。[current-author-review](../data/current-author-review-20261009.json)記錄來源；26.1.2／CF9087098 是另行待適配分支，custom Luck／BlockDrops copying 不能替換 1.21.1 的 vanilla Luck／block reroll。L0 為來源檢視，L1 為執行的 source／API／JVM 案例，L2 為明列來源的 native 引擎場景，L3 為真人客戶端比較。舊 L2／L3 保留其原版本，不改標成當前接受。

| 項目 | 已完成與證據 | 剩餘範圍 |
|---|---|---|
| LivingEntity／魚類 admission | 84 類精確 native counterpart，health／validity／非生物與存活 credit 條件保留。L1 26 原案例；T141／W118 L2 首次 21／重啟 22 的 cod API fall 對照仍綁原來源。見 [W118](RELEASE-NOTES-0.1.118.md) | 自然墜落、全部 Player／原生效果與完整事件階段 |
| 戰鬥入口（W120） | 斬首／Elbow 分開 direct LivingEntity，斬首要求目標存活；ground-crit melee 規則不變。16 個定向案例通過。見 [來源核對](../data/combat-admission-review-20261009.json) | 不是原生 DamageSource／Incoming／Pre 的完整等價；取消、重入、fallback、marker、causal heads 與 SkullOwner 仍未完成 |
| Use／crit／Tequila／Crazy／ContinuousHeal | 原 sound cadence、float damage／chance、Tequila cap、Crazy source selection 和每 tick amp+1 heal 保留。見 [use/combat](JAVA-USE-COMBAT-0.1.74.md)、既有 combat／crazy 案例 | 原生來源／護甲／absorption／cooldown、缺失 vanilla effects、實際聲場和原生 Player；不誤把原作 heal 改慢 |
| 布丁餘碗／食物完成 | W92已記錄原作last-serving hand replacement及非空／Creative掉碗；[當前main.js](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/blob/b86923801febbf23a43f36017ad299b28128b029/runtime/BP/scripts/main.js)仍inventory.addItem | 真正尚未對齊的實作；先核原生debit／callback順序，驗最後一份／多份／Creative、取消與換槽；Luck及random draw另保留 |
| Luck／SkullOwner | Dassai Q3–Q6 的 Luck amplifier 1／3／5／7 資料正確；一般 head registry candidate 順序已實作 | 穩定 API 缺完整 Java Luck loot attribute/context 與原生 Player head owner；資料正確不等於掉落／頭像還原 |
| Treasure Guide | source crop／ore 選取、原 block state／工具 reroll 和掉落中心已有 L1，見 [block source](JAVA-TREASURE-BLOCK-20261007.md) | mob one-tick nearby scan 缺本次死亡drops cohort／跨回呼去重；W148已公開source mock風險，W151同檔未改，依使用者決定保留／延後修復。方塊線仍缺player/block-entity/global loot-modifier context與pickup delay |
| Elbow | 原作 ATTACK_KNOCKBACK 和 float／LUT／ground／resistance 已有獨立 JVM 數值；已有真 airborne、buffered force 能力 L2。見 [development scope](../development/elbow/README.md) | Production attribute／charge／enchantment 與原力合成尚未接入；既有能力證據否定固定 extra impulse，不作平台完成豁免 |
| CaptainGift／movement／flight | Boating、reverse-gravity、MultiJump 有來源算術與有限 native adapter；CaptainGift 現僅 source-water 浮力 | 原作 12 格 water-fluid／AABB movement clipping、ground/fallDistance、原生 collision/input 和 Creative Flight 仍有差距 |
| Respawn／helpers | 87 個精確零碰撞 helper、Native storage API 保存場景、新確認錨 metadata 和 repeat／取消防線保留，見 [source adapter](RESPAWN-RUNTIME-SOURCE-ADAPTER.md)及 [W116](RELEASE-NOTES-0.1.116.md) | 真 Player、舊／未知錨、床、自然死亡及任意第三方 collision unknown 不自動放行 |
| 啟動與數值目錄 | 移除 motion 載入及 respawn 首用各 65,536 點 sine 全表；依原量化 index 計算所需值。Runtime 重生資料按 block 壓縮，同樣保留 26,684 states、missing-state consensus／dynamic unknown，見 [source comparison](JAVA-STARTUP-20261013.md) | 新候選 native watchdog／memory 結果與真人流暢度另驗；不以 source operation count 稱完整效能修復 |
| Freezer state／storage | 五個 current recipe、loaded tick 時序、四槽完整 native item carrier、rollback／reanchor／legacy adoption 保留；既有有限 L1／L2 見 [W93](RELEASE-NOTES-0.1.93.md)、[W98](RELEASE-NOTES-0.1.98.md) | 任意 callback／流體／metadata／offhand／crash phases 和真玩家；既有零 input 樣本不證明非空冰櫃內容 |
| Freezer height／frost | source result-height 的 20 個 JVM cases、current freeze selection 和排程老化有有限 L1／L2，見 [W99](RELEASE-NOTES-0.1.99.md)及 [current-freezer-review](../data/current-freezer-review.json) | 原料展示仍僅三種 sprite；目前逐槽位置／yaw／普通物品乾濕高度已對照原方法數值，見 [current-freezer-review](../data/current-freezer-review.json)。任意 ItemStack、BlockItem 模型／scale、絕對 UV／light／lid／動畫、附魔外觀與真人仍待比較 |
| Cabinet／furniture／wall record | 原 source slots／rotations／native metadata 和牆掛四向、取回、破壞 conservation 保留，見 [wall record](WALL-RECORD-FIX-20260929.md) | 真實點格、四向、透明、seat／waterlogging、models／animation／held view 等 L3 待接受 |
| Record audio／outlines／accelerator | 兩首原 OGG、equal-weight song 選取及 script audio cleanup adapter；guide 已明列必要平台限制 | 32-channel 限制、實際空間播放／停止；穿牆輪廓、Brew Accelerator enchantment／cooldown／operator 入口未完整適配 |
| Guide | W67 頁／三語、七入口、完整 preparations，公開 223／完整家族 227；完整 Cookery receiver 證據見家族索引 | 真人排版、鍵鼠／觸控／手柄、兩入口閱讀仍 pending |
| Forge／NeoForge26／foreign integration | current selected 18 shaker、5 freezer、25 drink records 和聲畫素材比較有來源記錄；六原 OGG 保留 | Forge event／cabinet automation／Create／Jade／SMC 尚未完整；26.1.2 branch effect registry、Luck、BlockDrops、automation 和配方另列適配 |

## 冗餘處理與歷史證據

本矩陣是現行差距的單一索引，[BUGS.md](BUGS.md)只列 open 問題與可分辨場景。舊 current W114／W115、T126／W103、85-helper 敘述不再重複成當前候選。原 release notes、source records、claims、未合併原型及原始 native／client 收據保持，沒有刪除或改名。

`legacy-freezer-recipes.js` 是舊存檔 extraction／migration 的必要入口；`content.js`／`payload.js` 分別服務 local gameplay 與 data protocol；Tavern SDK 和 84-class counterpart 的自有包副本保證獨立安裝，現有 source checks 約束其一致性。它們不是可直接刪除的 dead module。26.1.2 未註冊的七類 effects 不能用來刪掉 maintained 1.21.1 的內容。
