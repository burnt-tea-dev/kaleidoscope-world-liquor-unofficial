## Current upstream review — 2026-10-27

Current source adoption and exact remaining gaps are owned by [the 2026-10-28 review](../data/current-author-review-20261028.json). W170 adds current author pendant lamps/dye recipes, cabinet assets, Dassai/Luck+, Explosion power, underwater water-walk exclusion and air-jump velocity. [Native evidence](evidence/current-java-content-20261028.json) covers exact entity-drop attribution and complete native stack metadata, not global Java LootContext parity or rendered client acceptance. Luck currently affects emitted mob-death loot only. TreasureSense outlines remain absent. Historical sections below keep their original scope.

# World Liquor Java／Bedrock 差距矩陣

## 現行功能、API 與成本重審（2026-11-16，W222 候選）

本節以 main `c5984d46f4df4b120be72f0b7e229922f95509d4` 為起點，重審本矩陣、[BUGS](BUGS.md)、各 `JAVA-*` 來源契約及現行 runtime。下表31項是功能領域，包含已修的歷史取捨、仍缺失的行為及現有未合併PR，不代表31個新bug。2026-11-16核對[作者檔案清單](https://www.curseforge.com/minecraft/mc-mods/kaleidoscope-world-liquor/files/all)：維護Forge1.20.1為1.1.13／CF9217901，NeoForge1.21.1為1.1.12／CF9217896；獨立26.1.2為1.1.6／CF9087098。[現有來源記錄](../data/current-author-review-20261028.json)與[資產身份](../data/current-author-assets.json)仍是這些維護檔案的逐項依據；本次未重新下載／反編譯JAR，也不把26分支全體行為當成已移植。

本候選仍使用 server **2.12.0-beta**、最低引擎 **1.26.60**，保持原實驗旗標與Tavern **0.6.221**的精確相依；Tavern另一候選T224不自動進入本PR。官方最新stable／preview文件提供可行方向，不能推定宣告的beta就含所有較新介面。僅有特定版本陰性、文件找不到setter或缺客戶端觀察，都不構成「所有Bedrock API無法實現」；表內明列未證實的組合及下一步。原作每tick效果／觀察時序保持，不用節流隱藏功能差異。

`JS/` 指 `runtime/BP/scripts/`，`RP/` 指 `runtime/RP/`。舊證據的engine、玩家、保存及畫面範圍不因本次重審擴大。

| ID／範圍 | 原標記／來源接點 | 現行判定與可行 API 路線 | 成本、風險與下一步 |
| --- | --- | --- | --- |
| W01 已知重生資料重複解析 | W165減少無記錄玩家spawn查詢，但尚有不變JSON成本；`JS/respawn-metadata.js`，`docs/JAVA-RESPAWN-SOURCE-20261007.md` | **本次改善**：每個Player handle以WeakMap保留一份raw／解析結果；每tick仍原生讀DP及原規則的getSpawnPoint，不重用未知spawn事實。[E] | 同raw才免解析；新handle cold miss、變更／非字串／無效資料立即失效，公開結果複製point。無常駐玩家ID名冊。量測見下。 |
| W02 重生yaw／forced事實 | Respawn metadata差距；`JS/respawn-metadata.js`、`respawn-adapter.js`；原作 `RespawnEffect`／`data/respawn-anchor-source-20261009.json` | `Player.getSpawnPoint` [E] 有dimension與point，未暴露歷史yaw／forced；bed／anchor觀察與明確宣告可補**新事實**，不能猜舊存檔。本次cache不擴大metadata信任。 | 保留每tick失效、延後commit與取消／重登處理；先找真正native來源／事件再擴張，不能用當前視角代替保存yaw或以未知forced=true放行。 |
| W03 重生碰撞、原生Player與查詢範圍 | Respawn／helpers的unknown boundary；`JS/respawn-adapter.js`、`respawn-blocks.js`、`respawn-helper-entities.js` | W198正常Player teleport及扣錨失敗回復已在；任意第三方collision／pose仍有差距。Entity.getAABB與query volume [E/Q] 可作能力組合，但native碰撞AABB不自動等於Java LivingEntity姿勢，volume也未證明所有巨型邊界相交語義。 | 後續先確立候選相交上界再縮查詢，未知不自動放行；本次不把dimension scan盲改小半徑，也不以傳送成功當全部原作碰撞等價。 |
| W04 霜冰卸載暫停成本 | Freezer height／frost；`JS/frost-aging.js` | **已有PR，不重做**：[PR220](https://github.com/burnt-tea-dev/kaleidoscope-world-liquor-unofficial/pull/220) 已修正為凍結W221，commit `827a2b1d2c725dcdf94d36dcb4bc7051350ed756`；unloaded chunk判定只在同一tick共用，重載下tick可見。舊W220持續cache／延後retry敘述已失效。 | 原PR離線4096暫停列／同chunk／20tick中block讀81920→0，chunk查20；仍逐列與每個distinct chunk，不宣稱全域固定4chunk上限、TPS或native結果。本次保持原owner。 |
| W05 酒櫃漏斗／comparator | Cabinet automation缺失；`JS/furniture.js`、`docs/NATIVE-BLOCK-HOPPER.md` | selected60.6雙槽custom container的hopper push／pull160tick負例及chest正控只限制該路線；官方block_entity.container與BlockInventoryComponent [B] 已存在，不能列「平台永不支援」。 | 先證明Java格限／篩選／互斥及來源branch comparator；若原生不可用，再沿單一交易owner用有界鄰接容器transfer [C]，保持原頻率／rollback，不加全維度hopper掃描。 |
| W06 冰櫃配方／完整庫存／流體 | Freezer state／storage有限L1／L2；`JS/freezer-state.js`、`freezer-native-storage.js`、`freezer-input.js`、`freezer-output.js` | 五current recipes、loaded tick、四槽完整native carrier與rollback已有，W199／W200桶處理已修；任意offhand／crash／foreign流體未全證。完整ItemStack Container API [C] 已可用，不是只允許JSON物品。 | 沿同一inventory／fluid owner補特定缺失；不為每個recipe重建carrier或在展示層決定權威配方。 |
| W07 冰櫃任意物品3D展示 | Freezer height僅三種sprite；`JS/freezer-visuals.js`、`data/current-freezer-review.json`、`RP/models/entity/` | 逐槽位置／yaw／乾濕高度已有；任意ItemStack／BlockItem模型、附魔、scale與光照仍缺。item inventory保真 [C/S] 不等於通用ItemRenderer；可沿已知source模型／attachable／entity渲染路徑擴展，需證其原生裝備入口。 | 優先有來源的物品族、同一visual owner與變更才更新；不能把完整3D改成一張sprite宣稱等價，也不每格新增常駐多層helper。 |
| W08 原生block／item storage替代carrier | 隱形helper與保存取捨；`JS/freezer-native-storage.js`、`record-storage.js`、Tavern SDK storage | 官方block DP、container、block/item entity-storage [B] 是可減少helper候選；[S] item container與[M]原生2–4 parts multi_block可評估大型storage整合，完整metadata及每part容器語義仍需確認。 | 先設計完整metadata與舊存檔雙向守恆、破壞／掉落／重載fail-safe；target beta能力逐項確認。不可只搬JSON、留下兩份能取出的庫存或覆寫BP UUID。 |
| W09 唱片完整stack／回收 | 歷史record metadata遺失；`JS/record-storage.js`、`furniture.js`，`docs/JUKEBOX-REMOVAL.md` | W196已有native stack保存、改名／lore／DP及回復；舊遺失資料不可重建。替換回收至多10tick與特定自然互動尚有差距，不能再標當前全面metadata丟失。 | 後續以實際replace／break／explosion入口提前結算；只持一個回收owner，不加第二份ItemStack快照造成dup。 |
| W10 原生custom record／紅石與hopper | 原生record parser限制；`runtime/BP/items/`、`JS/furniture.js`、`docs/NATIVE-RECORD-NETWORK-CLICK.md` | SoundInstance路線已工作；舊52.3自訂sound enum被拒僅該版本結果。[PR219](https://github.com/burnt-tea-dev/kaleidoscope-world-liquor-unofficial/pull/219) 已有26.60候選輸入，沒有可宣稱成功的新parser結果。 | 沿原PR收斂native record／comparator5（Neo）或6（Forge）／hopper／stack保全；不要用silent音效假成功，或把載入通過當完整播放。 |
| W11 唱片聲音實例與聽感 | 歷史32alias／global stopsound取捨；`JS/record-audio.js`，`docs/RELEASE-NOTES-0.1.168.md` | **已改善**：W168採每播放SoundInstance owner，原音檔／等權選曲保留，沒有32上限；目前玩家進出、重登、空間停止與多唱機完整聽感仍未全證。 | 保持每實例stop與卸載／取出清理，無每tick聲音重播；後續針對聲場缺失使用現有音訊owner，不能退回全域stopsound。 |
| W12 Highball創造飛行權限 | flight未接正式runtime；`JS/effects.js`、`docs/CREATIVE-FLIGHT-GRANTS.md`、`NATIVE-OWNER-MAYFLY-READER.md` | 原生mayfly命令／owner-bound讀回已有窄能力，所選Neo原作只撤自己grant；目前API沒有已證明的獨立grant來源／撤回契約。input permissions並不是mayfly grant。 | 下一步先證明其他來源中途授權不被撤銷；不可到期一律ability false或用速度／浮空冒充創造飛行。記錄來源ownership成本低於長期盲輪詢。 |
| W13 Elbow原攻擊擊退 | production attribute／charge合成缺失；`JS/effects.js`、`motion-source.js`、`development/elbow/` | Java ATTACK_KNOCKBACK／float/LUT已有獨立數值，airborne／buffered force已有有限能力；applyKnockback／impulse [E] 可用但固定額外力已被既有結果否定。 | 按原incoming attack的charge／附魔／抗性／待提交力次序接入同owner；不加第二次hurt或固定extra impulse，也不改每tick動作。 |
| W14 CaptainGift水面行走 | ground／fallDistance寫入與物理差異；`JS/captain-gift.js`、`motion-source.js`，`docs/CAPTAIN-GIFT.md` | W188／W189原12格fluid／AABB／float邊界已還原；官方isOnGround／fallDistance讀取及applyImpulse [E] 不證明可保持完整Java ground語義。同位置keepVelocity teleport的mob停頓／Player拒絕已有反證。 | 可在同tick共用相同block讀，須保留每tick水面邊界與原生移動；先解ground／external force契約，不能以傳送置換普通行走。 |
| W15 Boating／反重力／MultiJump | movement有限native adapter；`JS/effects.js`、`motion-source.js` | 原數值、player inputInfo與速度可實作部分；不同mob的physics、普通jump／外來力及騎乘／滑翔等仍有限。原生API組合 [E] 不是一律不可行。 | 保持fresh recipient與原tick，資料按同tick共享而非跨tick快取速度；後續一次解一種外來力／輸入邊界，不擴至全部entity輪詢。 |
| W16 Luck完整LootContext | Luck僅mob-death loot；`JS/luck-loot.js`、`treasure-drops.js`，`docs/JAVA-DEATH-DROPS.md` | current Dassai Q3–6與原生掉落reroll已有；挖礦／箱子／釣魚／無事件情況及global modifiers未完整。LootTableManager已在原runtime使用，但不等於Java所有context。 | 先逐來源建tool／player／origin／block-entity契約並保持原種類去重；不能掃附近所有掉落猜owner，也不靠複製既有stack假裝reroll。 |
| W17 TreasureGuide掉落 | 舊雙listener／近場猜掉落；`JS/treasure-drops.js`、`treasure-block.js` | 現行單一死亡清單owner先Luck再快照複製，已避免重複複製；方塊player／block-entity／global modifiers、pickup delay與補頭次序仍有界。 | 跟實際drop event／原block permutation與tool，不增加第二訂閱或近場entity掃描。保持一擲及原位置，下一步收斂真正loot context。 |
| W18 斬首事件與玩家頭皮膚 | Incoming取消／另起attack來源不等價；`JS/beheading.js`、`treasure-drops.js` | beforeHurt／marker／blocked fallback與自然死亡窄場景已有；特殊防禦／其他cancel競合與任意Player skin未完成。beforeHurt／applyDamage [E] 是可用入口，未證明全事件phase可1:1。 | 先保留marker和單一補頭去重；來源限定已知皮膚可研究資源變體，不能說名稱/lore等同真Player頭，也不複製所有death結果。 |
| W19 喝酒戰鬥／Crazy／連續治療／缺少原版效果 | 原生DamageSource／護甲／cooldown差異；`JS/effects.js`、`combat-source.js`、`crazy-source.js` | 原sound cadence、Tequila cap、float／chance與每tick amp+1 heal保留；EffectTypes／addEffect [E] 可按當前registry選擇，但不存在的Java原版effect不因此自動適配。 | 逐effect分離數值與原生事件路線；不能為減載將連續治療改每秒、改抽樣表或偷偷去掉未知效果。 |
| W20 食物完成／布丁餘碗 | 歷史漏碗／多碗；`JS/main.js`、`food-remainder.js`，`docs/FOOD-REMAINDER.md` | W172/W198最後一份、多份、Creative已有來源及窄native完成證據；取消／換槽／離線與掉落物理未全驗，不能當成目前仍重現漏碗。 | 不重寫已通過結算；若新入口失敗，以同一onCompleteUse與inventory owner保證淨還一碗，避免新全玩家持物監測。 |
| W21 牆掛唱片整stack與admission | wall_record點擊／堆疊取捨；`JS/furniture.js`、`record-storage.js` | [PR227](https://github.com/burnt-tea-dev/kaleidoscope-world-liquor-unofficial/pull/227) 處理整stack保存；[PR228](https://github.com/burnt-tea-dev/kaleidoscope-world-liquor-unofficial/pull/228) 處理原作admission，均為可實作缺失。 | 同一交易owner對齊扣料、取回與全metadata，審查兩PR交疊；本次不重做或混入新render差異。 |
| W22 冰櫃轉換容器回手 | hand exchange差距；`JS/furniture.js`、`freezer-native-storage.js` | [PR226](https://github.com/burnt-tea-dev/kaleidoscope-world-liquor-unofficial/pull/226) 正在修原作手持結算。 | 由既有fluid／inventory owner處理滿庫存／Creative／失敗回復，不把完整物品JSON化或另建快速路徑。 |
| W23 酒吧椅admission | seat互動資格差距；`JS/furniture.js`、`payload.js` | [PR224](https://github.com/burnt-tea-dev/kaleidoscope-world-liquor-unofficial/pull/224) 已對照原作資格並修指南，非API不能實現。 | 維持rideable／seat owner，避免額外per-player座位掃描；後續按原PR界線接受真正互動。 |
| W24 滿庫存掉落初速 | Java inventory settlement動作差距；`JS/java-player-inventory.js`、`motion-source.js` | [PR225](https://github.com/burnt-tea-dev/kaleidoscope-world-liquor-unofficial/pull/225) 已實作有來源的overflow motion；W207 Creative滿庫存結算本身已修。 | 沿同一spawn／velocity owner，不重發drop；完整物理、碰撞、pickup delay另有界，不能以一個速度公式聲稱全部native等價。 |
| W25 唱片合成飲料tag | 原作者ingredient admission漏項；`runtime/BP/items/`、`tools/drink_content_contract.py` | [PR223](https://github.com/burnt-tea-dev/kaleidoscope-world-liquor-unofficial/pull/223) 以有來源item tags修復，屬資料／註冊缺失。 | 只增實際允許ID與tag，不把所有近似飲料直接加入；免runtime輪詢配方表。 |
| W26 投擲飲料來源sprite | thrown視覺取捨；`RP/models/entity/`、`RP/entity/` | [PR222](https://github.com/burnt-tea-dev/kaleidoscope-world-liquor-unofficial/pull/222) 改用原sprite，不涉及本候選W222版本號的source owner。 | 檢查同一projectile狀態與材料，不增helper；原生FP／遠近／光照仍不能由source貼圖推定全通過。 |
| W27 家具／杯子／冰櫃held與全景外觀 | source transforms已有、全物品FP/3P待驗；`RP/entity/`、`RP/models/`、`docs/evidence/freezer-editor-20261108/README.md` | mesh／UV／碰撞／乾濕位置已多次修補；[PR214](https://github.com/burnt-tea-dev/kaleidoscope-world-liquor-unofficial/pull/214) 是有界held來源證據，非新增runtime或完整client。 | 有具體可重現來源誤差再改art；先保持一個material registry／helper，透明排序、光照、FOV不靠堆幾何層猜解。 |
| W28 Brew Accelerator取得／書本／cooldown | Record audio／outlines／accelerator的剩餘項；`JS/furniture.js`、`payload.js`、`data/current-author-review-20261028.json` | 原作取得、附魔書互動與cooldown尚未完整適配；item-use events／ItemStack components／自訂狀態 [C/E] 提供候選組合，未有所有來源branch的完整行為採用。 | 先按選定Java入口拆取得／支付／冷卻，再接原有機器owner；不因名稱叫enchantment就假定必須改原版enchantment registry，也不把未知書消費。 |
| W29 TreasureSense穿牆輪廓 | 目前來源覆核列outlines absent；`JS/effects.js`、Tavern `bedrock/custom-effects.js` | 與Tavern Vision的原生渲染缺口共用；per-viewer property／render-controller／debug shapes值得評估，不能聲稱等價Glowing已完成或所有API均不行。 | 沿主體既有效果owner解單一輪廓能力，不在WL再生成另一套helper；先確認觀察者、遮擋與life cycle。 |
| W30 指南商品頁／多裝置閱讀 | Guide排版／輸入待驗；`JS/payload.js`、`tools/check_guide.mjs` | 當前三語、配方與共享七入口已可生成／檢查，舊67／223／227數字不是本版權威；未觀察鍵鼠／觸控／手把不等於缺失商品頁。 | 保持共用payload及變更才發布；不另加獨立GUI、聊天提示或每tick重排整本指南。 |
| W31 Forge／Neo26／Create／Jade／SMC／FluidUtil | 分支及foreign integration未完整；`data/current-author-review-20261028.json`、`JS/payload.js`、`sdk/` | 維護Forge／Neo21的來源已選，26branch不是同版本API切換；Bedrock事件／配方／extension protocol可實作有來源的相同行為，不能宣稱Java loader hook必然無替代。 | 按branch逐能力映射與資料ownership計畫；保留原recipe條件與去重，不把沒有依賴的Java功能默默全部註冊或每tick探測全部addon。 |

### W01 的實作、量測與驗證邊界

`stored(player)` 每次先讀真正 `getDynamicProperty(KEY)`；只有**同一Player handle且raw字串相同**才重用已驗證record（包括相同壞字串的undefined結果）。新handle自動cold miss，外部寫入／JSON損壞／刪除均在下一次讀取反映。原生getter例外仍回undefined，不因cache繞過讀取；沒有以玩家ID維護常駐cache或固定expiry。`getRespawnMetadata` 對外複製record及point，外部修改回傳值不能污染後續命中。原每tickgetSpawnPoint、native point失效、宣告、bed／anchor延後commit、取消與生命週期保留。

臨時離線命令載入正式模組及既有API doubles，以20個有確認metadata的同一Player handles跑1000tick：修前／修後DP讀取均20000，spawn讀取均20000；JSON.parse由20000降為20。這是**解析次數**的下降；native API觀察沒有減少，若引擎每次提供不同wrapper會cold miss，收益取決於handle重用。cache每個可達handle最多保存一份raw與record；本次沒有heap／GC／TPS／FPS量測。公開結果改寫、壞raw後恢復、外部yaw更新、spawn移走後回原點不復活舊metadata均作臨時離線檢查，未新增測試或fixture檔案。

既有 `tests/respawn-metadata.test.mjs`、`respawn-runtime.test.mjs`、`respawn-source.test.mjs` 共41項通過，覆蓋真正module的觀察／宣告／anchor／失效及source adapter既有語義。本輪未改測試斷言、CI、native fixture、API版本、peer pin或保存格式；沒有BDS、Minecraft、LIVE、玩家裝置、實際重生輸入或聲畫觀察。Java行為依[respawn來源](JAVA-RESPAWN-SOURCE-20261007.md)及[adapter契約](RESPAWN-RUNTIME-SOURCE-ADAPTER.md)維持，不能把本次解析優化稱為W02／W03已解決。

### 官方 API 對照（2026-11-16 查閱）

- [E] [Player](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/player?view=minecraft-bedrock-stable)、[Entity](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entity?view=minecraft-bedrock-stable)：getSpawnPoint回DimensionLocation，DP／AABB／effects／velocity等介面需依target版本；沒有由point推yaw／forced的契約。
- [Q] [EntityQueryOptions](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entityqueryoptions?view=minecraft-bedrock-experimental)、[World APIs](https://learn.microsoft.com/en-us/minecraft/creator/documents/scripting/world-apis?view=minecraft-bedrock-stable)：有界query有改善方向，不能犧牲未知碰撞邊界的正確性。
- [B] [block_entity component](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/blockreference/examples/blockcomponents/minecraftblock_block_entity?view=minecraft-bedrock-stable)、[Block Entity](https://learn.microsoft.com/en-us/minecraft/creator/documents/blockentity?view=minecraft-bedrock-stable)：原生容器、DP與block/item counterpart存在；DP從server2.10，entity-storage及item counterpart依matching beta，官方不保證較早stable。
- [M] [Multi-blocks](https://learn.microsoft.com/en-us/minecraft/creator/documents/multi-blocks?view=minecraft-bedrock-stable)：原生整體放置／破壞與getParts；vertical format>=1.26.40、horizontal>=1.26.50免實驗，不能由此推出舊容器／破壞掉落遷移已安全。
- [C] [Container](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/container?view=minecraft-bedrock-stable)、[ItemStack](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/itemstack?view=minecraft-bedrock-stable)：完整stack get／clone／set／transfer可用，規則／例外／copy後writeback仍須處理。
- [S] [storage_item](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/itemreference/examples/itemcomponents/minecraft_storage_item?view=minecraft-bedrock-stable)、[storage_weight_limit](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/itemreference/examples/itemcomponents/minecraft_storage_weight_limit?view=minecraft-bedrock-stable)、[ItemInventoryComponent](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/iteminventorycomponent?view=minecraft-bedrock-stable)：item container為可行能力，但weight64不等於任意數量非堆疊ItemStack。

優先次序：交付W01；沿現有PR220／222–228收斂已可實作的性能、資料與互動缺失；W05／W08從原生容器能力與守恆遷移著手，W12／W13／W14先解來源ownership與原生物理，再處理展示與更廣分支。另有#178舊配對、#216工作流規則；本輪不碰這些owner。此候選未合併、未發布、未部署；新文檔不把別人的open PR當已在main。

## Adventure 唱片插入與現行相依（2026-11-09，W208）

原原版唱機入口把 Adventure 與 Spectator 一同交給通用家具 mutable guard，錯擋已核 NeoForge 1.21.1 的 block-use 路徑。現在只在該唱機插入入口拒絕 Spectator；其他家具權限不變。既有真 production callback 測試涵蓋 Survival／Adventure／Creative 的扣手持、原 metadata 保存及取出，另驗 Spectator 不扣物、不建立 storage。沒有直接呼叫 accept 或另造 storage owner。

BP／RP 以現行 Tavern 0.6.217 真 manifest UUID／版本配對，SDK、保存格式與 UUID 不變。舊公開 W201／W207 仍依 T205，不把新版來源修復當成舊下載已更新。原 network Survival 場與保存結果沿原範圍；本次沒有新增 Native Adventure、聲畫或 FPS 證據，Forge 1.20.1 的 item-use 路徑亦不冒稱相同。

## W207 Creative 滿庫存結算（2026-11-09）

共用 Java inventory owner 修正冰櫃成品在 Creative 滿庫存時錯誤掉地：普通插入／合併失敗後依原版 `Inventory.add` 成功消耗暫時結果，機器扣一份，原庫存不改；Survival 滿庫存仍掉一份。原版 bytecode、5 個修前反例、119 項來源／API 回歸及獨立覆核見[結算範圍](JAVA-INVENTORY-SETTLEMENT.md)。這不是新版作者 JAR、BDS、存檔或客戶端驗收。

## C04 原生裝備入口覆核（2026-11-03）

[實際隔離觀察](evidence/native-item-display-20261103.json)與[可重現 fixture](../tests/native/item-display/README.md)補上一般原版 mob、非空裝備表、指令正向控制及背包／手持欄對照。BDS 1.26.60.6／2.12.0-beta 的 10 案均能用指令裝備，但沒有 Script API equippable；5 案背包完整保留本次附魔等 metadata，但第 0 格並非原生手持欄。此結論只涵蓋指定實體與引擎，不代表全部原生路線均不可用。任意 ItemStack／BlockItem 顯示、畫面與安全仍未通過；W180 runtime 不變。

## W168 唱片實例音訊（2026-10-27）

唱片改用實際引擎的 `SoundInstance`，移除 32 alias 上限及全域 `stopsound`。各播放、取出、替換、爆炸與清理各持有自己的 handle；原音檔與等權選曲、舊唱片存檔和 wall_record 所有權保留。`@minecraft/server` 2.10.0、T187/W168 在無實驗旗標的 BDS 1.26.52.3 首載取得 40 個獨立 handle，同世界重啟逐字保留 legacy／current／wall 三行。來源、log hashes 和範圍見 [證據](evidence/record-instances-20261027.json)。

Beta API 並未被禁止。原生 `minecraft:record` 自訂音效在該引擎即使啟用 `gametest`、`upcoming_creator_features` 及受支援的 2.11.0-beta，仍遭 enum parser 拒絕；同場 `record.cat` control 成功。可重現小 fixture 留在 tools，未塞入產品 runtime。當前 NeoForge 1.21.1 原作 comparator 為 5，Forge 1.20.1 為 6，分支不可混用。完整 native comparator／hopper／ItemStack、玩家進出／重登聽感和真人聲場仍未完成。詳見 [W168 範圍](RELEASE-NOTES-0.1.168.md)。

## W165 respawn metadata polling (2026-10-27)

Players without confirmed metadata no longer trigger native personal-spawn queries. Confirmed records still check every tick, late declarations begin checking immediately, and an observed move still clears stale metadata before returning to the old point. The real module regression is in `tests/respawn-metadata.test.mjs`; direct old/new source callback counts are summarized in [the change record](../CHANGELOG.md#01165). This establishes less source API work. The complete P70 family containing W165 passed static admission, consistent stopped-world backup, the same copy's first load/restart, installation and exact readback; the dated [sanitized observation](evidence/family-w165-deployment-20261027.json) owns the identities and result counts. This run retained the sampled player records but contained no custom container inventory or native freezer input container, so it does not establish arbitrary ItemStack/container UI coverage. Startup warnings remain. W165 has also been [published](../README.md#current-maintained-source) through the verified manual publication workflow. CPU/TPS/FPS improvement, native Player respawn lifecycle and human acceptance remain pending. The public W165 BP/RP does not include the private family's separate Dimensions Wine snow repair. `client=false`, `production_ready=false`.

## W164 公開交付歷史範圍（2026-10-27）

[W164 已公開](https://github.com/burnt-tea-dev/kaleidoscope-world-liquor-unofficial/releases/tag/v0.1.164)。[發布工作](https://github.com/burnt-tea-dev/kaleidoscope-world-liquor-unofficial/actions/runs/40434175508)的 publish job 成功，於 2026-10-27 01:43:16 UTC 將逐項下載核對過的草稿轉為正式 release；tag 指向原來源 `922645eeb852410477034f55a61c61a6064d9287`。原 W164 的精確下載及 archive SHA256 見其 [release 資產](https://github.com/burnt-tea-dev/kaleidoscope-world-liquor-unofficial/releases/tag/v0.1.164)；配套仍為 T185／可選 G157。凍結 W164 request 的 `publication_request=false` 是原來源 metadata；本次明確手動發布已完成，不能再把授權 job 成功但跳過 publish 的舊情況當成當前下載狀態。

本版已對照原 Java 方法的冰櫃逐槽位置、yaw 及普通物品乾濕高度，範圍仍是既有三種 sprite。普通石頭沒有通用 renderer；任意 ItemStack、BlockItem 模型、絕對 UV 及真人畫面仍未完成。公開包、完整家族原生／保存觀察及真人驗收各有自己的證據範圍；`client=false`、`production_ready=false`。以下舊版段落保留原來的日期與來源，不代表 W164 的發布或驗收狀態。

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

目前157份BP item定義＝27家具＋130 sprite routes；缺當前逐項Blockbench全物品FP／側面結果，舊156清單與單一W48 freezer觀察保留原範圍。下表的布丁餘碗（W172）、斬首（W173）與 Treasure Guide 生物掉落（W174）為已實作待驗收。詳細回報見[BUGS](BUGS.md)。

現行完整家族 LIVE 版本、部署與保存驗證及精確收據以 [家族索引](https://github.com/casama233/kaleidoscope-tavern-unofficial/blob/main/family/BASELINE-STATUS.md)為準。新來源的啟動精簡與保留 Java 數值行為見 [2026-10-13 來源範圍](JAVA-STARTUP-20261013.md)；不得將先前版本的部署／公開下載一致性當成新來源驗收。`client=false`、`production_ready=false`；完整 Java 一比一、原生 Player 操作和畫面音效不由載入或相同 hash 推定。

W131針對profile所見的傳輸CPU熱點，讓foundation receiver先篩選三個支援ID，再處理byte上限與JSON；共享UTF-8計數改按UTF-16讀取，保留配對及孤立surrogate的原數值。封包、ACK、排程及保存規則不變，詳見[本版範圍](RELEASE-NOTES-0.1.131.md)。此来源修正不能宣稱首輪啟動尖峰或整體watchdog已解決。

W146只訪問fresh effect recipients、保留20tick TTL與空snapshot立即撤銷，並略過被動效果的velocity讀取及冰櫃未變transform的teleport。每tick玩法、存檔倒數、native物品保全與原作聲畫資料保留；[定向操作數與邊界案例](evidence/performance-20261015.md)不冒充實際高延遲／FPS驗收。

玩法依據與本次採用範圍見[目前來源覆核](../data/current-author-review-20261028.json)。NeoForge 1.21.1／1.1.12／CF9217896 與 Forge 1.20.1／1.1.13／CF9217901 分開追蹤；本次採用兩條維護分支的新 custom Luck，不把另行待適配的26.1.2／CF9087098整條分支當作完成。L0 為來源檢視，L1 為執行的 source／API／JVM 案例，L2 為明列來源的 native 引擎場景，L3 為真人客戶端比較。舊 L2／L3 保留其原版本，不改標成當前接受。

| 項目 | 已完成與證據 | 剩餘範圍 |
|---|---|---|
| LivingEntity／魚類 admission | 84 類精確 native counterpart，health／validity／非生物與存活 credit 條件保留。L1 26 原案例；T141／W118 L2 首次 21／重啟 22 的 cod API fall 對照仍綁原來源。見 [W118](RELEASE-NOTES-0.1.118.md) | 自然墜落、全部 Player／原生效果與完整事件階段 |
| 戰鬥入口（W120） | 斬首／Elbow 分開 direct LivingEntity，斬首要求目標存活；ground-crit melee 規則不變。16 個定向案例通過。見 [來源核對](../data/combat-admission-review-20261009.json) | 不是原生 DamageSource／Incoming／Pre 的完整等價。W173 `beheading.js` 補上持久 marker、blocked fallback（1→2 傷害→歸零）、processing 重入阻擋、原生掉落清單去重與玩家頭 owner 名稱／lore；當前補頭改由單一death-drop owner在Luck後依完整metadata去重，原獨立listener移除，見 [頭顱反例與順序界線](JAVA-DEATH-DROPS.md)。W186普通真AI直接攻擊的beforeHurt→marker→自然死亡→補頭單場景已過，未預標記，詳同頁。原生 incoming 取消＋另起攻擊來源、特殊防禦／取消競合與頭顱皮膚仍開放，見 [beheading 案例](../tests/beheading.test.mjs) |
| Use／crit／Tequila／Crazy／ContinuousHeal | 原 sound cadence、float damage／chance、Tequila cap、Crazy source selection 和每 tick amp+1 heal 保留。見 [use/combat](JAVA-USE-COMBAT-0.1.74.md)、既有 combat／crazy 案例 | 原生來源／護甲／absorption／cooldown、缺失 vanilla effects、實際聲場和原生 Player；不誤把原作 heal 改慢 |
| 布丁餘碗／食物完成 | W172正式分支與當前兩Java作者一致；既有13項來源案例及W198三案Native完成／扣料witness通過，最後一份、多份、Creative均淨還1碗。實際延後觀察同tick；來源／原生階段與範圍只查[布丁餘碗](FOOD-REMAINDER.md) | 未發現這三案的漏碗／多碗，runtime不改。取消／換槽／離線、掉落物位置／完整物理、真人輸入與Luck／random draw仍未全驗；不把trace的next_tick名稱當固定時序保證 |
| Luck／SkullOwner | Dassai Q3–Q6 已改為當前 custom Luck amplifier1／2／3／4；生物原生掉落重抽、種類去重與 metadata 已有隔離BDS證據；Luck→淘金熱現改由單一死亡清單 owner 串接，見 [順序及驗證範圍](JAVA-DEATH-DROPS.md)；一般 head registry candidate 順序保留 | 完整 Java LootContext、無掉落事件、挖礦／箱子／釣魚與原生 Player head owner仍待適配；不稱全域 Luck 已完成 |
| Treasure Guide | source crop／ore 選取、原 block state／工具 reroll 和掉落中心已有 L1，見 [block source](JAVA-TREASURE-BLOCK-20261007.md) | `treasure-drops.js` 的單一死亡清單 owner 先納入 Luck 新種類，再做淘金熱快照複製，退役原雙訂閱，見 [當前順序](JAVA-DEATH-DROPS.md)。W174 起改讀原生 `entityItemDrop` 掉落清單：來源擁有者持效果、每次死亡一擲、逐項在原位置複製（快照，不重複複製），見 [treasure-drops 案例](../tests/treasure-drops.test.mjs)；pickup delay、與斬首補發頭的順序及真人驗收仍開放。方塊線仍缺player/block-entity/global loot-modifier context與pickup delay |
| Elbow | 原作 ATTACK_KNOCKBACK 和 float／LUT／ground／resistance 已有獨立 JVM 數值；已有真 airborne、buffered force 能力 L2。見 [development scope](../development/elbow/README.md) | Production attribute／charge／enchantment 與原力合成尚未接入；既有能力證據否定固定 extra impulse，不作平台完成豁免 |
| CaptainGift／movement／flight | Boating、reverse-gravity、MultiJump 有來源算術與有限native adapter；W188恢復CaptainGift原12格水-fluid／AABB及Java float水面；W189修正眼睛入水的float相加邊界。原生與新增來源回歸各自範圍見[水面移動](CAPTAIN-GIFT.md) | 保持原生動作的ground/fallDistance寫入、普通跳躍／外部待提交力道、各生物物理／collision/input仍有差距。Creative Flight命令入口及原生owner-bound mayfly讀回primitive已在同retail60.6 profile窄驗，見[讀回能力](NATIVE-OWNER-MAYFLY-READER.md#observed-on-2026-11-06)；正式飛行尚未接入runtime；已選NeoForge只撤自身grant，期間其他來源授權必須保留。所選2.12-beta接口仍缺獨立grant來源／移除能力，反例及未發布prototype範圍查[Highball grant契約](CREATIVE-FLIGHT-GRANTS.md)。T205會話快取修復與此獨立收斂。同位置保速傳送的mob停頓及模擬Player拒絕證據見[原生反證](CAPTAIN-GIFT.md#同位置保速傳送2026-11-06原生反證) |
| Respawn／helpers | 87個精確零碰撞helper、錨metadata等既有能力保留；W198改正常Player傳送並在失敗時回復扣錨。正式applyEffect同／跨維度、Hunger與血量、正常Player真落地及同QA charge2／1重啟23項原生檢查通過，見[source adapter範圍](RESPAWN-RUNTIME-SOURCE-ADAPTER.md#w198正式player傳送與失敗回復) | 真人喝酒／聲畫／實際client封包階段、其他床／未知錨／自然死亡及任意第三方collision仍未全驗；unknown不自動放行，傳送例外回復仍是來源故障覆蓋 |
| 啟動與數值目錄 | 移除 motion 載入及 respawn 首用各 65,536 點 sine 全表；依原量化 index 計算所需值。Runtime 重生資料按 block 壓縮，同樣保留 26,684 states、missing-state consensus／dynamic unknown，見 [source comparison](JAVA-STARTUP-20261013.md) | 新候選 native watchdog／memory 結果與真人流暢度另驗；不以 source operation count 稱完整效能修復 |
| Freezer state／storage | 五個 current recipe、loaded tick 時序、四槽完整 native item carrier、rollback／reanchor／legacy adoption 保留；W199滿槽桶接回普通入料owner，W200修Creative成功取液的額外滿桶／滿庫存拒絕；來源與定向native進度見[桶原料與流體轉移](FREEZER-FLUID-INPUT.md)。既有有限 L1／L2 見 [W93](RELEASE-NOTES-0.1.93.md)、[W98](RELEASE-NOTES-0.1.98.md) | 任意 callback／流體／metadata／offhand／crash phases 和真玩家；既有零 input 樣本不證明非空冰櫃內容 |
| Freezer height／frost | source result-height 的 20 個 JVM cases、current freeze selection 和排程老化有有限 L1／L2，見 [W99](RELEASE-NOTES-0.1.99.md)及 [current-freezer-review](../data/current-freezer-review.json) | 原料展示仍僅三種 sprite；目前逐槽位置／yaw／普通物品乾濕高度已對照原方法數值，見 [current-freezer-review](../data/current-freezer-review.json)。任意 ItemStack、BlockItem 模型／scale、絕對 UV／light／lid／動畫、附魔外觀與真人仍待比較 |
| Cabinet／furniture／wall record | 原 source slots／rotations／native metadata 和牆掛四向、取回、破壞 conservation 保留，見 [wall record](WALL-RECORD-FIX-20260929.md) | 普通漏斗尚未接正式 owner；selected60.6 獨立原生容器的推入／抽出負例與正控制只查[能力觀察](NATIVE-BLOCK-HOPPER.md#observed-on-2026-11-06)，沒有因此修改 carrier 或聲稱 Java 格限／篩選已完成。真實點格、四向、透明、seat／waterlogging、models／animation／held view 等 L3 待接受 |
| Record audio／outlines／accelerator | W190／W192／W194修正唱片歸還與方塊替換；W196改用既有原生storage保留接收的完整stack，修復改名／lore／DP丟失，插入支付／回復及各回收入口共用owner；新具名stack／替換／同世界保存有定向原生觀察，範圍見[取出與保存](JUKEBOX-REMOVAL.md)。兩首原OGG、equal-weight選曲及SoundInstance owner／牆掛所有權保留 | 接受手持物／支付回復仍屬來源callback測試，自然點擊未證實；[單一network Player點擊fixture與root協定契約](NATIVE-RECORD-NETWORK-CLICK.md)已備妥，原生執行NOT_RUN；舊列已丟metadata無法還原；原生custom record parser／自動化／comparator／hopper、初速／pickup delay，替換回收仍可延遲10tick；實際空間播放／停止／進出與重登；穿牆輪廓、Brew Accelerator取得／附魔書互動／cooldown仍未完整適配 |
| Guide | 商品頁、三語與製作資料只查[當前payload](../runtime/BP/scripts/payload.js)；七入口及合併條目由[配對指南檢查](../tools/check_guide.mjs)核對，不沿用舊67／223／227統計。完整 Cookery receiver 證據見家族索引 | 真人排版、鍵鼠／觸控／手柄、兩入口閱讀未觀察，不另設交付等待 |
| Forge／NeoForge26／foreign integration | current selected 18 shaker、5 freezer、25 drink records 和聲畫素材比較有來源記錄；六原 OGG 保留 | Forge event／cabinet automation／Create／Jade／SMC 尚未完整；26.1.2 branch effect registry、Luck、BlockDrops、automation 和配方另列適配 |

## 冗餘處理與歷史證據

本矩陣是現行差距的單一索引，[BUGS.md](BUGS.md)只列 open 問題與可分辨場景。舊 current W114／W115、T126／W103、85-helper 敘述不再重複成當前候選。原 release notes、source records、claims、未合併原型及原始 native／client 收據保持，沒有刪除或改名。

`legacy-freezer-recipes.js` 是舊存檔 extraction／migration 的必要入口；`content.js`／`payload.js` 分別服務 local gameplay 與 data protocol；Tavern SDK 和 84-class counterpart 的自有包副本保證獨立安裝，現有 source checks 約束其一致性。它們不是可直接刪除的 dead module。26.1.2 未註冊的七類 effects 不能用來刪掉 maintained 1.21.1 的內容。
