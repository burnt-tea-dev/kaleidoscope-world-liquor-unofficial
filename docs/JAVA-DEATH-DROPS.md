# Luck、淘金熱與斬首的死亡掉落

2026-11-05 對照目前維護分支：NeoForge 1.21.1／1.1.12（CF9217896）及 Forge 1.20.1／1.1.13（CF9217901）。作者 archive 身份見 [current-author-review](../data/current-author-review-20261028.json)。本次直接核對兩個 archive 的 `LuckLootModifier`、`EventHandlers.onLivingDrops` bytecode，沒有提交第三方程式或 archive。

Java 的 Luck 先在原掉落表階段加入未出現過的物品種類；淘金熱再複製死亡事件當時整份掉落清單。NeoForge 的 [LootTable patch](https://github.com/NeoForged/NeoForge/blob/1.21.1/patches/net/minecraft/world/level/storage/loot/LootTable.java.patch) 將 global modifier 結果交給掉落 consumer；[LivingEntity patch](https://github.com/NeoForged/NeoForge/blob/1.21.1/patches/net/minecraft/world/entity/LivingEntity.java.patch) 先產出表內物品，再傳給 LivingDrops。兩條維護分支的淘金熱機率都是 `min(0.15 + amplifier * 0.05, 1)`。

原本 Bedrock 的兩個獨立 `entityItemDrop` 訂閱都只看原生清單。Luck 雖然另生出物品，淘金熱仍看不到它。現在由 [installDeathDrops](../runtime/BP/scripts/treasure-drops.js) 單獨持有本次死亡清單：

```text
原生死亡清單 → Luck 同表重抽及種類去重 → 淘金熱複製快照 → 對完整清單結算斬首頭顱
```

原清單的物品不重新生成。Luck 新種類在死亡位置生出；淘金熱各副本保留相應來源位置與 `ItemStack.clone()` 的完整資料。處理前移除待處理事件，避免同一次或同步重入的 callback 再次處理。沒有掃描附近物品，也沒有加入另一個效果加成入口。斬首補頭也由同一清單結算，檢查原掉落及Luck新增物的完整metadata；無掉落清單時仍於兩tick後補頭。

斬首在 Java `addBeheadingHeadIfMissing` 以 `ItemStack.isSameItemSameComponents` 檢查當時整份清單。原先獨立的 Bedrock listener 在 Luck 加入新物品前就補頭，導致「初始只有骨頭、Luck已抽出原型頭顱」時輸出2顆；加上淘金熱時輸出3顆。本次將marker消費與補頭結算接回死亡清單owner，分別改為1／2顆；[真實註冊callback反例](../tests/death-head-order.test.mjs) 直接呼叫production handler，不另寫模仿Java的計算器。改名／不同lore的頭顱與預設頭顱仍是不同物品資料，不會錯誤去重；玩家頭顱的name/lore身分保留，皮膚仍是既有平台缺口。

兩個 Java LivingDrops listener 都沒有指定priority。[NeoForge Bus8.x](https://github.com/NeoForged/Bus/blob/8.0/src/main/java/net/neoforged/bus/EventBus.java) 與 [Forge EventBus6.x](https://github.com/MinecraftForge/EventBus/blob/6.0/src/main/java/net/minecraftforge/eventbus/EventBus.java) 以reflection註冊，不能由class內方法排列推定兩者總先後。本次只修不依賴那個未知順序的Luck頭顱去重。原清單／Luck都無相同頭時仍在淘金熱快照後補1顆，明列為延續既有適配，沒有新增版本或包組合例外；不聲稱Java一定如此排序。

本次受影響的持久化僅是既有 `BEHEADED_MARKER` 在正常死亡時被同一BP owner讀取並消費一次；沒有新key、格式、UUID或逐ID相容鎖。[既有斬首回歸](../tests/beheading.test.mjs) 保留原marker重載、無清單補頭、移除actor、頭顱資料和失敗不重試的行為。[原生頭顱場景](../tests/native/beheading-loot-probe.js) 與 [fixture](../tests/native/beheading-loot-fixtures.json) 準備了Luck／Luck+淘金熱的真實掉落反例、不同name/lore控制，以及同一QA世界正常重啟後的marker結算。這是已標記存活生物的死亡掉落線，不把測試fixture標記當作原生IncomingDamage／圖騰完整流程證據；2026-11-05 01:13 HKT 實際完成18個真掉落案例：Luck／Luck+淘金熱各取得3個「初始無頭、Luck抽出同款頭」反例，分別只留1／2顆原型頭；兩個改名head控制保留名稱/lore，另補的預設頭仍是獨立物品。隨後同一QA世界正常stop/restart，1個存活標記生物重載讀回marker，再死亡時清除一次並只結算一份頭顱。兩phase均players0、errors[]、BDS exit0／Quit correctly；測試世界清除。W185的舊12案沒有用作這次W186通過。

## W186實際斬首入口窄觀察

2026-11-05 01:35 HKT，BDS1.26.60.6／API2.12.0-beta完成[一個真AI攻擊場景](../tests/native/beheading-entry-probe.js)，使用[獨立fixture](../tests/native/beheading-entry-fixtures.json)。未預寫marker，也沒有用測試`applyDamage`扣血。原樣production `installEffects`及SDK consumer接收QA按既有protocol送出的effect snapshot；這不是完整Tavern publisher驗證。支援的amplifier255只保證斬首chance觸發，沒有替換原作算法。

真實事件為：普通近戰輸入4／marker=false → W beforeHurt輸出10000／marker=true → native afterHurt及自然死亡保留原攻擊者 → W死亡入口清除marker → 原生bone1與補head1。before enter/exit、afterHurt、melee hit、die enter/exit及原生drop各一次；beheaded1、forced0、heads1、errors[]，players0。正常stop0／Quit correctly、unit MainPID0後刪除QA世界；運行中2.5GiB／Swap0限制實讀。本場景沒有restart，也未重跑前述19案。Runtime沒有變動，無需新配對版本。

此觀察補上普通直接近戰的實際入口接線，仍不等於Java取消原傷害再另起攻擊的完整階段。護甲、吸收、圖騰、其他addon取消／競合、玩家頭皮膚和完整Tavern效果producer仍是各自未證範圍。

## W185原有驗證範圍

[來源回歸](../tests/treasure-drops.test.mjs) 用真實 production handler 覆蓋同時生效、原生 array-like 清單、相同種類去重、原位置、metadata、五次 Luck 與一次淘金熱抽籤、重入及重複事件。Luck query 失敗時仍只複製原清單一次。

[隔離引擎場景](../tests/native/death-drops-probe.js) 分 none／luck／treasure／both，各三次真實生物死亡。沿用 [原生測試生物](../tests/native/luck-loot-mob.json) 與 [原生掉落表](../tests/native/luck-loot-table.json)，記錄原掉落、實際 native reroll 和各種類最終數量／lore，另確認附近七個下界之星沒有增加。只有機率門檻注入成功值，掉落表仍由引擎抽取；未使用模擬玩家。場景要求 BDS 1.26.60.6／`@minecraft/server` 2.12.0-beta，沿用既有隔離世界的 `gametest`／`upcoming_creator_features`；本次由共同部署持有人排定唯一引擎時段，2026-11-05 00:43 HKT 的實際執行12案全部符合：both三案各有Luck新種類，原種類與新種類各2件；每次原生事件一次、lore保留、附近下界之星仍7、players0、errors[]。實驗旗標在正常stop後讀回仍為1；BDS exit0／Quit correctly，測試世界已清除。此證據是選定handler在真實引擎的行為，尚非完整家族保存世界或真人畫面／聲音。

以上W185證據保留其原來源範圍；本次沒有持久化格式或 ID 變更。挖礦／箱子／釣魚的完整 LootContext、無原生掉落清單的死亡、Java pickup delay、任意外部掉落 modifier 與實際畫面音效仍未補全。NeoForge 26.1.2／1.1.6 仍是獨立待適配分支，不能套用上述兩個分支的通過結論。真人比較可提供額外證據，但不作交付門檻，也不建立延期驗收登記。
