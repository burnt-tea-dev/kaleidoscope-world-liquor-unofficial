# 0.1.124：配對 Tavern T147 HUD200（draft）

BP／RP 相依精確更新為 Tavern 0.6.147，同步包、模組、內部 BP／RP 相依及 payload 版號。公開 CI 的 Tavern T147 來源與既有 Grilling G125 來源固定於 `.github/baseline-integration.json`；本候選只供 draft PR 來源審查，不是發布、合併或部署。

W123 的玩法、三語指南條目、配方、Java 作者資源與既有修補全部保留。只更新版本及相依 metadata，正常 freeze 追加 W124 鎖定，不改 W123 或更早歷史，不放寬 exact dependency gate。HUD200 的行為修補由 Tavern 宿主提供；World Liquor 不加入平行 HUD 或額外玩法。

較早 HUD200 診斷的自然／快速切換觀察僅屬有限範圍；輸入和引擎時序仍未知，不能挪作這組新正式身份的真人驗收。本次不執行 GUI、原生／BDS、存檔演練或 LIVE 操作。來源／CI 與封裝完整性均不是完整 Java 對等或真人用戶端驗收，維持 `client=false`、`production_ready=false`。

Java 分支仍分開追蹤：目前倉庫已記錄 Forge 1.20.1／World Liquor 1.1.12、NeoForge 1.21.1／1.1.11，以及獨立 NeoForge 26.1.2／1.1.6 的未完成適配。本次身份配對不新增作者玩法適配，也不宣稱補完既有缺口。

作者版本背景僅依目前 canonical 倉庫的 `family/java-upstream.json`、`family/BASELINE-STATUS.md` 與本庫既存作者 review；本次沒有取得 fresh BSM author status 或重新查證最新作者發布，不能視為最新作者適配驗證。
