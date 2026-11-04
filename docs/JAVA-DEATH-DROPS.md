# Luck 與淘金熱的死亡掉落順序

2026-11-05 對照目前維護分支：NeoForge 1.21.1／1.1.12（CF9217896）及 Forge 1.20.1／1.1.13（CF9217901）。作者 archive 身份見 [current-author-review](../data/current-author-review-20261028.json)。本次直接核對兩個 archive 的 `LuckLootModifier`、`EventHandlers.onLivingDrops` bytecode，沒有提交第三方程式或 archive。

Java 的 Luck 先在原掉落表階段加入未出現過的物品種類；淘金熱再複製死亡事件當時整份掉落清單。NeoForge 的 [LootTable patch](https://github.com/NeoForged/NeoForge/blob/1.21.1/patches/net/minecraft/world/level/storage/loot/LootTable.java.patch) 將 global modifier 結果交給掉落 consumer；[LivingEntity patch](https://github.com/NeoForged/NeoForge/blob/1.21.1/patches/net/minecraft/world/entity/LivingEntity.java.patch) 先產出表內物品，再傳給 LivingDrops。兩條維護分支的淘金熱機率都是 `min(0.15 + amplifier * 0.05, 1)`。

原本 Bedrock 的兩個獨立 `entityItemDrop` 訂閱都只看原生清單。Luck 雖然另生出物品，淘金熱仍看不到它。現在由 [installDeathDrops](../runtime/BP/scripts/treasure-drops.js) 單獨持有本次死亡清單：

```text
原生死亡清單 → Luck 同表重抽及種類去重 → 淘金熱複製完整快照 → 生出加成物品
```

原清單的物品不重新生成。Luck 新種類在死亡位置生出；淘金熱各副本保留相應來源位置與 `ItemStack.clone()` 的完整資料。處理前移除待處理事件，避免同一次或同步重入的 callback 再次處理。沒有掃描附近物品，也沒有加入另一個效果加成入口。斬首的補發頭流程保持原有範圍，與淘金熱的 Java listener 順序仍未證明等價。

[來源回歸](../tests/treasure-drops.test.mjs) 用真實 production handler 覆蓋同時生效、原生 array-like 清單、相同種類去重、原位置、metadata、五次 Luck 與一次淘金熱抽籤、重入及重複事件。Luck query 失敗時仍只複製原清單一次。

[隔離引擎場景](../tests/native/death-drops-probe.js) 分 none／luck／treasure／both，各三次真實生物死亡。沿用 [原生測試生物](../tests/native/luck-loot-mob.json) 與 [原生掉落表](../tests/native/luck-loot-table.json)，記錄原掉落、實際 native reroll 和各種類最終數量／lore，另確認附近七個下界之星沒有增加。只有機率門檻注入成功值，掉落表仍由引擎抽取；未使用模擬玩家。場景要求 BDS 1.26.60.6／`@minecraft/server` 2.12.0-beta，沿用既有隔離世界的 `gametest`／`upcoming_creator_features`；本次由共同部署持有人排定唯一引擎時段，2026-11-05 00:43 HKT 的實際執行12案全部符合：both三案各有Luck新種類，原種類與新種類各2件；每次原生事件一次、lore保留、附近下界之星仍7、players0、errors[]。實驗旗標在正常stop後讀回仍為1；BDS exit0／Quit correctly，測試世界已清除。此證據是選定handler在真實引擎的行為，尚非完整家族保存世界或真人畫面／聲音。

本次沒有持久化格式或 ID 變更。挖礦／箱子／釣魚的完整 LootContext、無原生掉落清單的死亡、Java pickup delay、任意外部掉落 modifier 與實際畫面音效仍未補全。NeoForge 26.1.2／1.1.6 仍是獨立待適配分支，不能套用上述兩個分支的通過結論。真人比較可提供額外證據，但不作交付門檻，也不建立延期驗收登記。
