## 當前 W116／T139

已保留發布主線的三語指南與七入口，並合入固定原料／光效／Mob／確認重生錨修補。新配套完整 native first 20／restart 21 案例及嚴格來源 recorder 已通過；G122 完整家族、原生 Player、畫面音效與私人 LIVE 仍未驗收。詳見 [本版說明](RELEASE-NOTES-0.1.116.md)。以下保留各功能的原始來源與範圍。

# 玩家可見問題與待驗收項

## 當前 0.1.115

保留既有已確認重生錨與作者內容，配對 Tavern T138 的原生倒數／重啟光效整合。[本版範圍](RELEASE-NOTES-0.1.115.md)區分新候選驗證與原生 Player／真人／私人 LIVE 待驗收。

## 保留 0.1.114

保留 W113 全部重生錨／作者適配，僅同步 identity 與 Tavern 0.6.137 宿主相依。

重啟後確認原生效果與來源光效繼續，再以外部同 amplifier 刷新確認交還控制。保存資料、chunk 載入、真正 Player 與真人畫面分別驗證；見 [本版說明](RELEASE-NOTES-0.1.114.md)。


## 保留 0.1.113

在下界新設定已充能錨點，keepInventory=false 使用 Respawn；核對 yaw=0／forced=false、只扣一次 charge、聲音／傳送／Hunger。再測同tick repeat、晚取消、充能、同點、換塊、重生／離線。舊未觀察錨與不可讀狀態仍保守 unknown，沒有新增原生 Player／真人驗收。

來源與可分辨回歸見 [本版說明](RELEASE-NOTES-0.1.113.md)；下方舊版段落保留歷史範圍。

來源：T0.6.126／W0.1.103 的 Phase0 盤點。此表區分已確認實作差距、歷史限定觀察及當前待測，沒有把「未測」寫成「已重現 bug」。實際還原狀態統一維護於 PARITY-MATRIX.md；舊逐版證據只作引用。T/、W/ 表示來源倉庫。

## W-RESPAWN-HELPERS — 家族儲存／顯示 helper 阻止回到共用出生點

2026-10-08 修補來源：`respawn-helper-entities.js` 列出 85 個已逐一定義為 `has_collision=false`、零寬高且沒有碰撞 component-group 覆寫的家族 helper。`respawn-adapter.js` 只採納這些精確 ID，沒有加入 namespace／family wildcard；有實際碰撞盒的 `thrown_drink`、未知自有 ID 及第三方仍須已知事實，原先 callback 覆寫優先次序保留。

| 正式來源 | 檢視的 commit | entity 定義目錄 | 零碰撞 helper |
| --- | --- | --- | --- |
| Tavern | `1afc72e7e8a25ba32f538cc74244925f5c432175` | `runtime/BP/entities/` | 56 |
| World Liquor | `6063030da50097971f2692bdef6b7020da0011b3` | `runtime/BP/entities/` | 21 |
| Grilling | `b4bd3229f254adf58be1ee413f89daa1ab9c4df0` | `projects/grilling/gameplay_core/behavior_pack/entities/` | 8 |

這些是修補來源證據，不是另一份發版 hash 表。`tools/check_respawn_helpers.mjs` 以 `TAVERN_SOURCE`／`GRILLING_SOURCE` 的实际配對來源核對每個 ID、零碰撞盒和 component groups；可獨立執行，亦由 family 回歸呼叫。任一 peer 缺失或事實改變即失敗，不自動放行新名稱。

來源重現：正式 `planFreezerStorage` 在 512,64,512 保存有名稱／lore／foreign metadata 的糖，正式 `applyJavaRespawn` 在沒有個人出生點、或已證明個人點失效後查共用出生點。舊 W104 因遠處 `freezer_inputs` 返回 unknown；修補後回到第一個合法共用欄位，原 carrier／記錄／物品資料不變。有效床、重生錨及 forced 個人點不經此碰撞分支；這不是一般死亡重生故障。

`tests/respawn-freezer.test.mjs` 覆蓋兩個正式入口場景、全部 22 個自有 entity 定義、未知外部／同 namespace ID，以及既有 callback 優先次序。`tests/respawn-family.test.mjs` 另外直接執行配對 Tavern `NativeItemStorage.plan` 和 Grilling `stationContainer`，保存原 metadata 後驗證 helper 不再阻止共用出生點；在同一場景加入未知第三方仍會拒絕傳送。

這是 L1 source/API fixture 回歸，沒有執行原生 Player，也沒有聲稱新的 BDS／真人驗收。一般死亡、任意第三方碰撞形狀、原生床／錨 witness 和其他已記錄的 Respawn 平台差距仍分開驗收。

G118 相容候選追加：以 Grilling `f7bd2d26367c113ab8881bc67e9f5e69624917ff` 的正式 `plate_food_visual.json`、`recipe_icon_visual.json` 核對兩個新增 exact ID。兩者均為 `has_collision=false`、零寬高且沒有碰撞 component-group 覆寫；清單因此增為 Grilling 10 個、家族合計 87 個。原有來源表保留其檢視時間與範圍，沒有倒改舊證據。既有 family 回歸增加兩種展示同場不阻止 shared Respawn、同 namespace 未審查實體仍返回 unknown 的檢查。L108/T131 版本、相依與 runtime 身分已統一凍結；本段只記來源／API 回歸，不聲稱原生／客戶端通過。

G119 配對續核：正式來源 `b010ec2a6709ada74ed96ead19c60da4e0bc2789` 的 canonical BP entity 目錄仍是相同 11 檔；10 個非 player helper 定義與 G118 的 Git blob 全部相同，沒有新增、刪除或改碰撞的 helper。唯一 entity 差異是 `player.json` 的 held-render property range 上限；`family_station_storage.js` 亦與 G118 同 blob。因此沿用上述相同 helper／storage 輸入的 6/6 source/API fixture 證據，配對 metadata 改為 G119；不改 L108 凍結 runtime，也不把來源一致性當作新的 G119 全包、BDS、client 或 LIVE 驗收。

## T-W-STORAGE — 酒架/酒櫃格位、瓶身旋轉/莫洛托夫、材料資料保存

現行狀態：`transaction_and_native_preservation_bounded_visual_pending`。

Java 比較來源：refs: T/data/storage-render-source.json; reviewed-java-checkout/java-tavern-upstream/src/main/java/com/github/ysbbbbbb/kaleidoscopetavern/client/render/block/BarCabinetBlockEntityRender.java; reviewed-java-checkout/java-tavern-upstream/src/main/java/com/github/ysbbbbbb/kaleidoscopetavern/client/render/block/CellarCabinetBlockEntityRender.java; reviewed-java-checkout/java-tavern-upstream/src/main/java/com/github/ysbbbbbb/kaleidoscopetavern/client/render/block/TiltedRackBlockEntityRender.java; reviewed-java-checkout/java-tavern-upstream/src/main/java/com/github/ysbbbbbb/kaleidoscopetavern/client/render/block/HolderBlockEntityRender.java; scope: Pinned c4ec188 renderer PoseStack matrices and source bottle coordinates; full newest-branch equivalence remains distinct.

正式入口：T/runtime/BP/scripts/bedrock/stateful-storage-router.js:19; T/runtime/BP/scripts/core/native-item-storage.js:18; T/runtime/BP/scripts/bedrock/native-storage-pinning.js:11; T/runtime/BP/scripts/bedrock/bar-cabinet.js; T/runtime/BP/scripts/bedrock/cellar-cabinet.js; W/runtime/BP/scripts/foundation.js:4

來源檢查：level: L0_geometry / L1_transaction; refs: T/tools/check_storage_rendering.py; T/tools/native-storage-pinning.test.mjs; T/tools/glassware/storage-routing.test.mjs; facts: Fixed slot/model transforms and exact item carrier proof exist. Registered storage paths have source/API cases; fake ray objects do not verify real mouse coordinates.

原生引擎：level: L2_bounded_helper_preservation; refs: T/data/native-storage-reanchor-capabilities-20261007.json; facts: Actual same actor/metadata/record bytes survived displaced carrier recovery/restart. Zero players; synthetic helper restoration, not actual user insert/retrieve, all loaded/unloaded/crash phases or visible bottles.

客戶端：current_acceptance: False; meaning: No current T126/W103 client observation located in reviewed sources; this is pending, not a reproduced current defect.

最小重現／驗收場景：

- 把普通瓶、寬瓶/莫洛托夫、同ID不同名稱/附魔的兩瓶放入四向酒櫃與酒架；精確點每格取回，重登/正常重啟再取；另測相鄰櫃連接。

仍需完成：

- 四向外觀/玻璃/副手/觸控與實際mouse hit待D；T126未採作者Bedrock1.0.1 E/W座標改法，不能宣稱current E/W必壞；完整來源矩陣與client仍需對照。

## W-FREEZER-STATE — 冰櫃新配方/loadedtick時間/四槽完整物品

現行狀態：`implemented_bounded_native_state_pass_client_pending`。

Java 比較來源：refs: W/data/current-freezer-review.json; W/data/java-parity/neoforge-1.1.11/freezer/ice.json; W/data/java-parity/neoforge-1.1.11/freezer/obsidian.json; scope: AuthorCF9066406 NeoForge1.21.1 v1.1.11 FreezerBlockEntity.tick + current recipe data.

正式入口：W/runtime/BP/scripts/freezer-state.js:8; W/runtime/BP/scripts/freezer-recipes.js; W/runtime/BP/scripts/freezer-native-storage.js:17; W/runtime/BP/scripts/freezer-storage.js:13; W/runtime/BP/scripts/furniture.js:181

來源檢查：level: L1_state_and_invariant; refs: W/tests/freezer-state.test.mjs; W/tests/freezer-storage.test.mjs; W/tests/freezer-callback.test.mjs; facts: Source order, precise4slot metadata, own write rollback and old saved recipe migration have scoped cases; not universal crash/hook guarantees.

原生引擎：level: L2_bounded; refs: W/docs/RELEASE-NOTES-0.1.93.md:11; W/docs/RELEASE-NOTES-0.1.98.md:7; facts: Actual per-tick recipe callback experiment and later public-only12 affected item-container/restart/NBT cases reported; zero players. W97 numeric-coordinate failure retained; correctedW98 passed, not falsely relabeled.

客戶端：current_acceptance: False; meaning: No current T126/W103 client observation located in reviewed sources; this is pending, not a reproduced current defect.

最小重現／驗收場景：

- 新空冰櫃：1000mB水→loaded1800tick三冰；1000mB岩漿→1800tick一黑曜石；甜點1200tick；同ID不同名稱/附魔输入四槽、空手逐個取回與重登。存量舊magma批次應保留，但新岩漿不可再選magma。

仍需完成：

- 真玩家開關/裝料/抽取、unload時計與完整取消/副手、任意recipe/fluids/metadata/callback/crash仍未完整驗收；不能用來源保存case取代真人。

## W-FREEZER-VISUAL — 冰櫃蓋子、流體/原料/結果高度、四向UV與光照

現行狀態：`result_height_source_verified_other_render_pending`。

Java 比較來源：refs: W/data/current-freezer-review.json; W/data/java-parity/neoforge-1.1.9/assets/kaleidoscope_world_liquor/models/item/freezer.json; scope: Current1.1.11 FreezerRenderer.drawResultTexture float height;1.1.9 model reference is historical, not newest release completeness.

正式入口：W/runtime/BP/scripts/freezer-visuals.js:5; W/runtime/BP/scripts/freezer-visuals.js:11; W/runtime/BP/scripts/freezer-visuals.js:14; W/runtime/BP/scripts/freezer-visuals.js:15

來源檢查：level: A_JVM_height_only / L0_assets; refs: W/tests/freezer-result-height.test.mjs:5; W/tests/fixtures/JavaFreezerHeightOracle.java; W/tests/fixtures/java-freezer-height.jsonl; W/tools/test_freezer_java_art.py; facts: 20 independently JVM-produced height results compare actual runtime helper; this proves the height arithmetic only. Input rendering is a bounded snowball/blue_dye/slime_ball map, not arbitrary item appearance.

原生引擎：scope: Exact T126/W103 full-family load/restart and saved-world deployment gates passed per CURRENT-WORK; loading is not an affected gameplay/render scene.; affected_scene: False

客戶端：current_acceptance: False; meaning: No current T126/W103 client observation located in reviewed sources; this is pending, not a reproduced current defect.

最小重現／驗收場景：

- 開滿水及做完三冰的冰櫃，四方向看液面/蓋子；每抽一冰再拍，結果面由0.625隨剩餘count降低；加有名/附魔原料對照是否保留外觀；上方導體與玻璃各試開蓋。

仍需完成：

- 原Java panel geometry/UV、流體/原料動畫、任意附魔外觀、light、lid/comparator及四方向渲染未完整D；未測不列為已重現BUG。

## T-W-FURNITURE — 家具方向/含水/座位、動畫家具、方塊擺放與連接

現行狀態：`source_adapters_present_current_visual_pending`。

Java 比較來源：refs: T/art/source-jar.lock.json; T/data/storage-render-source.json; W/upstream/assets/kaleidoscope_world_liquor/blockstates; scope: Original blockstates/models plus selected Java placement/render matrices; source-specific hand/face/use ordering matters.

正式入口：T/runtime/BP/scripts/bedrock/furniture.js:13; T/runtime/BP/scripts/bedrock/java-placement-router.js; T/runtime/BP/scripts/core/furniture.js; W/runtime/BP/scripts/furniture.js:140

來源檢查：level: L0_assets / L1_placement; refs: T/tools/check_visual_rules.mjs; T/tools/test_shaker_native_frame.py; W/tests/wall-record.test.mjs; facts: Source bindings/state/transform and callback cases cannot prove actual input, all-view animation or transparent order.

原生引擎：scope: Exact T126/W103 full-family load/restart and saved-world deployment gates passed per CURRENT-WORK; loading is not an affected gameplay/render scene.; affected_scene: False

客戶端：current_acceptance: False; historical: Shaker third-person owner confirmation exists; that confirmation does not certify all furniture/animated assets.; refs: T/docs/REGRESSION-STATUS-2026-09-27.md

最小重現／驗收場景：

- 把酒凳、沙發、桌、燈、酒櫃/酒架各按四面放置；空手坐下/下坐騎、左右連接、含水；他人視角與重登後看模型方向及座位高度。

仍需完成：

- Current全家具、animation/facing/pose與support/多人互動待D；不得把所有家具方向當已知故障。

## W-DISC-AUDIO — 自訂唱片兩首隨機曲目、取回、單唱機停止/重啟

現行狀態：`script_adapter_present_audio_acceptance_pending`。

Java 比較來源：refs: W/upstream/assets/kaleidoscope_world_liquor/sounds.json; expected: Source random_disc has two equally weighted streaming tracks; original API/lifecycle differs from Bedrock script jukebox.

正式入口：W/runtime/BP/scripts/record-audio.js:7; W/runtime/BP/scripts/record-audio.js:12; W/runtime/BP/scripts/record-audio.js:13; W/runtime/BP/scripts/record-audio.js:15; W/runtime/RP/sounds/sound_definitions.json; W/runtime/BP/scripts/furniture.js:211

來源檢查：level: L1_callback / L0_source_audio_assets; refs: W/tests/record-audio.test.mjs:16; W/tests/native-record-probe.js; facts: Cleanup/refund/save and wall-decoration separation have API fixture tests. Track files/weights are source-backed, not heard mix acceptance; native-record-probe file alone is not proof of executed playback.

原生引擎：scope: Historical general BDS liquid/freezer/record load evidence exists; no current actual-audio/client playback evidence found.; refs: W/docs/BDS-LIQUID-FREEZER-RECORD-20260927.log; affected_current_audio_acceptance: False

客戶端：current_acceptance: False; meaning: No current T126/W103 client observation located in reviewed sources; this is pending, not a reproduced current defect.

最小重現／驗收場景：

- 兩個相鄰唱機各放自訂唱片，聽隨機二曲；空手取其中一片應只停止它；重登、破壞/爆炸/卸載再回來確認唱片與播放生命周期，近/遠距離對照Java聲場。

仍需完成：

- ExactRNG/曲目選取/聲場/重播/追蹤未完整D；現行adapter限定32個station音訊渠道，是否可接受須來源/客戶端評估，沒有平台豁免。

## W-WALL-DISC — 牆掛唱片四向背面/點選、空手/破壞掉落

現行狀態：`source_rotation_and_drop_repair_present_visual_pending`。

Java 比較來源：refs: W/upstream/assets/kaleidoscope_world_liquor/models/block/wall_record/base.json; W/upstream/assets/kaleidoscope_world_liquor/blockstates/wall_record.json; W/data/java-parity/neoforge-1.1.9/assets/kaleidoscope_world_liquor/models/block/wall_record/base.json; scope: Selected source model on+Z and N/E/S/W support convention. These older resource fixtures need latest-branch source comparison before full-current parity claim.

正式入口：W/runtime/BP/blocks/wall_record.json; W/runtime/BP/scripts/wall-record-state.js:11; W/runtime/BP/scripts/furniture.js:157; W/runtime/BP/scripts/furniture.js:226; W/tools/wall_record_definition.py:10

來源檢查：level: L0_geometry / B_callback_conservation; refs: W/tests/wall-record.test.mjs; W/docs/WALL-RECORD-FIX-20260929.md; facts: Current transforms0/270/180/90 retained; item decoded from broken permutation, unknown fails closed, callback failures rollback/drop dedup tested. These are static/API cases, not actual mine/render evidence.

原生引擎：scope: Exact T126/W103 full-family load/restart and saved-world deployment gates passed per CURRENT-WORK; loading is not an affected gameplay/render scene.; affected_scene: False

客戶端：current_acceptance: False; meaning: No current T126/W103 client observation located in reviewed sources; this is pending, not a reproduced current defect.

最小重現／驗收場景：

- 在四面實牆潛行掛原版disc及自訂disc，前/側/背看貼牆角與點選面；空手取回、挖掉/移除支撐，生存一片、Creative及doTileDrops=false不掉；重登後重試。

仍需完成：

- 歷史額外180度和onPlace清掉DP已修；當前牆角度、鼠標點選及實際掉落位置仍待D，不能把未測寫成仍壞。


## W110 current-author adaptation

Dassai Q3–Q6 source Luck amplifiers are corrected to1/3/5/7 in direct content, host payload and Q4–Q6 mixology inputs; displayed guide levels are2/4/6/8. Native Java Luck attribute/loot behavior remains absent. Four placed cocktail cups now use current-source geometry, UV and coupled atlases, and Around the World/Jerk use authored inventory icons. Source conversion does not establish actual transparency/depth/light or hand/client acceptance. Latest Forge cabinet automation, event phases, Create/Jade/SMC and TreasureSense tracking remain open; NeoForge26 is separately unported. See [current source review](../data/current-author-review-20261009.json).
