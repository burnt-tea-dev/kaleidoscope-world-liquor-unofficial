# 世界名酒生物效果派送

直接來源為 MC 1.21.1 NeoForge 作者世界名酒 1.1.11（CurseForge file 9066406），
配合酒館 1.2.0。本批不宣稱 Forge 1.1.12 或新 Minecraft 分支已完整移植。

`ContinuousHealEffect` 對 LivingEntity 每 tick 呼叫 heal(amplifier+1)，
使用 float 生命值；原生 heal 不使零生命值復活。`CrazyEffect` 和
`ExplosionEffect` 也接受 LivingEntity。`LevelBoostEffect` 限 Player，
`RespawnEffect` 限 ServerPlayer。來源類別名稱列明，完整作者反編譯檔不公開。

酒館 0.6.115 的外部效果儲存、快照、投擲派送接入有效原生 mob／armor stand，
排除僅有 health 的船等載具。附屬從自己的公開快照索引解析載入的接收者，
不掃描所有生物、不讀別包的動態資料。宿主啟動／entityLoad 恢復自己的持久資料；
每 tick 扣載入期間時長，移除時清理索引。快照撤銷可清掉已清除生物的舊快取。
玩家既有操作及資料所有權保持原契約，SDK 新查詢為向後相容的增加。

投擲判斷讀已登記的 instant/timed 定義，零時長即時效果不再被 timed 衰減門檻略過。
世界名酒逐 tick 治療生物，float 相加後限最大生命值；升級／返生在生物上無操作。

## 證據與界線

- 118 個跨包程式回歸通過，其中新測接收者、float／零生命值、清除及卸載恢復。
- BDS 1.26.51.1 真實自訂 mob：連續九次同一 interval 階段均每 tick +2，
  清除後不再治療，boat 拒絕，玩家專用效果無操作，零時長即時投擲派送，
  真實爆炸事件，以及同一世界正常停止／重啟後再九次每 tick +2。
- 原生測試在拷貝的真實宿主／附屬中插入明確 test-only observer，
  投擲列由 observer 指定以隔離派送缺陷；不能據此聲稱實際配酒／投擲入口全流程已驗收。
  沒有 Minecraft 模擬玩家，沒有真人連線。觀察器及啟動器在酒館 tools/native。
- 首次區塊未載入、timeout continuation 跨 interval 觀察階段的失敗記錄保留；
  最終逐 tick 觀察使用固定 interval 階段，未更改治療節拍來遷就測試。

本批只修外部效果派送及上述行為。酒館自身 mob 效果、世界名酒 mob 移動／冰面、
完整混亂原生效果集合、NeoForge heal 事件／其他 mod 修改、即時快照初次派送與清除
的原生事件階段差異、任意未知 addon 的 Java 類別等仍待修／驗證。
聲音、畫面及真人操作維持 client=false；完整目標除了微醺外沒有縮小。

真人對照见 [CLIENT-COMPARISON-0.1.82.md](CLIENT-COMPARISON-0.1.82.md)。
