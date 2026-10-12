# 世界名酒 0.1.129 測試版

配對酒館 **0.6.152**。酒館將接收資料的 UTF8 位元組與 FNV 校驗分散到收到的 chunk；正常順序的 COMMIT 不再重算整串校驗。亂序仍保留原有 digest fallback，JSON 解析、registry 安裝與 ACK 維持同步。W129 只更新包／模組／payload 身份及相依，SDK、配方、數量、時間、指南、模型、動畫、音效與保存保持。

公開 mcaddon 直接封裝 canonical runtime/BP、runtime/RP；私有第三方來源與宿主整合不包含在公開包。G130、private1.0.34、Ribbits1.0.10036 保持。T151／W128 的啟動仍有 watchdog，來源校驗次數減少不能當作原生效能或真人畫面通過。

本候選完整家族 CI、停服存檔副本首次／重啟、准入、LIVE 及公開下載讀回由[家族索引](https://github.com/casama233/kaleidoscope-tavern-unofficial/blob/main/family/BASELINE-STATUS.md)記錄；`client=false`、`production_ready=false`，未使用模擬玩家。歷史證據維持原身份。
