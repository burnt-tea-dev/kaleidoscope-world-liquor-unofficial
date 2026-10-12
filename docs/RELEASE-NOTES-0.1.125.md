# 0.1.125：配對 Tavern T148 的 UI namespace bridge

BP／RP 精確相依更新為 Tavern **0.6.148**，同步包、模組、內部 BP／RP 相依、package 與 payload 身份。World Liquor 原本已有独立 UI namespace；本包沒有新增 HUD 或改寫共享原生根。Tavern／Grilling 的同路徑 UI 相容修補在各自 canonical 來源完成，公開 CI 使用 T148／G129 的固定來源。

W124 的玩法、配方、67 個指南條目、84 類魚准入、模型、動畫、音效及保存資料保持。除兩份 manifest 和 payload 的版本欄位外，其餘 886 個 runtime 檔案保持 W124 原檔。正常 freeze 追加 W125，不改歷史鎖、UUID 或存檔 schema。

公開包直接封裝 canonical BP／RP。私人料理與 AMW 額外能力有獨立來源，沒有混入本包或新增伺服器本地玩法覆寫。跨包 namespace 修補不等於完整共享 Actionbar／title 仲裁，也不宣稱所有 UI 相容問題已解決。

來源／依賴與封裝核對是本次驗證範圍；完整家族載入、停服存檔副本驗證、准入／LIVE 讀回及真人 UI 效果另記於[家族索引](https://github.com/casama233/kaleidoscope-tavern-unofficial/blob/main/family/BASELINE-STATUS.md)。維持 `client=false`、`production_ready=false`；舊 isolated 影片不代替本候選真人驗收。

2026-10-12 10:23 UTC 的唯讀 Java 作者查核仍為 Forge 1.20.1／1.1.12／CF9066402、NeoForge 1.21.1／1.1.11／CF9066406 的 metadata current、parity pending；獨立 NeoForge 26.1.2／1.1.6／CF9087098 的 Luck／BlockDrops／註冊適配仍待完成。本次相依配對不新增 Java 玩法還原。
