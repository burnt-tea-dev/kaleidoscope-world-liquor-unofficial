# 0.1.129：配對酒館152的同步分包校驗

W129 只更新版本、模組、payload 身份及 Tavern0.6.152 相依。SDK、配方、數量、時間、指南、資產、模型、動畫、音效和保存 schema 保持；G130／private-integration／Ribbits1.0.10036不变。

T152 將同樣的摘要工作在已收分包中累積；順序傳輸 COMMIT 重用結果，亂序未完成摘要保留原回退。完整字串 UTF8 長度由已收分包與代理對邊界校正精確得到。提交／ACK 仍同步，沒有延後玩法或寫入；同輸入封包及錯誤結果保持，新版本身份另有摘要。

来源差分不是BDS/watchdog或真人效果驗收。W128/T151 舊完整家族與公開證據維持原身份；本候選須自己的實際CI、停服存檔首次／重啟、family_guard准入、live與公開下載讀回。client=false、production_ready=false；剩餘啟動警告及真人UI另列。
